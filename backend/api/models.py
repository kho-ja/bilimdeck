from django.db import models
from django.contrib.auth.models import User


class Deck(models.Model):
    """Flashcard deck owned by a user"""
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='decks')
    name = models.CharField(max_length=200, blank=False)
    description = models.TextField(blank=True, null=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    
    # Test mode settings
    test_shuffle = models.BooleanField(default=True, help_text="Shuffle cards in test mode")
    test_sequential = models.BooleanField(default=False, help_text="Show cards sequentially in test mode")
    
    # Study mode settings (spaced repetition)
    study_spaced_repetition = models.BooleanField(default=True, help_text="Enable spaced repetition for study mode")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.name} ({self.owner.username})"


RATING_CHOICES = [
    ('again', 'Again'),
    ('hard', 'Hard'),
    ('easy', 'Easy'),
]


class DeckParticipant(models.Model):
    """Track users who participate in a deck"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deck_participations')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='participants')
    joined_at = models.DateTimeField(auto_now_add=True)
    total_study_seconds = models.IntegerField(default=0)

    class Meta:
        ordering = ['-joined_at']
        unique_together = ('user', 'deck')

    def __str__(self):
        return f"{self.user.username} joined {self.deck.name}"


class Card(models.Model):
    """Individual flashcard in a deck"""
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='cards')
    front_text = models.TextField(blank=False)
    back_text = models.TextField(blank=False)
    color_tag = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Card in {self.deck.name}"


class CardReview(models.Model):
    """Track spaced repetition data for a card and user."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='card_reviews')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='card_reviews')
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='card_reviews')
    last_rating = models.CharField(max_length=10, choices=RATING_CHOICES, blank=True, null=True)
    last_reviewed_at = models.DateTimeField(blank=True, null=True)
    next_due_at = models.DateTimeField(blank=True, null=True, db_index=True)
    interval_days = models.IntegerField(default=0)
    ease_factor = models.FloatField(default=2.5)

    class Meta:
        ordering = ['next_due_at', 'id']
        unique_together = ('user', 'card')

    def __str__(self):
        return f"{self.user.username} review {self.card.id}"


class StudySession(models.Model):
    """Track when user studies a deck"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='study_sessions')
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} studied {self.deck.name}"


class TestResult(models.Model):
    """Store test results for a deck"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_results')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='test_results')
    score_percent = models.FloatField()  # 0-100
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.deck.name}: {self.score_percent}%"


TEST_MODE_CHOICES = [
    ('shuffle', 'Shuffle'),
    ('sequential', 'Sequential'),
]


class TestAttempt(models.Model):
    """Track a single test attempt for a deck."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_attempts')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='test_attempts')
    mode = models.CharField(max_length=20, choices=TEST_MODE_CHOICES)
    total_questions = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    total_seconds = models.IntegerField(null=True, blank=True)
    score_percent = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} test {self.deck.name} ({self.mode})"


class TestAnswer(models.Model):
    """Store answers for a test attempt."""
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='test_answers')
    answer_text = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    elapsed_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']
        unique_together = ('attempt', 'card')

    def __str__(self):
        return f"{self.attempt.id} - {self.card.id}"


class StudyEvent(models.Model):
    """Record a single study answer event."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_events')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='study_events')
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='study_events')
    rating = models.CharField(max_length=10, choices=RATING_CHOICES)
    duration_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.card.id} {self.rating}"
