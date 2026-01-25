import logging
import random
from rest_framework import permissions, views, generics
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Max, Q, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .serializers import (
    UserSerializer,
    DashboardSummarySerializer,
    DeckSerializer,
    DeckCreateSerializer,
    DeckDetailsSerializer,
    StudyQueueResponseSerializer,
    StudyAnswerSerializer,
    ParticipationSummarySerializer,
    ParticipationJoinSerializer,
    TestStartSerializer,
    TestStartResponseSerializer,
    TestAnswerSerializer,
    TestAnswerResponseSerializer,
    TestFinishSerializer,
    TestFinishResponseSerializer,
)
from .models import (
    Deck,
    DeckParticipant,
    Card,
    CardReview,
    StudySession,
    StudyEvent,
    TestResult,
    TestAttempt,
    TestAnswer,
)

logger = logging.getLogger(__name__)

def normalize_answer(text: str) -> str:
    return " ".join(text.strip().lower().split())


def get_user_display_name(user) -> str:
    full_name = user.get_full_name().strip()
    if full_name:
        return full_name
    if user.username:
        return user.username
    if user.email:
        return user.email.split('@')[0]
    return "User"


def get_deck_or_forbidden(request, deck_id):
    deck = get_object_or_404(Deck.objects.select_related('owner'), pk=deck_id)
    is_owner = deck.owner_id == request.user.id
    if deck.visibility == 'private' and not is_owner:
        return None, False
    return deck, is_owner


