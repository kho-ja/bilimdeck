from django.db import models
from django.contrib.auth.models import User


class Deck(models.Model):
    """Flashcard deck owned by a user"""
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='decks')
    name = models.CharField(max_length=200)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class Card(models.Model):
    """Individual flashcard in a deck"""
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='cards')
    front_text = models.TextField()
    back_text = models.TextField()
    color_tag = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Card in {self.deck.name}"


class StudySession(models.Model):
    """Track when user studies a deck"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name='study_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
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
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.deck.name}: {self.score_percent}%"
