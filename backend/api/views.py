from rest_framework import permissions, status, views, generics
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg
from .serializers import UserSerializer, DashboardSummarySerializer, DeckSerializer
from .models import Deck, StudySession, TestResult


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
        studied_decks = user.decks.filter(study_sessions__user=user).distinct().count()
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
        
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)


class DeckListView(generics.ListCreateAPIView):
    """
    List all decks for authenticated user or create a new deck
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = DeckSerializer
    
    def get_queryset(self):
        # Annotate with card count for efficient query
        return Deck.objects.filter(owner=self.request.user).annotate(
            card_count=Count('cards')
        )
    
    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)