class MeView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class PingView(views.APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        return Response({"status": "ok"})


class DashboardSummaryView(views.APIView):
    """
    Get dashboard summary metrics for authenticated user
    Returns learning progress, average test score, and total study time
    """
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        
        # Calculate metrics
        # Learning progress: percentage of decks that have been studied at least once
        total_decks = user.decks.count()
        # Use subquery to efficiently count distinct decks with study sessions
        studied_decks = user.decks.filter(
            study_sessions__isnull=False
        ).distinct().count()
        learning_progress = (studied_decks / total_decks * 100) if total_decks > 0 else 0
        
        # Average test score
        avg_score = TestResult.objects.filter(user=user).aggregate(
            avg=Avg('score_percent')
        )['avg'] or 0
        
        # Total study time in seconds
        total_study_time = StudySession.objects.filter(user=user).aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0
        
        data = {
            'learningProgressPercent': round(learning_progress, 1),
            'averageTestScore': round(avg_score, 1),
            'totalStudySeconds': total_study_time
        }
        
        # Return data directly instead of serializing
        return Response(data)


class DeckListView(generics.ListCreateAPIView):
    """
    List all decks for authenticated user or create a new deck
    """
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_serializer_class(self):
        # Use DeckCreateSerializer for POST, DeckSerializer for GET
        if self.request.method == 'POST':
            return DeckCreateSerializer
        return DeckSerializer
    
    def get_queryset(self):
        # Annotate with card count and last studied date for efficient query
        # This prevents N+1 queries when serializing
        return Deck.objects.filter(owner=self.request.user).annotate(
            card_count=Count('cards'),
            last_studied_at=Max('study_sessions__started_at', filter=Q(study_sessions__user=self.request.user))
        )
    
    def perform_create(self, serializer):
        # Automatically set the owner to the current user
        serializer.save(owner=self.request.user)


class DeckDetailView(views.APIView):
    """
    Return deck details, stats, and leaderboard for a single deck.
    Private decks are only visible to the owner.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        total_cards = deck.cards.count()
        participants_count = DeckParticipant.objects.filter(deck=deck).count()
        total_study_seconds = StudySession.objects.filter(deck=deck).aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0

        top_results = (
            TestResult.objects.filter(deck=deck)
            .select_related('user')
            .order_by('-score_percent', 'created_at')[:10]
        )
        leaderboard = [
            {
                'rank': index + 1,
                'userDisplayName': result.user.username,
                'scorePercent': result.score_percent,
                'createdAt': result.created_at,
            }
            for index, result in enumerate(top_results)
        ]

        cards_preview = [
            {
                'id': card.id,
                'frontText': card.front_text,
                'colorTag': card.color_tag,
            }
            for card in deck.cards.order_by('created_at')[:5]
        ]

        data = {
            'id': deck.id,
            'name': deck.name,
            'description': deck.description,
            'visibility': deck.visibility,
            'testShuffle': deck.test_shuffle,
            'testSequential': deck.test_sequential,
            'totalCards': total_cards,
            'participantsCount': participants_count,
            'totalStudySeconds': total_study_seconds,
            'isOwner': is_owner,
            'leaderboard': leaderboard,
            'cardsPreview': cards_preview,
        }

        serializer = DeckDetailsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DeckStudyQueueView(views.APIView):
    """
    Return a study queue for the deck based on due cards.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        now = timezone.now()
        due_reviews = (
            CardReview.objects.filter(deck=deck, user=request.user, next_due_at__lte=now)
            .select_related('card')
            .order_by('next_due_at')
        )
        due_cards = [review.card for review in due_reviews]
        review_map = {review.card_id: review for review in due_reviews}

        reviewed_card_ids = CardReview.objects.filter(
            deck=deck,
            user=request.user,
        ).values_list('card_id', flat=True)

        remaining_slots = max(0, 10 - len(due_cards))
        new_cards = list(
            deck.cards.exclude(id__in=reviewed_card_ids).order_by('created_at')[:remaining_slots]
        )

        items = due_cards + new_cards

        data = {
            'deckId': deck.id,
            'deckName': deck.name,
            'total': len(items),
            'items': [
                {
                    'cardId': card.id,
                    'frontText': card.front_text,
                    'backText': card.back_text,
                    'colorTag': card.color_tag,
                    'dueAt': review_map.get(card.id).next_due_at if review_map.get(card.id) else None,
                }
                for card in items
            ],
        }

        serializer = StudyQueueResponseSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DeckStudyAnswerView(views.APIView):
    """
    Accept an answer rating and update spaced repetition data.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        serializer = StudyAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        card_id = serializer.validated_data['cardId']
        rating = serializer.validated_data['rating']
        elapsed_seconds = serializer.validated_data.get('elapsedSeconds') or 0

        card = get_object_or_404(Card, pk=card_id, deck=deck)
        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        interval_days = 0
        if rating == 'hard':
            interval_days = 1
        elif rating == 'easy':
            interval_days = 4

        now = timezone.now()
        if rating == 'again':
            next_due_at = now + timedelta(minutes=5)
        else:
            next_due_at = now + timedelta(days=interval_days)

        review, _ = CardReview.objects.get_or_create(
            user=request.user,
            card=card,
            defaults={'deck': deck},
        )
        review.deck = deck
        review.last_rating = rating
        review.last_reviewed_at = now
        review.next_due_at = next_due_at
        review.interval_days = interval_days
        review.save(update_fields=[
            'deck',
            'last_rating',
            'last_reviewed_at',
            'next_due_at',
            'interval_days',
        ])

        StudyEvent.objects.create(
            user=request.user,
            deck=deck,
            card=card,
            rating=rating,
            duration_seconds=elapsed_seconds,
        )

        logger.info(
            "study_answer user=%s deck=%s card=%s rating=%s duration=%s",
            request.user.id,
            deck.id,
            card.id,
            rating,
            elapsed_seconds,
        )

        if elapsed_seconds:
            DeckParticipant.objects.filter(deck=deck, user=request.user).update(
                total_study_seconds=F('total_study_seconds') + elapsed_seconds
            )
            StudySession.objects.create(
                user=request.user,
                deck=deck,
                started_at=now - timedelta(seconds=elapsed_seconds),
                ended_at=now,
                duration_seconds=elapsed_seconds,
            )

        return Response({'nextDueAt': next_due_at})


class DeckTestStartView(views.APIView):
    """
    Start a new test attempt and return ordered questions.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)

        serializer = TestStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        requested_mode = serializer.validated_data.get('mode')

        allowed_modes = []
        if deck.test_shuffle:
            allowed_modes.append('shuffle')
        if deck.test_sequential:
            allowed_modes.append('sequential')
        if not allowed_modes:
            allowed_modes.append('sequential')

        if requested_mode and requested_mode not in allowed_modes:
            return Response({'detail': 'Requested mode is not allowed for this deck.'}, status=400)

        mode = requested_mode or ('shuffle' if 'shuffle' in allowed_modes else 'sequential')
        cards = list(deck.cards.order_by('created_at'))
        if mode == 'shuffle':
            random.shuffle(cards)

        attempt = TestAttempt.objects.create(
            user=request.user,
            deck=deck,
            mode=mode,
            total_questions=len(cards),
        )

        data = {
            'attemptId': attempt.id,
            'mode': mode,
            'total': len(cards),
            'questions': [
                {
                    'cardId': card.id,
                    'frontText': card.front_text,
                    'backText': card.back_text,
                }
                for card in cards
            ],
        }

        response_serializer = TestStartResponseSerializer(data=data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data)


