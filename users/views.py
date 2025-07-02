from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.views import APIView

# Serializer for User Registration (can be expanded)
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # email = serializers.EmailField(required=True) # Example: make email required

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')
        # extra_kwargs = {'email': {'required': True}}


    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] # Anyone can register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'user': serializer.data, # Or a more limited user representation
                'token': token.key
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class CustomObtainAuthTokenView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })

class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # Delete the token to invalidate it
            request.user.auth_token.delete()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except (AttributeError, Token.DoesNotExist):
            return Response({"detail": "No active token found or already logged out."}, status=status.HTTP_400_BAD_REQUEST)


# Optional: View to get current user details
class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer # Or a more detailed/controlled User serializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
