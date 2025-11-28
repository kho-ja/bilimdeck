"use client";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslations } from 'next-intl';

export default function Home() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const t = useTranslations();

  // Use React Query for the ping request with caching disabled
  const { data: pingData, refetch, isLoading } = useQuery({
    queryKey: ['ping'],
    queryFn: async () => {
      const response = await apiClient.get('/ping/');
      return response.data;
    },
    enabled: false, // Don't auto-fetch, only on button click
    gcTime: 0, // Disable caching (previously cacheTime)
    staleTime: 0, // Always consider data stale
  });

  const handlePing = () => {
    queryClient.resetQueries({ queryKey: ['ping'] }); // Clear previous data
    refetch(); // Fetch new data
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 p-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('common.appName')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {t('common.tagline')}
        </p>

        <div className="flex gap-4">
          {session ? (
            <Button asChild>
              <Link href="/dashboard">{t('home.goToDashboard')}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
          )}
          <Button variant="outline" onClick={handlePing} disabled={isLoading}>
            {isLoading ? t('home.pinging') : t('home.pingBackend')}
          </Button>
        </div>

        {pingData && (
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            {t('home.backendResponded')}: {JSON.stringify(pingData)}
          </p>
        )}
      </main>
    </div>
  );
}
