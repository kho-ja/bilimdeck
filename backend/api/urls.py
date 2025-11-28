from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
	path('ping/', views.PingView.as_view()),
	path('auth/register/', views.RegisterView.as_view(), name='auth_register'),
	path('auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
	path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
	path('auth/logout/', views.LogoutView.as_view(), name='auth_logout'),
	path('auth/me/', views.UserMeView.as_view(), name='auth_me'),
]
