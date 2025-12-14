from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Avg
from rest_framework import serializers
from .models import Deck, Card, StudySession, TestResult


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
    lastStudiedAt = serializers.SerializerMethodField()
    
    class Meta:
        model = Deck
        fields = ['id', 'name', 'totalCards', 'visibility', 'lastStudiedAt', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_lastStudiedAt(self, obj):
        # Get the most recent study session for this deck by the owner
        last_session = obj.study_sessions.filter(user=obj.owner).order_by('-started_at').first()
        return last_session.started_at.isoformat() if last_session else None


class DashboardSummarySerializer(serializers.Serializer):
    learningProgressPercent = serializers.FloatField()
    averageTestScore = serializers.FloatField()
    totalStudySeconds = serializers.IntegerField()
