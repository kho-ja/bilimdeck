"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api";
import type { PaginatedResponse, PublicDeck } from "@/types/dashboard";
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
import { Eye, Layers, ArrowRight, Search, Bookmark } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/auth/UserNav";
import { toast } from "sonner";

export default function ExplorePage() {
  const t = useTranslations("explore");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = 9;
  const [searchValue, setSearchValue] = useState(query);

  const { data, isLoading, error, refetch } = useQuery<
    PaginatedResponse<PublicDeck>
  >({
    queryKey: ["public-decks", query, page],
    queryFn: async () => {
      const response = await apiClient.get("/decks/public/", {
        params: {
          q: query || undefined,
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    },
  });

  const decks = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const joinMutation = useMutation({
    mutationFn: async (deckId: string | number) => {
      await apiClient.post(`/decks/${deckId}/participation/join/`);
      return deckId;
    },
    onSuccess: (deckId) => {
      queryClient.setQueryData<PaginatedResponse<PublicDeck>>(
        ["public-decks", query, page],
        (existing) => {
          if (!existing) return existing;
          return {
            ...existing,
            results: existing.results.map((deck) =>
              deck.id === deckId ? { ...deck, isParticipant: true } : deck,
            ),
          };
        },
      );
      toast.success(t("joinSuccess"));
    },
    onError: () => {
      toast.error(t("joinError"));
    },
  });

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    params.set("page", "1");
    router.push(`/explore?${params.toString()}`);
  };

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(nextPage));
    router.push(`/explore?${params.toString()}`);
  };

  const handleOpenDeck = (deckId: string | number) => {
    if (!session?.user) {
      router.push(`/login?returnTo=/decks/${deckId}`);
      return;
    }
    router.push(`/decks/${deckId}`);
  };

  const handleJoin = (deckId: string | number) => {
    if (!session?.user) {
      router.push(`/login?returnTo=/decks/${deckId}`);
      return;
    }
    joinMutation.mutate(deckId);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-200 via-sky-200 to-blue-200 text-xs font-semibold text-foreground shadow-sm dark:from-emerald-500/30 dark:via-sky-500/20 dark:to-blue-500/30">
                BD
              </span>
              <span>{tCommon("appName")}</span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
              <Link href="/explore" className="text-foreground">
                {tNav("explore")}
              </Link>
              <Link href="/" className="hover:text-foreground">
                {tNav("home")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {session?.user ? (
              <UserNav />
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/login">{tNav("login")}</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/register">{t("joinCta")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto space-y-8 px-4 py-8">
        <section className="rounded-3xl border bg-gradient-to-br from-emerald-100/70 via-background to-sky-100/70 p-6 shadow-sm dark:border-white/10 dark:from-emerald-500/10 dark:via-background dark:to-sky-500/10">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {t("badge")}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {t("deckCount", { count: totalCount })}
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div className="flex w-full items-center gap-2 rounded-full border bg-background/80 px-3 py-2 text-sm sm:w-80">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Button onClick={handleSearch} className="w-full sm:w-auto">
                  {t("searchButton")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Card key={item}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-3 h-4 w-2/3" />
                  <Skeleton className="mt-6 h-9 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <ErrorState
            title={t("errorTitle")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !error && decks.length === 0 && (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            variant="plain"
          />
        )}

        {!isLoading && !error && decks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <Card
                key={deck.id}
                className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDeck(deck.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenDeck(deck.id);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{deck.name}</CardTitle>
                    <Eye className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <CardDescription>
                    {t("byLabel", { name: deck.ownerDisplayName })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deck.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {deck.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("noDescription")}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t("cardCount", { count: deck.totalCards })}</span>
                    <span>{t("publicLabel")}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDeck(deck.id);
                      }}
                    >
                      {t("openDeck")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant={deck.isParticipant ? "secondary" : "default"}
                      className="w-full"
                      disabled={deck.isParticipant || joinMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleJoin(deck.id);
                      }}
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      {deck.isParticipant ? t("savedLabel") : t("joinDeck")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("paginationLabel", { page, total: totalPages })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
