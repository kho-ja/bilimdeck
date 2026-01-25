'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';
import type { DeckDetails } from '@/types/dashboard';
import type {
  FinishTestResponse,
  StartTestResponse,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  TestMode,
  TestQuestion,
} from '@/types/test';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle2, Clock, ListOrdered, Shuffle, XCircle } from 'lucide-react';

type TestState = 'loading' | 'start' | 'question' | 'revealed' | 'submitting' | 'results';

const formatTimer = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function DeckTestPage() {
  const t = useTranslations('testMode');
  const router = useRouter();
  const params = useParams();
  const deckId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  const [state, setState] = useState<TestState>('loading');
  const [mode, setMode] = useState<TestMode>('shuffle');
  const [attemptId, setAttemptId] = useState<string | number | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [summary, setSummary] = useState<FinishTestResponse | null>(null);
  const [useMultiline, setUseMultiline] = useState(false);
  const [sessionStart, setSessionStart] = useState(0);
  const [questionStart, setQuestionStart] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const {
    data: deck,
    isLoading,
    error,
    refetch,
  } = useQuery<DeckDetails>({
    queryKey: ['deck-details', deckId],
    enabled: Boolean(deckId),
    queryFn: async () => {
      const response = await apiClient.get(`/decks/${deckId}/`);
      return response.data;
    },
  });

  const errorStatus = (error as { response?: { status?: number } })?.response?.status;

  useEffect(() => {
    if (!deck) return;
    const allowShuffle = deck.testShuffle ?? true;
    const allowSequential = deck.testSequential ?? false;
    const hasAnyMode = allowShuffle || allowSequential;
    const initialMode = allowShuffle ? 'shuffle' : 'sequential';
    setMode(hasAnyMode ? initialMode : 'sequential');
    setState('start');
  }, [deck]);

  useEffect(() => {
    if (state !== 'question' && state !== 'revealed' && state !== 'submitting') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart, state]);

  const startMutation = useMutation({
    mutationFn: async (payload: { mode: TestMode }) => {
      const response = await apiClient.post(`/decks/${deckId}/test/start/`, payload);
      return response.data as StartTestResponse;
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswerText('');
      setFeedback(null);
      setSummary(null);
      setSessionStart(Date.now());
      setQuestionStart(Date.now());
      setElapsedSeconds(0);
      if (data.total > 0) {
        setState('question');
      } else {
        setState('start');
        toast.error(t('emptyMessage'));
      }
    },
    onError: () => {
      toast.error(t('startError'));
    },
  });

  const answerMutation = useMutation({
    mutationFn: async (payload: SubmitAnswerPayload) => {
      const response = await apiClient.post(`/decks/${deckId}/test/answer/`, payload);
      return response.data as SubmitAnswerResponse;
    },
  });

  const finishMutation = useMutation({
    mutationFn: async (payload: { attemptId: string | number }) => {
      const response = await apiClient.post(`/decks/${deckId}/test/finish/`, payload);
      return response.data as FinishTestResponse;
    },
    onSuccess: (data) => {
      setSummary(data);
      setState('results');
    },
    onError: () => {
      toast.error(t('finishError'));
      setState('revealed');
    },
  });

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = Math.min(currentIndex + 1, total || 1);

  const handleStart = () => {
    if (startMutation.isPending) return;
    startMutation.mutate({ mode });
  };

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || !attemptId || state !== 'question') return;
    setState('submitting');
    const elapsed = Math.max(1, Math.floor((Date.now() - questionStart) / 1000));

    answerMutation.mutate(
      {
        attemptId,
        cardId: currentQuestion.cardId,
        answerText,
        elapsedSeconds: elapsed,
      },
      {
        onSuccess: (data) => {
          setFeedback(data);
          setState('revealed');
        },
        onError: () => {
          toast.error(t('answerError'));
          setState('question');
        },
      },
    );
  }, [answerMutation, answerText, attemptId, currentQuestion, questionStart, state, t]);

  const handleNext = useCallback(() => {
    if (!attemptId) return;
    const isLast = currentIndex >= total - 1;
    if (isLast) {
      setState('submitting');
      finishMutation.mutate({ attemptId });
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setAnswerText('');
    setFeedback(null);
    setQuestionStart(Date.now());
    setState('question');
  }, [attemptId, currentIndex, finishMutation, total]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state === 'question' && event.key === 'Enter') {
        event.preventDefault();
        handleSubmitAnswer();
      }
      if (state === 'revealed' && (event.key === 'Enter' || event.key === 'ArrowRight')) {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleSubmitAnswer, state]);

  if (isLoading || state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-10 w-36" />
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('accessDeniedTitle')}</CardTitle>
          <CardDescription>{t('accessDeniedMessage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard')}>{t('backToDashboard')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (errorStatus === 404) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('notFoundTitle')}</CardTitle>
          <CardDescription>{t('notFoundMessage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard')}>{t('backToDashboard')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('errorTitle')}</CardTitle>
          <CardDescription>{t('errorMessage')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => refetch()}>
            {t('retry')}
          </Button>
          <Button onClick={() => router.push(`/decks/${deckId}`)}>{t('backToDeck')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (!deck) {
    return null;
  }

  const allowShuffle = deck.testShuffle ?? true;
  const allowSequential = deck.testSequential ?? false;
  const hasAnyMode = allowShuffle || allowSequential;
  const showEmptyState = deck.totalCards === 0;

  if (state === 'start') {
    if (showEmptyState) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t('emptyTitle')}</CardTitle>
            <CardDescription>{t('emptyMessage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToDeck')}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('startTitle')}</CardTitle>
          <CardDescription>{deck.description || t('startDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium">{t('modeLabel')}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant={mode === 'shuffle' ? 'default' : 'outline'}
                onClick={() => setMode('shuffle')}
                disabled={!allowShuffle}
                className="justify-start"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {t('shuffle')}
              </Button>
              <Button
                type="button"
                variant={mode === 'sequential' ? 'default' : 'outline'}
                onClick={() => setMode('sequential')}
                disabled={!allowSequential && hasAnyMode}
                className="justify-start"
              >
                <ListOrdered className="mr-2 h-4 w-4" />
                {t('sequential')}
              </Button>
            </div>
            {!allowShuffle && (
              <p className="mt-2 text-xs text-muted-foreground">{t('shuffleDisabled')}</p>
            )}
            {!allowSequential && hasAnyMode && (
              <p className="mt-1 text-xs text-muted-foreground">{t('sequentialDisabled')}</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('questionCount', { count: deck.totalCards })}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleStart} disabled={startMutation.isPending}>
              {startMutation.isPending ? t('starting') : t('startTest')}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>
              {t('backToDeck')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'results' && summary) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('resultsTitle')}</CardTitle>
            <CardDescription>{t('resultsSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-muted-foreground">{t('scoreLabel')}</p>
              <p className="text-2xl font-semibold">{summary.scorePercent.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-muted-foreground">{t('correctLabel')}</p>
              <p className="text-2xl font-semibold">
                {summary.correctCount} / {summary.total}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase text-muted-foreground">{t('timeLabel')}</p>
              <p className="text-2xl font-semibold">{formatTimer(summary.totalSeconds)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reviewTitle')}</CardTitle>
            <CardDescription>{t('reviewSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.review.map((item) => (
              <div key={item.cardId} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.frontText}</p>
                  <span
                    className={`text-xs font-semibold ${item.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {item.isCorrect ? t('correct') : t('incorrect')}
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{t('yourAnswerLabel')}: {item.userAnswer || t('noAnswer')}</p>
                  <p>{t('correctAnswerLabel')}: {item.correctAnswer}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('leaderboardTitle')}</CardTitle>
            <CardDescription>{t('leaderboardSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('leaderboardEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">{t('rank')}</th>
                      <th className="py-2 pr-4">{t('user')}</th>
                      <th className="py-2 pr-4">{t('score')}</th>
                      <th className="py-2">{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.leaderboard.map((entry) => (
                      <tr key={`${entry.userDisplayName}-${entry.rank}`} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{entry.rank}</td>
                        <td className="py-2 pr-4">{entry.userDisplayName}</td>
                        <td className="py-2 pr-4">{entry.scorePercent.toFixed(1)}%</td>
                        <td className="py-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleStart}>{t('retryTest')}</Button>
          <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>
            {t('backToDeck')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Button variant="ghost" className="w-fit px-0" onClick={() => router.push(`/decks/${deckId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDeck')}
        </Button>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{t('progressLabel')}: {progress} / {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t('timerLabel')}: {formatTimer(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{deck.name}</h1>
        <p className="text-sm text-muted-foreground">{t('questionLabel')}</p>
      </div>

      <Card className="border-2 border-muted">
        <CardContent className="flex min-h-[220px] items-center justify-center p-8 text-center text-lg font-medium">
          {currentQuestion?.frontText}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('answerLabel')}</CardTitle>
          <CardDescription>{t('answerHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {useMultiline ? (
            <Textarea
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              placeholder={t('answerPlaceholder')}
              rows={3}
              disabled={state !== 'question'}
            />
          ) : (
            <Input
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              placeholder={t('answerPlaceholder')}
              disabled={state !== 'question'}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSubmitAnswer}
              disabled={state !== 'question' || answerMutation.isPending}
            >
              {answerMutation.isPending ? t('checking') : t('checkAnswer')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseMultiline((prev) => !prev)}
            >
              {useMultiline ? t('switchToSingleLine') : t('switchToMultiLine')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              {feedback.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
              <span className="text-sm font-semibold">
                {feedback.isCorrect ? t('correct') : t('incorrect')}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('correctAnswerLabel')}: <span className="font-medium text-foreground">{feedback.correctAnswer}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleNext} disabled={finishMutation.isPending || state === 'submitting'}>
                {currentIndex >= total - 1 ? t('finishTest') : t('nextQuestion')}
              </Button>
              <Button variant="outline" disabled>
                {t('reportIssue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
