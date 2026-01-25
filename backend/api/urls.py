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
    path('auth/me/', views.MeView.as_view(), name='auth_me'),
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('decks/', views.DeckListView.as_view(), name='deck_list'),
    path('decks/<int:deck_id>/', views.DeckDetailView.as_view(), name='deck_detail'),
    path('decks/<int:deck_id>/study/queue/', views.DeckStudyQueueView.as_view(), name='deck_study_queue'),
    path('decks/<int:deck_id>/study/answer/', views.DeckStudyAnswerView.as_view(), name='deck_study_answer'),
    path('decks/<int:deck_id>/test/start/', views.DeckTestStartView.as_view(), name='deck_test_start'),
    path('decks/<int:deck_id>/test/answer/', views.DeckTestAnswerView.as_view(), name='deck_test_answer'),
    path('decks/<int:deck_id>/test/finish/', views.DeckTestFinishView.as_view(), name='deck_test_finish'),
]
