from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Deck, Card


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


class CardSerializer(serializers.ModelSerializer):
    """Serializer for individual flashcards"""
    class Meta:
        model = Card
        fields = ['id', 'front_text', 'back_text', 'color_tag', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


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


class DeckCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating decks with cards"""
    cards = CardSerializer(many=True, required=False)
    
    class Meta:
        model = Deck
        fields = [
            'id', 'name', 'description', 'visibility',
            'test_shuffle', 'test_sequential', 'study_spaced_repetition',
            'cards', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate deck name is not empty or whitespace-only and has minimum length"""
        if not value or not value.strip():
            raise serializers.ValidationError("Deck name cannot be blank or whitespace only.")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Deck name must be at least 3 characters long.")
        return value.strip()
    
    def validate(self, attrs):
        """Validate test mode settings - if sequential is ON, shuffle should be OFF"""
        test_sequential = attrs.get('test_sequential', False)
        test_shuffle = attrs.get('test_shuffle', True)
        
        if test_sequential and test_shuffle:
            raise serializers.ValidationError({
                'test_shuffle': 'Shuffle must be OFF when Sequential is ON.'
            })
        
        return attrs
    
    def create(self, validated_data):
        cards_data = validated_data.pop('cards', [])
        deck = Deck.objects.create(**validated_data)
        
        # Create cards if provided
        for card_data in cards_data:
            Card.objects.create(deck=deck, **card_data)
        
        return deck


class DashboardSummarySerializer(serializers.Serializer):
    learningProgressPercent = serializers.FloatField()
    averageTestScore = serializers.FloatField()
    totalStudySeconds = serializers.IntegerField()


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    userDisplayName = serializers.CharField()
    scorePercent = serializers.FloatField()
    createdAt = serializers.DateTimeField()


class DeckCardPreviewSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    frontText = serializers.CharField()
    colorTag = serializers.CharField(allow_null=True, allow_blank=True, required=False)


class DeckDetailsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    visibility = serializers.ChoiceField(choices=Deck.VISIBILITY_CHOICES)
    totalCards = serializers.IntegerField()
    participantsCount = serializers.IntegerField()
    totalStudySeconds = serializers.IntegerField()
    isOwner = serializers.BooleanField()
    leaderboard = LeaderboardEntrySerializer(many=True)
    cardsPreview = DeckCardPreviewSerializer(many=True, required=False)


class StudyQueueItemSerializer(serializers.Serializer):
    cardId = serializers.IntegerField()
    frontText = serializers.CharField()
    backText = serializers.CharField()
    colorTag = serializers.CharField(allow_null=True, allow_blank=True, required=False)
    dueAt = serializers.DateTimeField(allow_null=True, required=False)


class StudyQueueResponseSerializer(serializers.Serializer):
    deckId = serializers.IntegerField()
    deckName = serializers.CharField()
    total = serializers.IntegerField()
    items = StudyQueueItemSerializer(many=True)


class StudyAnswerSerializer(serializers.Serializer):
    cardId = serializers.IntegerField()
    rating = serializers.ChoiceField(choices=['again', 'hard', 'easy'])
    elapsedSeconds = serializers.IntegerField(required=False, min_value=0)