class DeckTestAnswerView(views.APIView):
    """
    Submit an answer for a test attempt.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        serializer = TestAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt_id = serializer.validated_data['attemptId']
        card_id = serializer.validated_data['cardId']
        answer_text = serializer.validated_data['answerText']
        elapsed_seconds = serializer.validated_data.get('elapsedSeconds') or 0

        attempt = get_object_or_404(TestAttempt, pk=attempt_id, user=request.user, deck=deck)
        if attempt.finished_at:
            return Response({'detail': 'Attempt already finished.'}, status=400)

        card = get_object_or_404(Card, pk=card_id, deck=deck)

        if TestAnswer.objects.filter(attempt=attempt, card=card).exists():
            return Response({'detail': 'Answer already submitted for this card.'}, status=400)

        normalized_answer = normalize_answer(answer_text or '')
        normalized_correct = normalize_answer(card.back_text or '')
        is_correct = normalized_answer == normalized_correct and normalized_correct != ''

        TestAnswer.objects.create(
            attempt=attempt,
            card=card,
            answer_text=answer_text,
            is_correct=is_correct,
            elapsed_seconds=elapsed_seconds,
        )

        response_serializer = TestAnswerResponseSerializer(
            data={'isCorrect': is_correct, 'correctAnswer': card.back_text}
        )
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data)


class DeckTestFinishView(views.APIView):
    """
    Finish a test attempt and return summary + leaderboard.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        serializer = TestFinishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt_id = serializer.validated_data['attemptId']

        attempt = get_object_or_404(TestAttempt, pk=attempt_id, user=request.user, deck=deck)

        answers = TestAnswer.objects.filter(attempt=attempt).select_related('card')
        correct_count = answers.filter(is_correct=True).count()
        total = attempt.total_questions or answers.count()
        score_percent = round((correct_count / total) * 100, 1) if total > 0 else 0.0

        if attempt.finished_at:
            total_seconds = attempt.total_seconds or 0
        else:
            total_seconds = int((timezone.now() - attempt.started_at).total_seconds())
            attempt.finished_at = timezone.now()
            attempt.total_seconds = total_seconds
            attempt.score_percent = score_percent
            attempt.save(update_fields=['finished_at', 'total_seconds', 'score_percent'])
            TestResult.objects.create(user=request.user, deck=deck, score_percent=score_percent)

            logger.info(
                "test_finish user=%s deck=%s attempt=%s score=%s total=%s seconds=%s",
                request.user.id,
                deck.id,
                attempt.id,
                score_percent,
                total,
                total_seconds,
            )

        review = [
            {
                'cardId': answer.card.id,
                'frontText': answer.card.front_text,
                'userAnswer': answer.answer_text,
                'correctAnswer': answer.card.back_text,
                'isCorrect': answer.is_correct,
            }
            for answer in answers.order_by('created_at')
        ]

        top_results = (
            TestResult.objects.filter(deck=deck)
            .select_related('user')
            .order_by('-score_percent', 'created_at')[:10]
        )
        leaderboard = [
            {
                'rank': index + 1,
                'userDisplayName': result.user.username,
                'scorePercent': result.score_percent,
                'createdAt': result.created_at,
            }
            for index, result in enumerate(top_results)
        ]

        data = {
            'attemptId': attempt.id,
            'scorePercent': score_percent,
            'correctCount': correct_count,
            'total': total,
            'totalSeconds': total_seconds,
            'review': review,
            'leaderboard': leaderboard,
        }

        response_serializer = TestFinishResponseSerializer(data=data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data)


