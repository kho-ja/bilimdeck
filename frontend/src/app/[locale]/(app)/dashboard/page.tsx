"use client";

import { useMemo } from "react";
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
  BookOpen,
  Trophy,
  Clock,
  Plus,
  Eye,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { DashboardSummary, Deck, JoinedDeck } from "@/types/dashboard";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const visibilityFilter = searchParams.get("visibility");

  // Fetch dashboard summary
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

  // Fetch decks
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

  /**
   * Format study time in seconds to human-readable format
   * Shows only the most significant time units for better readability
   * @param seconds - Total study time in seconds
   * @returns Formatted time string (e.g., "2h 30m" or "45m" or "30s")
   */
  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}${t("hours")} ${minutes}${t("minutes")}`;
    } else if (minutes > 0) {
      return `${minutes}${t("minutes")}`;
    } else {
      return `${secs}${t("seconds")}`;
    }
  };

  /**
   * Format last studied date to relative time string
   * Handles timezone conversion properly using UTC
   * @param dateString - ISO date string from API
   * @returns Relative time string (e.g., "Today", "2 days ago", or formatted date)
   */
  const formatLastStudied = (dateString?: string | null) => {
    if (!dateString) return t("never");

    const date = new Date(dateString);
    const now = new Date();

    // Use UTC timestamps for accurate comparison across timezones
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
    <div className="space-y-8 p-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {t("welcome")}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => router.push("/decks/new")}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createNewDeck")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {t("myDecks")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-none bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("decksCreated")}
              </CardTitle>
              <CardDescription>{t("myDecks")}</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {deckCounts.total}
            </CardContent>
          </Card>
          <Card className="border-none bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("public")}
              </CardTitle>
              <CardDescription>{t("private")}</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {deckCounts.publicCount} / {deckCounts.privateCount}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Learning Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("learningProgress")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  {t("errorLoadingSummary")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchSummary()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.learningProgressPercent ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("learningProgressDesc")}
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${summary?.learningProgressPercent ?? 0}%`,
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Average Test Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("averageScore")}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  {t("errorLoadingSummary")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchSummary()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.averageTestScore ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("averageScoreDesc")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Study Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalStudyTime")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  {t("errorLoadingSummary")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchSummary()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatStudyTime(summary?.totalStudySeconds ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("totalStudyTimeDesc")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decks Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("myDecks")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("cardCount", { count: filteredDecks.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!visibilityFilter ? "default" : "outline"}
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              {t("myDecks")}
            </Button>
            <Button
              variant={visibilityFilter === "public" ? "default" : "outline"}
              size="sm"
              onClick={() => router.push("/dashboard?visibility=public")}
            >
              {t("public")}
            </Button>
            <Button
              variant={visibilityFilter === "private" ? "default" : "outline"}
              size="sm"
              onClick={() => router.push("/dashboard?visibility=private")}
            >
              {t("private")}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {decksLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {decksError && !decksLoading && (
          <ErrorState
            title={t("errorLoadingDecks")}
            retryLabel={t("retry")}
            onRetry={() => refetchDecks()}
          />
        )}

        {/* Empty State */}
        {!decksLoading && !decksError && filteredDecks.length === 0 && (
          <EmptyState
            title={t("noDecksYet")}
            description={t("noDecksMessage")}
            actionLabel={t("createNewDeck")}
            onAction={() => router.push("/decks/new")}
          />
        )}

        {/* Decks Grid */}
        {!decksLoading && !decksError && filteredDecks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDecks.map((deck) => (
              <Card
                key={deck.id}
                className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/decks/${deck.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/decks/${deck.id}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{deck.name}</CardTitle>
                    {deck.visibility === "public" ? (
                      <Eye className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    {t("cardCount", { count: deck.totalCards })}
                    {" • "}
                    {deck.visibility === "public" ? t("public") : t("private")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("lastStudied")}: {formatLastStudied(deck.lastStudiedAt)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/decks/${deck.id}/study`);
                      }}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t("study")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/decks/${deck.id}/test`);
                      }}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      {t("test")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Joined Decks Section */}
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
            onClick={() => router.push("/explore")}
          >
            {t("explorePublic")}
          </Button>
        </div>

        {joinedLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {joinedError && !joinedLoading && (
          <ErrorState
            title={t("joinedDecksError")}
            retryLabel={t("retry")}
            onRetry={() => refetchJoined()}
          />
        )}

        {!joinedLoading && !joinedError && joinedDecks.length === 0 && (
          <EmptyState
            title={t("joinedDecksEmpty")}
            description={t("joinedDecksEmptyDesc")}
            actionLabel={t("explorePublic")}
            onAction={() => router.push("/explore")}
          />
        )}

        {!joinedLoading && !joinedError && joinedDecks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {joinedDecks.map((deck) => (
              <Card
                key={deck.id}
                className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/decks/${deck.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/decks/${deck.id}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{deck.name}</CardTitle>
                    {deck.visibility === "public" ? (
                      <Eye className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    {t("joinedDecksOwner", { name: deck.ownerDisplayName })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t("cardCount", { count: deck.totalCards })}</span>
                    <span>
                      {deck.visibility === "public"
                        ? t("public")
                        : t("private")}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("joinedOn")}: {formatJoinedAt(deck.joinedAt)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/decks/${deck.id}/study`);
                      }}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t("study")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/decks/${deck.id}/test`);
                      }}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      {t("test")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
