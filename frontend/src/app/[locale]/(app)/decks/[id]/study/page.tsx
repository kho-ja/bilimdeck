'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import type { StudyAnswerPayload, StudyQueueItem, StudyQueueResponse } from '@/types/study';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ArrowLeft, Clock, Layers, TimerReset } from 'lucide-react';

type StudyState = 'loading' | 'showFront' | 'showBack' | 'submittingAnswer' | 'completed';

const COLOR_TAG_STYLES: Record<string, string> = {
  blue: 'border-blue-400/60 text-blue-500',
  green: 'border-green-400/60 text-green-500',
  yellow: 'border-yellow-400/60 text-yellow-500',
  red: 'border-red-400/60 text-red-500',
  purple: 'border-purple-400/60 text-purple-500',
  gray: 'border-gray-400/60 text-gray-500',
};

const formatTimer = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function DeckStudyPage() {
  const t = useTranslations('study');
  const router = useRouter();
  const params = useParams();
  const deckId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  const [state, setState] = useState<StudyState>('loading');
  const [queue, setQueue] = useState<StudyQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [cardStart, setCardStart] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const { data, isLoading, error, refetch } = useQuery<StudyQueueResponse>({
    queryKey: ['study-queue', deckId],
    enabled: Boolean(deckId),
    queryFn: async () => {
      const response = await apiClient.get(`/decks/${deckId}/study/queue/`);
      return response.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setQueue(data.items);
    setTotal(data.total);
    setCurrentIndex(0);
    setReviewedCount(0);
    setSessionStart(Date.now());
    setCardStart(Date.now());
    setState(data.total > 0 ? 'showFront' : 'completed');
  }, [data]);

  useEffect(() => {
    if (state === 'loading' || state === 'completed') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart, state]);

  const currentCard = queue[currentIndex];
  const isFlipped = state === 'showBack' || state === 'submittingAnswer';

  const answerMutation = useMutation({
    mutationFn: async (payload: StudyAnswerPayload) => {
      await apiClient.post(`/decks/${deckId}/study/answer/`, payload);
    },
  });

  const advanceQueue = useCallback(
    (rating: StudyAnswerPayload['rating']) => {
      if (!currentCard) return;

      const nextQueue = [...queue];
      const [removed] = nextQueue.splice(currentIndex, 1);
      if (rating === 'again') {
        const insertIndex = Math.min(currentIndex + 1, nextQueue.length);
        nextQueue.splice(insertIndex, 0, removed);
      } else {
        setReviewedCount((prev) => prev + 1);
      }

      if (nextQueue.length === 0) {
        setQueue([]);
        setState('completed');
        return;
      }

      if (currentIndex >= nextQueue.length) {
        setCurrentIndex(0);
      }
      setQueue(nextQueue);
      setState('showFront');
      setCardStart(Date.now());
    },
    [currentCard, currentIndex, queue],
  );

  const handleAnswer = useCallback(
    (rating: StudyAnswerPayload['rating']) => {
      if (!currentCard || state === 'submittingAnswer') return;
      setState('submittingAnswer');
      const elapsed = Math.max(1, Math.floor((Date.now() - cardStart) / 1000));

      answerMutation.mutate(
        {
          cardId: currentCard.cardId,
          rating,
          elapsedSeconds: elapsed,
        },
        {
          onSuccess: () => {
            advanceQueue(rating);
          },
          onError: (error) => {
            if (process.env.NODE_ENV === 'development') {
              console.error('study_answer_failed', error);
            }
            setState('showBack');
          },
        },
      );
    },
    [advanceQueue, answerMutation, cardStart, currentCard, state],
  );

  const handleFlip = useCallback(() => {
    if (state === 'showFront') {
      setState('showBack');
    } else if (state === 'showBack') {
      setState('showFront');
    }
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state === 'loading' || state === 'submittingAnswer') return;

      if (event.key === ' ') {
        event.preventDefault();
        handleFlip();
      }

      if (event.key === 'ArrowRight' && state === 'showFront') {
        event.preventDefault();
        setState('showBack');
      }

      if (event.key === 'ArrowLeft' && state === 'showBack') {
        event.preventDefault();
        setState('showFront');
      }

      if (state === 'showBack') {
        if (event.key === '1') handleAnswer('again');
        if (event.key === '2') handleAnswer('hard');
        if (event.key === '3') handleAnswer('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer, handleFlip, state]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (state !== 'showFront' && state !== 'showBack') return;
    setTouchStart({ x: event.clientX, y: event.clientY });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    const deltaX = event.clientX - touchStart.x;
    const deltaY = event.clientY - touchStart.y;
    setTouchStart(null);

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      handleFlip();
    }
  };

  if (isLoading || state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t('errorTitle')}
        description={t('errorMessage')}
        retryLabel={t('retry')}
        onRetry={() => refetch()}
        actionLabel={t('backToDeck')}
        onAction={() => router.push(`/decks/${deckId}`)}
      />
    );
  }

  if (data && data.total === 0) {
    return (
      <EmptyState
        title={t('emptyTitle')}
        description={t('emptyMessage')}
        actionLabel={t('backToDeck')}
        onAction={() => router.push(`/decks/${deckId}`)}
      />
    );
  }

  if (state === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('sessionCompleteTitle')}</CardTitle>
          <CardDescription>{t('sessionCompleteMessage', { count: reviewedCount })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerReset className="h-4 w-4" />
            <span>
              {t('timeSpent')}: {formatTimer(elapsedSeconds)}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => refetch()}>{t('studyAgain')}</Button>
            <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>
              {t('backToDeck')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressCurrent = Math.min(reviewedCount + 1, total || 1);
  const colorTag = currentCard?.colorTag;
  const colorClass = colorTag ? COLOR_TAG_STYLES[colorTag] || 'border-border text-muted-foreground' : 'border-border';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Button variant="ghost" className="w-fit px-0" onClick={() => router.push(`/decks/${deckId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDeck')}
        </Button>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>{t('progressLabel')}: {progressCurrent} / {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t('timerLabel')}: {formatTimer(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">{data?.deckName}</h1>
        <p className="text-sm text-muted-foreground">{isFlipped ? t('backLabel') : t('frontLabel')}</p>
      </div>

      <div
        className="relative w-full"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className={`relative h-72 w-full rounded-2xl border bg-background shadow-lg ${colorClass}`}
          style={{ perspective: '1200px' }}
        >
          <div
            className="relative h-full w-full rounded-2xl"
            onClick={handleFlip}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className="absolute inset-0 flex h-full w-full items-center justify-center rounded-2xl p-6 text-center text-lg font-medium"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {currentCard?.frontText}
            </div>
            <div
              className="absolute inset-0 flex h-full w-full items-center justify-center rounded-2xl p-6 text-center text-lg font-medium"
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            >
              {currentCard?.backText}
            </div>
          </div>
        </div>
        {colorTag && (
          <div className="mt-3 text-xs font-semibold text-muted-foreground">
            {colorTag.toUpperCase()}
          </div>
        )}
      </div>

      {state === 'showFront' && (
        <p className="text-center text-sm text-muted-foreground">{t('revealHint')}</p>
      )}

      {state === 'showBack' && (
        <div className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" onClick={() => handleAnswer('again')}>
            {t('again')} (1)
          </Button>
          <Button variant="outline" onClick={() => handleAnswer('hard')}>
            {t('hard')} (2)
          </Button>
          <Button onClick={() => handleAnswer('easy')}>
            {t('easy')} (3)
          </Button>
        </div>
      )}
    </div>
  );
}