class DeckParticipationJoinView(views.APIView):
    """
    Join a deck participation (idempotent).
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        DeckParticipant.objects.get_or_create(deck=deck, user=request.user)
        serializer = ParticipationJoinSerializer(data={'isParticipant': True})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DeckParticipationSummaryView(views.APIView):
    """
    Return participation summary and ranking for a deck.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, deck_id):
        deck, is_owner = get_deck_or_forbidden(request, deck_id)
        if not deck:
            return Response({'detail': 'Access denied.'}, status=403)

        participant, _ = DeckParticipant.objects.get_or_create(deck=deck, user=request.user)
        is_participant = participant is not None

        participants = DeckParticipant.objects.filter(deck=deck).select_related('user')
        participants_count = participants.count()

        study_stats = {
            row['user_id']: row
            for row in StudySession.objects.filter(deck=deck).values('user_id').annotate(
                total=Sum('duration_seconds'),
                last=Max('ended_at'),
            )
        }
        test_stats = {
            row['user_id']: row
            for row in TestAttempt.objects.filter(
                deck=deck,
                finished_at__isnull=False,
            ).values('user_id').annotate(
                best=Max('score_percent'),
                avg=Avg('score_percent'),
                attempts=Count('id'),
                last=Max('finished_at'),
            )
        }

        total_study_seconds_all = StudySession.objects.filter(deck=deck).aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0
        total_test_attempts_all = TestAttempt.objects.filter(
            deck=deck,
            finished_at__isnull=False,
        ).count()

        ranking_entries = []
        for participant in participants:
            user = participant.user
            study = study_stats.get(user.id, {})
            test = test_stats.get(user.id, {})
            total_study_seconds = study.get('total') or 0
            best_score = test.get('best')
            avg_score = test.get('avg')
            attempts_count = test.get('attempts') or 0
            last_study = study.get('last')
            last_test = test.get('last')
            last_active = max(
                [dt for dt in [last_study, last_test] if dt is not None],
                default=None,
            )

            ranking_entries.append({
                'userId': user.id,
                'userDisplayName': get_user_display_name(user),
                'totalStudySeconds': int(total_study_seconds),
                'bestScorePercent': round(best_score, 1) if best_score is not None else None,
                'avgScorePercent': round(avg_score, 1) if avg_score is not None else None,
                'attemptsCount': attempts_count,
                'lastActiveAt': last_active,
            })

        def sort_key(entry):
            best = entry['bestScorePercent']
            best_sort = best if best is not None else -1
            last_active = entry['lastActiveAt']
            last_sort = last_active.timestamp() if last_active else -1
            return (best is not None, best_sort, entry['totalStudySeconds'], last_sort)

        ranking_entries.sort(key=sort_key, reverse=True)
        limited_entries = ranking_entries[:50]
        for index, entry in enumerate(limited_entries, start=1):
            entry['rank'] = index

        data = {
            'deckId': deck.id,
            'deckName': deck.name,
            'visibility': deck.visibility,
            'isOwner': is_owner,
            'isParticipant': is_participant,
            'participantsCount': participants_count,
            'totalStudySecondsAll': int(total_study_seconds_all),
            'totalTestAttemptsAll': total_test_attempts_all,
            'ranking': limited_entries,
        }

        serializer = ParticipationSummarySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)
