from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Deck, Card, StudySession, TestResult
from django.utils import timezone

class AuthTests(APITestCase):
    def setUp(self):
        self.username = 'testuser'
        self.email = 'test@example.com'
        self.password = 'testpass123'
        self.user = User.objects.create_user(username=self.username, email=self.email, password=self.password)
        self.login_url = reverse('auth_login')
        self.logout_url = reverse('auth_logout')
        self.me_url = reverse('auth_me')

    def test_login_success(self):
        data = {
            'username': self.username,
            'password': self.password
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        # Check if session is created
        self.assertIn('_auth_user_id', self.client.session)

    def test_login_failure(self):
        data = {
            'username': self.username,
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('_auth_user_id', self.client.session)

    def test_me_authenticated(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['email'], self.email)

    def test_me_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertNotIn('_auth_user_id', self.client.session)


class DashboardSummaryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='testpass123')
        self.url = reverse('dashboard_summary')

    def test_unauthenticated_request_rejected(self):
        """Test that unauthenticated requests are rejected"""
        response = self.client.get(self.url)
        # JWT auth returns 401, session auth returns 403
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_authenticated_user_receives_metrics(self):
        """Test that authenticated users receive correct metrics"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('learningProgressPercent', response.data)
        self.assertIn('averageTestScore', response.data)
        self.assertIn('totalStudySeconds', response.data)

    def test_zero_decks_returns_zero_progress(self):
        """Test that users with no decks get 0% progress"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['learningProgressPercent'], 0)

    def test_zero_study_sessions_returns_zero_time(self):
        """Test that users with no study sessions get 0 study time"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['totalStudySeconds'], 0)

    def test_metrics_calculation_with_data(self):
        """Test that metrics are calculated correctly with actual data"""
        # Create decks
        deck1 = Deck.objects.create(owner=self.user, name='Deck 1', visibility='private')
        deck2 = Deck.objects.create(owner=self.user, name='Deck 2', visibility='public')
        
        # Create study sessions for deck1 only
        now = timezone.now()
        StudySession.objects.create(
            user=self.user,
            deck=deck1,
            started_at=now,
            ended_at=now + timezone.timedelta(seconds=1800),
            duration_seconds=1800
        )
        
        # Create test results
        TestResult.objects.create(user=self.user, deck=deck1, score_percent=85.0)
        TestResult.objects.create(user=self.user, deck=deck2, score_percent=75.0)
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['learningProgressPercent'], 50.0)  # 1 of 2 decks studied
        self.assertEqual(response.data['averageTestScore'], 80.0)  # (85 + 75) / 2
        self.assertEqual(response.data['totalStudySeconds'], 1800)

    def test_metrics_isolated_between_users(self):
        """Test that metrics are isolated per user"""
        # Create data for self.user
        deck1 = Deck.objects.create(owner=self.user, name='User Deck', visibility='private')
        StudySession.objects.create(
            user=self.user,
            deck=deck1,
            duration_seconds=1000
        )
        
        # Create data for other_user
        deck2 = Deck.objects.create(owner=self.other_user, name='Other Deck', visibility='private')
        StudySession.objects.create(
            user=self.other_user,
            deck=deck2,
            duration_seconds=2000
        )
        
        # Check self.user only sees their data
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.data['totalStudySeconds'], 1000)
        self.assertEqual(response.data['learningProgressPercent'], 100.0)


class DeckListTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='testpass123')
        self.url = reverse('deck_list')

    def test_unauthenticated_request_rejected(self):
        """Test that unauthenticated requests are rejected"""
        response = self.client.get(self.url)
        # JWT auth returns 401, session auth returns 403
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_list_decks_returns_only_user_decks(self):
        """Test that listing decks returns only the authenticated user's decks"""
        # Create decks for both users
        user_deck = Deck.objects.create(owner=self.user, name='User Deck', visibility='private')
        other_deck = Deck.objects.create(owner=self.other_user, name='Other Deck', visibility='public')
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'User Deck')
        self.assertEqual(response.data[0]['id'], user_deck.id)

    def test_create_deck_auto_assigns_owner(self):
        """Test that creating a deck automatically assigns the current user as owner"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'New Deck',
            'visibility': 'public'
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Deck')
        
        # Verify the deck was created with correct owner
        deck = Deck.objects.get(id=response.data['id'])
        self.assertEqual(deck.owner, self.user)

    def test_card_count_annotation_works(self):
        """Test that card count annotation works correctly"""
        deck = Deck.objects.create(owner=self.user, name='Test Deck', visibility='private')
        Card.objects.create(deck=deck, front_text='Front 1', back_text='Back 1')
        Card.objects.create(deck=deck, front_text='Front 2', back_text='Back 2')
        Card.objects.create(deck=deck, front_text='Front 3', back_text='Back 3')
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['totalCards'], 3)

    def test_last_studied_at_annotation_works(self):
        """Test that lastStudiedAt annotation works correctly"""
        deck = Deck.objects.create(owner=self.user, name='Test Deck', visibility='private')
        now = timezone.now()
        StudySession.objects.create(
            user=self.user,
            deck=deck,
            started_at=now,
            ended_at=now + timezone.timedelta(seconds=600),
            duration_seconds=600
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data[0]['lastStudiedAt'])

    def test_deck_name_validation(self):
        """Test that deck name validation works"""
        self.client.force_authenticate(user=self.user)
        
        # Test empty name
        response = self.client.post(self.url, {'name': '', 'visibility': 'private'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test whitespace-only name
        response = self.client.post(self.url, {'name': '   ', 'visibility': 'private'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test name too short
        response = self.client.post(self.url, {'name': 'AB', 'visibility': 'private'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid name
        response = self.client.post(self.url, {'name': 'Valid Deck Name', 'visibility': 'private'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_owner_field_is_read_only(self):
        """Test that owner field cannot be set by user"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Test Deck',
            'visibility': 'private',
            'owner': self.other_user.id  # Attempt to set owner
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify the owner is still the authenticated user, not other_user
        deck = Deck.objects.get(id=response.data['id'])
        self.assertEqual(deck.owner, self.user)
        self.assertNotEqual(deck.owner, self.other_user)

