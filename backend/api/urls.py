from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

urlpatterns = [
    path('ping/', views.PingView.as_view()),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.RegisterView.as_view(), name='auth_register'),
    path('auth/me/', views.MeView.as_view(), name='auth_me'),
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('decks/', views.DeckListView.as_view(), name='deck_list'),
    path('decks/public/', views.PublicDeckListView.as_view(), name='deck_public_list'),
    path('decks/joined/', views.JoinedDeckListView.as_view(), name='deck_joined_list'),
    path('decks/<int:deck_id>/', views.DeckDetailView.as_view(), name='deck_detail'),
    path('decks/<int:deck_id>/edit/', views.DeckEditView.as_view(), name='deck_edit'),
    path('decks/<int:deck_id>/study/queue/', views.DeckStudyQueueView.as_view(), name='deck_study_queue'),
    path('decks/<int:deck_id>/study/answer/', views.DeckStudyAnswerView.as_view(), name='deck_study_answer'),
    path('decks/<int:deck_id>/test/start/', views.DeckTestStartView.as_view(), name='deck_test_start'),
    path('decks/<int:deck_id>/test/answer/', views.DeckTestAnswerView.as_view(), name='deck_test_answer'),
    path('decks/<int:deck_id>/test/finish/', views.DeckTestFinishView.as_view(), name='deck_test_finish'),
    path('decks/<int:deck_id>/participation/join/', views.DeckParticipationJoinView.as_view(), name='deck_participation_join'),
    path('decks/<int:deck_id>/participation/summary/', views.DeckParticipationSummaryView.as_view(), name='deck_participation_summary'),
]
