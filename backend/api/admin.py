from django.contrib import admin
from .models import Deck, DeckParticipant, Card, StudySession, TestResult


@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'visibility', 'created_at', 'updated_at']
    list_filter = ['visibility', 'created_at']
    search_fields = ['name', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['deck', 'front_text_preview', 'back_text_preview', 'color_tag', 'created_at']
    list_filter = ['deck', 'created_at']
    search_fields = ['front_text', 'back_text']
    readonly_fields = ['created_at', 'updated_at']
    
    def front_text_preview(self, obj):
        return obj.front_text[:50] + ('...' if len(obj.front_text) > 50 else '')
    front_text_preview.short_description = 'Front Text'
    
    def back_text_preview(self, obj):
        return obj.back_text[:50] + ('...' if len(obj.back_text) > 50 else '')
    back_text_preview.short_description = 'Back Text'


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'deck', 'started_at', 'ended_at', 'duration_seconds']
    list_filter = ['started_at']
    search_fields = ['user__username', 'deck__name']
    readonly_fields = ['started_at']


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ['user', 'deck', 'score_percent', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'deck__name']
    readonly_fields = ['created_at']


@admin.register(DeckParticipant)
class DeckParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'deck', 'joined_at', 'total_study_seconds']
    list_filter = ['joined_at']
    search_fields = ['user__username', 'deck__name']
    readonly_fields = ['joined_at']
