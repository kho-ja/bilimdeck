from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
