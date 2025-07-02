from django.urls import path
from .views import UserRegistrationView, CustomObtainAuthTokenView, UserLogoutView, UserDetailView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', CustomObtainAuthTokenView.as_view(), name='user-login'), # Obtain token
    path('logout/', UserLogoutView.as_view(), name='user-logout'),
    path('profile/', UserDetailView.as_view(), name='user-profile'), # Get current user details
]
