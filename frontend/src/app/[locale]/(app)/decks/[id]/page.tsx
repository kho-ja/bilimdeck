'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { apiClient } from '@/lib/api';
import type { DeckDetails } from '@/types/dashboard';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Clock, Layers, Pencil, Share2, Trophy, Users } from 'lucide-react';

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

export default function DeckDetailsPage() {
  const t = useTranslations('deckDetails');
  const router = useRouter();
  const params = useParams();
  const deckId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

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

  const handleShare = async () => {
    if (!deck) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('shareCopied'));
    } catch {
      toast.error(t('shareFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
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
          <Button onClick={() => router.push('/dashboard')}>{t('backToDashboard')}</Button>
        </CardContent>
      </Card>
    );
  }

  if (!deck) {
    return null;
  }

  const visibilityClasses =
    deck.visibility === 'public'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit px-0" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDashboard')}
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{deck.name}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${visibilityClasses}`}>
                {deck.visibility === 'public' ? t('public') : t('private')}
              </span>
            </div>
            {deck.description && (
              <p className="text-sm text-muted-foreground">{deck.description}</p>
            )}
          </div>
          {deck.isOwner && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled>
                <Pencil className="mr-2 h-4 w-4" />
                {t('editDeck')}
              </Button>
              {deck.visibility === 'public' && (
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('share')}
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link href={`/decks/${deck.id}/study`}>
              <BookOpen className="mr-2 h-4 w-4" />
              {t('startStudy')}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href={`/decks/${deck.id}/test`}>
              <Trophy className="mr-2 h-4 w-4" />
              {t('startTest')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalCards')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{deck.totalCards}</span>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('participants')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{deck.participantsCount}</span>
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
                {formatDuration(deck.totalStudySeconds, t('hours'), t('minutes'), t('seconds'))}
              </span>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('leaderboardTitle')}</CardTitle>
            <CardDescription>{t('leaderboardDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {deck.leaderboard.length === 0 ? (
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
                    {deck.leaderboard.map((entry) => (
                      <tr key={`${entry.userDisplayName}-${entry.rank}`} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{entry.rank}</td>
                        <td className="py-2 pr-4">{entry.userDisplayName}</td>
                        <td className="py-2 pr-4">{entry.scorePercent.toFixed(1)}%</td>
                        <td className="py-2">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('activityTitle')}</CardTitle>
            <CardDescription>{t('activityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs uppercase text-muted-foreground">{t('totalLearnerTime')}</p>
              <p className="text-lg font-semibold">
                {formatDuration(deck.totalStudySeconds, t('hours'), t('minutes'), t('seconds'))}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{t('activityHint')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cardsPreviewTitle')}</CardTitle>
          <CardDescription>{t('cardsPreviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {deck.cardsPreview && deck.cardsPreview.length > 0 ? (
            <div className="space-y-3">
              {deck.cardsPreview.map((card) => (
                <div key={card.id} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">{card.frontText}</p>
                  {card.colorTag && (
                    <p className="text-xs text-muted-foreground">{t('colorTag', { color: card.colorTag })}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noCards')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
