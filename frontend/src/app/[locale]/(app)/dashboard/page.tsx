"use client";

import { useMemo, type ComponentType, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  Lock,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";
import type { DashboardSummary, Deck, JoinedDeck } from "@/types/dashboard";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function MetricCard({
  title,
  description,
  value,
  icon: Icon,
  accentClassName,
  progress,
}: {
  title: string;
  description: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName: string;
  progress?: number;
}) {
  return (
    <Card className="app-panel metric-glow overflow-hidden rounded-[1.75rem] border-white/60 shadow-sm dark:border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className={cn("rounded-2xl p-3", accentClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {typeof progress === "number" ? (
          <div className="h-2 overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full rounded-full bg-foreground/80 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DeckCard({
  title,
  subtitle,
  meta,
  visibility,
  onOpen,
  onPrimary,
  onSecondary,
}: {
  title: string;
  subtitle: string;
  meta: string;
  visibility: "public" | "private";
  onOpen: () => void;
  onPrimary: (event: MouseEvent<HTMLButtonElement>) => void;
  onSecondary: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Card
      className="app-panel group cursor-pointer rounded-[1.75rem] border-white/60 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-white/10"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="line-clamp-2 text-xl tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="line-clamp-2 leading-6">
              {subtitle}
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-2 text-muted-foreground transition-colors group-hover:text-foreground">
            {visibility === "public" ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{meta}</span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]">
            {visibility}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1 rounded-xl"
            onClick={onPrimary}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Study
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onSecondary}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeckGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <Card key={item} className="rounded-[1.75rem]">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const visibilityFilter = searchParams.get("visibility");

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await apiClient.get("/dashboard/summary/");
      return response.data;
    },
  });

  const {
    data: decks = [],
    isLoading: decksLoading,
    error: decksError,
    refetch: refetchDecks,
  } = useQuery<Deck[]>({
    queryKey: ["decks"],
    queryFn: async () => {
      const response = await apiClient.get("/decks/");
      return response.data;
    },
  });

  const {
    data: joinedDecks = [],
    isLoading: joinedLoading,
    error: joinedError,
    refetch: refetchJoined,
  } = useQuery<JoinedDeck[]>({
    queryKey: ["joined-decks"],
    queryFn: async () => {
      const response = await apiClient.get("/decks/joined/");
      return response.data;
    },
  });

  const deckCounts = useMemo(() => {
    const publicCount = decks.filter(
      (deck) => deck.visibility === "public",
    ).length;
    const privateCount = decks.filter(
      (deck) => deck.visibility === "private",
    ).length;

    return {
      total: decks.length,
      publicCount,
      privateCount,
    };
  }, [decks]);

  const filteredDecks = useMemo(() => {
    if (visibilityFilter === "public" || visibilityFilter === "private") {
      return decks.filter((deck) => deck.visibility === visibilityFilter);
    }

    return decks;
  }, [decks, visibilityFilter]);

  const joinedCount = joinedDecks.length;

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}${t("hours")} ${minutes}${t("minutes")}`;
    }

    if (minutes > 0) {
      return `${minutes}${t("minutes")}`;
    }

    return `${secs}${t("seconds")}`;
  };

  const formatLastStudied = (dateString?: string | null) => {
    if (!dateString) return t("never");

    const date = new Date(dateString);
    const now = new Date();
    const diffMs =
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo", { days: diffDays });

    return date.toLocaleDateString();
  };

  const formatJoinedAt = (dateString?: string | null) => {
    if (!dateString) return t("never");
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="app-panel relative overflow-hidden rounded-[2rem] border border-white/60 px-6 py-7 dark:border-white/10 sm:px-8">
          <div className="absolute -left-12 top-0 h-36 w-36 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-400/10" />
          <div className="absolute right-0 top-6 h-32 w-32 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-400/10" />
          <div className="relative flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/60 bg-background/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground dark:border-white/10">
              <Sparkles className="h-3.5 w-3.5" />
              {t("welcome")}
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                {t("title")}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full px-6"
                onClick={() => router.push("/decks/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("createNewDeck")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => router.push("/ai")}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("myDecks")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {deckCounts.total}
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("public")}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {deckCounts.publicCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("joinedDecks")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{joinedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="app-panel rounded-[2rem] border-white/60 dark:border-white/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl tracking-tight">
                  At a glance
                </CardTitle>
                <CardDescription>{t("joinedDecksDesc")}</CardDescription>
              </div>
              <div className="rounded-2xl bg-foreground p-3 text-background">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Visibility mix</p>
                  <p className="text-sm text-muted-foreground">
                    {deckCounts.publicCount} public and{" "}
                    {deckCounts.privateCount} private decks
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium">Study time</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatStudyTime(summary?.totalStudySeconds ?? 0)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("totalStudyTimeDesc")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-medium">Quick actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => router.push("/explore")}
                >
                  {t("explorePublic")}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => router.push("/ai")}
                >
                  AI Assistant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {summaryLoading ? (
          [1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-44 rounded-[1.75rem]" />
          ))
        ) : summaryError ? (
          <div className="lg:col-span-3">
            <ErrorState
              title={t("errorLoadingSummary")}
              retryLabel={t("retry")}
              onRetry={() => refetchSummary()}
            />
          </div>
        ) : (
          <>
            <MetricCard
              title={t("learningProgress")}
              description={t("learningProgressDesc")}
              value={`${summary?.learningProgressPercent ?? 0}%`}
              icon={BookOpen}
              accentClassName="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
              progress={summary?.learningProgressPercent ?? 0}
            />
            <MetricCard
              title={t("averageScore")}
              description={t("averageScoreDesc")}
              value={`${summary?.averageTestScore ?? 0}%`}
              icon={Trophy}
              accentClassName="bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200"
            />
            <MetricCard
              title={t("totalStudyTime")}
              description={t("totalStudyTimeDesc")}
              value={formatStudyTime(summary?.totalStudySeconds ?? 0)}
              icon={Clock}
              accentClassName="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("myDecks")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("cardCount", { count: filteredDecks.length })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2 rounded-full border border-white/60 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
              <Button
                variant={!visibilityFilter ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => router.push("/dashboard")}
              >
                All
              </Button>
              <Button
                variant={visibilityFilter === "public" ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => router.push("/dashboard?visibility=public")}
              >
                {t("public")}
              </Button>
              <Button
                variant={visibilityFilter === "private" ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => router.push("/dashboard?visibility=private")}
              >
                {t("private")}
              </Button>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/ai")}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              AI Assistant
            </Button>
          </div>
        </div>

        {decksLoading ? <DeckGridSkeleton /> : null}

        {decksError && !decksLoading ? (
          <ErrorState
            title={t("errorLoadingDecks")}
            retryLabel={t("retry")}
            onRetry={() => refetchDecks()}
          />
        ) : null}

        {!decksLoading && !decksError && filteredDecks.length === 0 ? (
          <EmptyState
            title={t("noDecksYet")}
            description={t("noDecksMessage")}
            actionLabel={t("createNewDeck")}
            onAction={() => router.push("/decks/new")}
          />
        ) : null}

        {!decksLoading && !decksError && filteredDecks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                title={deck.name}
                subtitle={`${t("cardCount", { count: deck.totalCards })} • ${t("lastStudied")}: ${formatLastStudied(deck.lastStudiedAt)}`}
                meta={t("cardCount", { count: deck.totalCards })}
                visibility={deck.visibility}
                onOpen={() => router.push(`/decks/${deck.id}`)}
                onPrimary={(event) => {
                  event.stopPropagation();
                  router.push(`/decks/${deck.id}/study`);
                }}
                onSecondary={(event) => {
                  event.stopPropagation();
                  router.push(`/decks/${deck.id}/test`);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("joinedDecks")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("joinedDecksDesc")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.push("/explore")}
          >
            {t("explorePublic")}
          </Button>
        </div>

        {joinedLoading ? <DeckGridSkeleton /> : null}

        {joinedError && !joinedLoading ? (
          <ErrorState
            title={t("joinedDecksError")}
            retryLabel={t("retry")}
            onRetry={() => refetchJoined()}
          />
        ) : null}

        {!joinedLoading && !joinedError && joinedDecks.length === 0 ? (
          <EmptyState
            title={t("joinedDecksEmpty")}
            description={t("joinedDecksEmptyDesc")}
            actionLabel={t("explorePublic")}
            onAction={() => router.push("/explore")}
          />
        ) : null}

        {!joinedLoading && !joinedError && joinedDecks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {joinedDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                title={deck.name}
                subtitle={`${t("joinedDecksOwner", { name: deck.ownerDisplayName })} • ${t("joinedOn")}: ${formatJoinedAt(deck.joinedAt)}`}
                meta={t("cardCount", { count: deck.totalCards })}
                visibility={deck.visibility}
                onOpen={() => router.push(`/decks/${deck.id}`)}
                onPrimary={(event) => {
                  event.stopPropagation();
                  router.push(`/decks/${deck.id}/study`);
                }}
                onSecondary={(event) => {
                  event.stopPropagation();
                  router.push(`/decks/${deck.id}/test`);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
