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


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username is already taken.')
        return value


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


class CardEditSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Card
        fields = ['id', 'front_text', 'back_text', 'color_tag']


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


class JoinedDeckSerializer(serializers.ModelSerializer):
    totalCards = serializers.IntegerField(source='card_count', read_only=True)
    lastStudiedAt = serializers.DateTimeField(source='last_studied_at', read_only=True, allow_null=True)
    joinedAt = serializers.DateTimeField(source='joined_at', read_only=True, allow_null=True)
    ownerDisplayName = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Deck
        fields = ['id', 'name', 'totalCards', 'visibility', 'lastStudiedAt', 'joinedAt', 'ownerDisplayName', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PublicDeckSerializer(serializers.ModelSerializer):
    totalCards = serializers.IntegerField(source='card_count', read_only=True)
    ownerDisplayName = serializers.CharField(source='owner.username', read_only=True)
    isParticipant = serializers.SerializerMethodField()

    class Meta:
        model = Deck
        fields = ['id', 'name', 'description', 'visibility', 'totalCards', 'ownerDisplayName', 'isParticipant', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_isParticipant(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return obj.participants.filter(user=user).exists()


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


class DeckEditSerializer(serializers.ModelSerializer):
    cards = CardEditSerializer(many=True, read_only=True)

    class Meta:
        model = Deck
        fields = [
            'id', 'name', 'description', 'visibility',
            'test_shuffle', 'test_sequential', 'study_spaced_repetition',
            'cards', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DeckUpdateSerializer(serializers.ModelSerializer):
    cards = CardEditSerializer(many=True, required=False)

    class Meta:
        model = Deck
        fields = [
            'name', 'description', 'visibility',
            'test_shuffle', 'test_sequential', 'study_spaced_repetition',
            'cards'
        ]

    def validate(self, attrs):
        test_sequential = attrs.get('test_sequential', self.instance.test_sequential if self.instance else False)
        test_shuffle = attrs.get('test_shuffle', self.instance.test_shuffle if self.instance else True)

        if test_sequential and test_shuffle:
            raise serializers.ValidationError({
                'test_shuffle': 'Shuffle must be OFF when Sequential is ON.'
            })

        return attrs


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
    testShuffle = serializers.BooleanField()
    testSequential = serializers.BooleanField()
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


class ParticipationRankingSerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    userId = serializers.IntegerField()
    userDisplayName = serializers.CharField()
    totalStudySeconds = serializers.IntegerField()
    bestScorePercent = serializers.FloatField(allow_null=True)
    avgScorePercent = serializers.FloatField(allow_null=True)
    attemptsCount = serializers.IntegerField()
    lastActiveAt = serializers.DateTimeField(allow_null=True)


class ParticipationSummarySerializer(serializers.Serializer):
    deckId = serializers.IntegerField()
    deckName = serializers.CharField()
    visibility = serializers.ChoiceField(choices=Deck.VISIBILITY_CHOICES)
    isOwner = serializers.BooleanField()
    isParticipant = serializers.BooleanField()
    participantsCount = serializers.IntegerField()
    totalStudySecondsAll = serializers.IntegerField()
    totalTestAttemptsAll = serializers.IntegerField()
    ranking = ParticipationRankingSerializer(many=True)


class ParticipationJoinSerializer(serializers.Serializer):
    isParticipant = serializers.BooleanField()


class TestStartSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=['shuffle', 'sequential'], required=False)


class TestQuestionSerializer(serializers.Serializer):
    cardId = serializers.IntegerField()
    frontText = serializers.CharField()
    backText = serializers.CharField()


class TestStartResponseSerializer(serializers.Serializer):
    attemptId = serializers.IntegerField()
    mode = serializers.ChoiceField(choices=['shuffle', 'sequential'])
    total = serializers.IntegerField()
    questions = TestQuestionSerializer(many=True)


class TestAnswerSerializer(serializers.Serializer):
    attemptId = serializers.IntegerField()
    cardId = serializers.IntegerField()
    answerText = serializers.CharField(allow_blank=True)
    elapsedSeconds = serializers.IntegerField(required=False, min_value=0)


class TestAnswerResponseSerializer(serializers.Serializer):
    isCorrect = serializers.BooleanField()
    correctAnswer = serializers.CharField()


class TestReviewItemSerializer(serializers.Serializer):
    cardId = serializers.IntegerField()
    frontText = serializers.CharField()
    userAnswer = serializers.CharField()
    correctAnswer = serializers.CharField()
    isCorrect = serializers.BooleanField()


class TestFinishSerializer(serializers.Serializer):
    attemptId = serializers.IntegerField()


class TestFinishResponseSerializer(serializers.Serializer):
    attemptId = serializers.IntegerField()
    scorePercent = serializers.FloatField()
    correctCount = serializers.IntegerField()
    total = serializers.IntegerField()
    totalSeconds = serializers.IntegerField()
    review = TestReviewItemSerializer(many=True)
    leaderboard = LeaderboardEntrySerializer(many=True)

class PublicDeckSearchRequestSerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, max_length=200)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=25, default=10)


class PublicDeckSearchResultSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    ownerDisplayName = serializers.CharField()
    totalCards = serializers.IntegerField()
    route = serializers.CharField()


class PublicDeckSearchResponseSerializer(serializers.Serializer):
    query = serializers.CharField(allow_blank=True)
    count = serializers.IntegerField()
    results = PublicDeckSearchResultSerializer(many=True)


class AiCreateCardSerializer(serializers.Serializer):
    frontText = serializers.CharField(max_length=1000)
    backText = serializers.CharField(max_length=1000)
    colorTag = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)


class AiCreateDeckRequestSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=3, max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=2000)
    visibility = serializers.ChoiceField(choices=Deck.VISIBILITY_CHOICES, required=False, default='private')
    cards = AiCreateCardSerializer(many=True, min_length=1, max_length=100)


class AiCreateDeckResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    visibility = serializers.ChoiceField(choices=Deck.VISIBILITY_CHOICES)
    totalCards = serializers.IntegerField()
    route = serializers.CharField()


class AiOpenDeckRequestSerializer(serializers.Serializer):
    deckId = serializers.IntegerField(required=False)
    query = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate(self, attrs):
        if not attrs.get('deckId') and not (attrs.get('query') or '').strip():
            raise serializers.ValidationError('Provide either deckId or query.')
        return attrs


class AiOpenDeckResponseSerializer(serializers.Serializer):
    deckId = serializers.IntegerField()
    route = serializers.CharField()
    canAccess = serializers.BooleanField()
