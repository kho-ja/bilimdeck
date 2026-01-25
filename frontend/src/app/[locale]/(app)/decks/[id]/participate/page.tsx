'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, Link } from '@/i18n/navigation';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api';
import type { ParticipationSummary } from '@/types/participation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ArrowLeft, BookOpen, Clock, Trophy, Users } from 'lucide-react';

const formatDuration = (seconds: number, hoursLabel: string, minutesLabel: string, secondsLabel: string) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}${hoursLabel} ${minutes}${minutesLabel}`;
  }
  if (minutes > 0) {
    return `${minutes}${minutesLabel}`;
  }
  return `${secs}${secondsLabel}`;
};

export default function DeckParticipationPage() {
  const t = useTranslations('participation');
  const router = useRouter();
  const params = useParams();
  const deckId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  const { data, isLoading, error, refetch } = useQuery<ParticipationSummary>({
    queryKey: ['participation-summary', deckId],
    enabled: Boolean(deckId),
    queryFn: async () => {
      const response = await apiClient.get(`/decks/${deckId}/participation/summary/`);
      return response.data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/decks/${deckId}/participation/join/`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('joinSuccess'));
      refetch();
    },
    onError: () => {
      toast.error(t('joinError'));
    },
  });

  const errorStatus = (error as { response?: { status?: number } })?.response?.status;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <ErrorState
        title={t('accessDeniedTitle')}
        description={t('accessDeniedMessage')}
        actionLabel={t('backToDashboard')}
        onAction={() => router.push('/dashboard')}
      />
    );
  }

  if (errorStatus === 404) {
    return (
      <ErrorState
        title={t('notFoundTitle')}
        description={t('notFoundMessage')}
        actionLabel={t('backToDashboard')}
        onAction={() => router.push('/dashboard')}
      />
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

  if (!data) {
    return null;
  }

  const visibilityClasses =
    data.visibility === 'public'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit px-0" onClick={() => router.push(`/decks/${deckId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDeck')}
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('title')}</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{data.deckName}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${visibilityClasses}`}>
                {data.visibility === 'public' ? t('public') : t('private')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="flex-1">
              <Link href={`/decks/${data.deckId}/study`}>
                <BookOpen className="mr-2 h-4 w-4" />
                {t('enterStudy')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link href={`/decks/${data.deckId}/test`}>
                <Trophy className="mr-2 h-4 w-4" />
                {t('enterTest')}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {!data.isParticipant && (
        <Card>
          <CardHeader>
            <CardTitle>{t('joinTitle')}</CardTitle>
            <CardDescription>{t('joinDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? t('joining') : t('joinAction')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('participants')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{data.participantsCount}</span>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalStudyTime')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">
                {formatDuration(data.totalStudySecondsAll, t('hours'), t('minutes'), t('seconds'))}
              </span>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalTestAttempts')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{data.totalTestAttemptsAll}</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('rankingTitle')}</CardTitle>
          <CardDescription>{t('rankingDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.ranking.length === 0 ? (
            <EmptyState
              title={t('rankingEmpty')}
              description={t('joinDescription')}
              actionLabel={t('enterStudy')}
              onAction={() => router.push(`/decks/${data.deckId}/study`)}
              variant="plain"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">{t('rank')}</th>
                    <th className="py-2 pr-4">{t('participant')}</th>
                    <th className="py-2 pr-4">{t('studyTime')}</th>
                    <th className="py-2 pr-4">{t('bestScore')}</th>
                    <th className="py-2 pr-4">{t('avgScore')}</th>
                    <th className="py-2 pr-4">{t('attempts')}</th>
                    <th className="py-2">{t('lastActive')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.map((entry) => (
                    <tr key={entry.userId} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{entry.rank}</td>
                      <td className="py-2 pr-4">{entry.userDisplayName}</td>
                      <td className="py-2 pr-4">
                        {formatDuration(entry.totalStudySeconds, t('hours'), t('minutes'), t('seconds'))}
                      </td>
                      <td className="py-2 pr-4">
                        {entry.bestScorePercent !== null ? `${entry.bestScorePercent.toFixed(1)}%` : t('notAvailable')}
                      </td>
                      <td className="py-2 pr-4">
                        {entry.avgScorePercent !== null ? `${entry.avgScorePercent.toFixed(1)}%` : t('notAvailable')}
                      </td>
                      <td className="py-2 pr-4">{entry.attemptsCount}</td>
                      <td className="py-2">
                        {entry.lastActiveAt ? new Date(entry.lastActiveAt).toLocaleDateString() : t('notActive')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
