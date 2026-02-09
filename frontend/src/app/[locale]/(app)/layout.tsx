"use client";

import { useSession } from "next-auth/react";
import { UserNav } from "@/components/auth/UserNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  // Middleware handles redirects, so we just show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-12">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl py-6 px-6 sm:px-10 lg:px-12">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return null; // Middleware will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-12">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 text-xs font-semibold text-foreground shadow-sm dark:from-amber-400/30 dark:via-orange-400/20 dark:to-rose-400/30">
                BD
              </span>
              <span>{tCommon("appName")}</span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                {tNav("dashboard")}
              </Link>
              <Link
                href="/explore"
                className="hover:text-foreground transition-colors"
              >
                {tNav("explore")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl py-6 px-6 sm:px-10 lg:px-12">
        {children}
      </main>
    </div>
  );
}
