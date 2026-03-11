"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/auth/UserNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const navItems = [
    { href: "/dashboard", label: tNav("dashboard") },
    { href: "/explore", label: tNav("explore") },
    { href: "/ai", label: "AI" },
  ];

  if (status === "loading") {
    return (
      <div className="app-shell min-h-screen">
        <header className="sticky top-0 z-20 border-b border-white/50 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 dark:border-white/10">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-12">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-10 lg:px-12">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10 lg:px-12">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/60 bg-linear-to-br from-amber-200 via-orange-200 to-rose-200 text-xs font-semibold text-foreground shadow-sm dark:border-white/10 dark:from-amber-400/30 dark:via-orange-400/20 dark:to-rose-400/30">
                BD
              </span>
              <span>{tCommon("appName")}</span>
            </Link>
            <nav className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/70 p-1 text-sm shadow-sm dark:border-white/10 dark:bg-white/5 md:flex">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:px-10 lg:px-12">
        {children}
      </main>
      {!pathname?.includes("/ai") ? <AiAssistantPanel /> : null}
    </div>
  );
}
