from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Deck


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'), username=username, password=password)
            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "username" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class DeckSerializer(serializers.ModelSerializer):
    totalCards = serializers.IntegerField(source='card_count', read_only=True)
    lastStudiedAt = serializers.DateTimeField(source='last_studied_at', read_only=True, allow_null=True)
    
    class Meta:
        model = Deck
        fields = ['id', 'name', 'totalCards', 'visibility', 'lastStudiedAt', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'owner']
    
    def validate_name(self, value):
        """Validate deck name is not empty or whitespace-only and has minimum length"""
        if not value or not value.strip():
            raise serializers.ValidationError("Deck name cannot be blank or whitespace only.")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Deck name must be at least 3 characters long.")
        return value.strip()


class DashboardSummarySerializer(serializers.Serializer):
    learningProgressPercent = serializers.FloatField()
    averageTestScore = serializers.FloatField()
    totalStudySeconds = serializers.IntegerField()
