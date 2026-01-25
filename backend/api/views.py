from rest_framework import permissions, views, generics
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Max, Q
from django.shortcuts import get_object_or_404
from .serializers import (
    UserSerializer,
    DashboardSummarySerializer,
    DeckSerializer,
    DeckCreateSerializer,
    DeckDetailsSerializer,
)
from .models import Deck, DeckParticipant, StudySession, TestResult


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
