from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

class UserAuthTests(APITestCase):

    def test_user_registration_success(self):
        """
        Ensure new user can be registered and a token is returned.
        """
        url = reverse('user-register')
        data = {
            'username': 'testuser',
            'password': 'testpassword123',
            'email': 'testuser@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('token' in response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertTrue(User.objects.filter(username='testuser').exists())
        self.assertTrue(Token.objects.filter(user__username='testuser').exists())

    def test_user_registration_missing_username(self):
        """
        Ensure registration fails if username is missing.
        """
        url = reverse('user-register')
        data = {
            'password': 'testpassword123',
            'email': 'testuser@example.com'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('username' in response.data)

    def test_user_registration_missing_password(self):
        """
        Ensure registration fails if password is missing.
        """
        url = reverse('user-register')
        data = {
            'username': 'testuser2',
            'email': 'testuser2@example.com'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('password' in response.data)

    def test_user_registration_duplicate_username(self):
        """
        Ensure registration fails if username already exists.
        """
        User.objects.create_user(username='existinguser', password='password123')
        url = reverse('user-register')
        data = {
            'username': 'existinguser',
            'password': 'newpassword123',
            'email': 'newemail@example.com'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('username' in response.data) # Should indicate username already exists

    def test_user_login_success(self):
        """
        Ensure existing user can log in and receive a token.
        """
        user = User.objects.create_user(username='loginuser', password='loginpassword123', email='login@example.com')
        url = reverse('user-login')
        data = {
            'username': 'loginuser',
            'password': 'loginpassword123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('token' in response.data)
        self.assertEqual(response.data['user_id'], user.pk)
        self.assertEqual(response.data['username'], 'loginuser')
        # Ensure a token was created or retrieved for the user
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_user_login_invalid_credentials_wrong_password(self):
        """
        Ensure login fails with incorrect password.
        """
        User.objects.create_user(username='loginuser2', password='correctpassword')
        url = reverse('user-login')
        data = {
            'username': 'loginuser2',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('non_field_errors' in response.data or 'detail' in response.data)


    def test_user_login_invalid_credentials_wrong_username(self):
        """
        Ensure login fails with non-existent username.
        """
        url = reverse('user-login')
        data = {
            'username': 'nonexistentuser',
            'password': 'anypassword'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('non_field_errors' in response.data or 'detail' in response.data)

    def test_user_logout_success(self):
        """
        Ensure authenticated user can log out and token is deleted.
        """
        user = User.objects.create_user(username='logoutuser', password='logoutpassword123')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        url = reverse('user-logout')
        response = self.client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], "Successfully logged out.")
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_user_logout_without_token(self):
        """
        Ensure logout fails if no token is provided (user is not authenticated).
        """
        # No client.credentials() set
        url = reverse('user-logout')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Expect 403 if not authenticated

    def test_user_profile_retrieve_success(self):
        """
        Ensure authenticated user can retrieve their profile.
        """
        user = User.objects.create_user(username='profileuser', password='profilepassword', email='profile@example.com', first_name="Profile", last_name="User")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        url = reverse('user-profile')
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], user.username)
        self.assertEqual(response.data['email'], user.email)
        self.assertEqual(response.data['first_name'], user.first_name)
        self.assertEqual(response.data['last_name'], user.last_name)

    def test_user_profile_retrieve_unauthenticated(self):
        """
        Ensure unauthenticated user cannot retrieve profile.
        """
        url = reverse('user-profile')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Expect 403 if not authenticated
