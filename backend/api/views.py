from rest_framework import permissions, views, generics
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Max, Q, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .serializers import (
    UserSerializer,
    DashboardSummarySerializer,
    DeckSerializer,
    DeckCreateSerializer,
    DeckDetailsSerializer,
    StudyQueueResponseSerializer,
    StudyAnswerSerializer,
)
from .models import (
    Deck,
    DeckParticipant,
    Card,
    CardReview,
    StudySession,
    StudyEvent,
    TestResult,
)


class MeView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class PingView(views.APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        return Response({"status": "ok"})


class DashboardSummaryView(views.APIView):
    """
    Get dashboard summary metrics for authenticated user
    Returns learning progress, average test score, and total study time
    """
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        
        # Calculate metrics
        # Learning progress: percentage of decks that have been studied at least once
        total_decks = user.decks.count()
        # Use subquery to efficiently count distinct decks with study sessions
        studied_decks = user.decks.filter(
            study_sessions__isnull=False
        ).distinct().count()
        learning_progress = (studied_decks / total_decks * 100) if total_decks > 0 else 0
        
        # Average test score
        avg_score = TestResult.objects.filter(user=user).aggregate(
            avg=Avg('score_percent')
        )['avg'] or 0
        
        # Total study time in seconds
        total_study_time = StudySession.objects.filter(user=user).aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0
        
        data = {
            'learningProgressPercent': round(learning_progress, 1),
            'averageTestScore': round(avg_score, 1),
            'totalStudySeconds': total_study_time
        }
        
        # Return data directly instead of serializing
        return Response(data)


class DeckListView(generics.ListCreateAPIView):
    """
    List all decks for authenticated user or create a new deck
    """
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        # Use DeckCreateSerializer for POST, DeckSerializer for GET
        if self.request.method == 'POST':
            return DeckCreateSerializer
        return DeckSerializer
    
    def get_queryset(self):
        # Annotate with card count and last studied date for efficient query
        # This prevents N+1 queries when serializing
        return Deck.objects.filter(owner=self.request.user).annotate(
            card_count=Count('cards'),
            last_studied_at=Max('study_sessions__started_at', filter=Q(study_sessions__user=self.request.user))
        )
    
    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)


class DeckDetailView(views.APIView):
    """
    Return deck details, stats, and leaderboard for a single deck.
    Private decks are only visible to the owner.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, deck_id):
        deck = get_object_or_404(Deck.objects.select_related('owner'), pk=deck_id)
        is_owner = deck.owner_id == request.user.id

        if deck.visibility == 'private' and not is_owner:
            return Response({'detail': 'Access denied.'}, status=403)

        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        total_cards = deck.cards.count()
        participants_count = DeckParticipant.objects.filter(deck=deck).count()
        total_study_seconds = StudySession.objects.filter(deck=deck).aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0

        top_results = (
            TestResult.objects.filter(deck=deck)
            .select_related('user')
            .order_by('-score_percent', 'created_at')[:10]
        )
        leaderboard = [
            {
                'rank': index + 1,
                'userDisplayName': result.user.username,
                'scorePercent': result.score_percent,
                'createdAt': result.created_at,
            }
            for index, result in enumerate(top_results)
        ]

        cards_preview = [
            {
                'id': card.id,
                'frontText': card.front_text,
                'colorTag': card.color_tag,
            }
            for card in deck.cards.order_by('created_at')[:5]
        ]

        data = {
            'id': deck.id,
            'name': deck.name,
            'description': deck.description,
            'visibility': deck.visibility,
            'totalCards': total_cards,
            'participantsCount': participants_count,
            'totalStudySeconds': total_study_seconds,
            'isOwner': is_owner,
            'leaderboard': leaderboard,
            'cardsPreview': cards_preview,
        }

        serializer = DeckDetailsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DeckStudyQueueView(views.APIView):
    """
    Return a study queue for the deck based on due cards.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, deck_id):
        deck = get_object_or_404(Deck, pk=deck_id)
        is_owner = deck.owner_id == request.user.id

        if deck.visibility == 'private' and not is_owner:
            return Response({'detail': 'Access denied.'}, status=403)

        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        now = timezone.now()
        due_reviews = (
            CardReview.objects.filter(deck=deck, user=request.user, next_due_at__lte=now)
            .select_related('card')
            .order_by('next_due_at')
        )
        due_cards = [review.card for review in due_reviews]
        review_map = {review.card_id: review for review in due_reviews}

        reviewed_card_ids = CardReview.objects.filter(
            deck=deck,
            user=request.user,
        ).values_list('card_id', flat=True)

        remaining_slots = max(0, 10 - len(due_cards))
        new_cards = list(
            deck.cards.exclude(id__in=reviewed_card_ids).order_by('created_at')[:remaining_slots]
        )

        items = due_cards + new_cards

        data = {
            'deckId': deck.id,
            'deckName': deck.name,
            'total': len(items),
            'items': [
                {
                    'cardId': card.id,
                    'frontText': card.front_text,
                    'backText': card.back_text,
                    'colorTag': card.color_tag,
                    'dueAt': review_map.get(card.id).next_due_at if review_map.get(card.id) else None,
                }
                for card in items
            ],
        }

        serializer = StudyQueueResponseSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DeckStudyAnswerView(views.APIView):
    """
    Accept an answer rating and update spaced repetition data.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, deck_id):
        deck = get_object_or_404(Deck, pk=deck_id)
        is_owner = deck.owner_id == request.user.id

        if deck.visibility == 'private' and not is_owner:
            return Response({'detail': 'Access denied.'}, status=403)

        serializer = StudyAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        card_id = serializer.validated_data['cardId']
        rating = serializer.validated_data['rating']
        elapsed_seconds = serializer.validated_data.get('elapsedSeconds') or 0

        card = get_object_or_404(Card, pk=card_id, deck=deck)
        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        interval_days = 0
        if rating == 'hard':
            interval_days = 1
        elif rating == 'easy':
            interval_days = 4

        now = timezone.now()
        if rating == 'again':
            next_due_at = now + timedelta(minutes=5)
        else:
            next_due_at = now + timedelta(days=interval_days)

        review, _ = CardReview.objects.get_or_create(
            user=request.user,
            card=card,
            defaults={'deck': deck},
        )
        review.deck = deck
        review.last_rating = rating
        review.last_reviewed_at = now
        review.next_due_at = next_due_at
        review.interval_days = interval_days
        review.save(update_fields=[
            'deck',
            'last_rating',
            'last_reviewed_at',
            'next_due_at',
            'interval_days',
        ])

        StudyEvent.objects.create(
            user=request.user,
            deck=deck,
            card=card,
            rating=rating,
            duration_seconds=elapsed_seconds,
        )

        if elapsed_seconds:
            DeckParticipant.objects.filter(deck=deck, user=request.user).update(
                total_study_seconds=F('total_study_seconds') + elapsed_seconds
            )
            StudySession.objects.create(
                user=request.user,
                deck=deck,
                started_at=now - timedelta(seconds=elapsed_seconds),
                ended_at=now,
                duration_seconds=elapsed_seconds,
            )

        return Response({'nextDueAt': next_due_at})
