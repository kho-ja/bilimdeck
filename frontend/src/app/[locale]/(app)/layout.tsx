'use client';

import { useSession } from "next-auth/react"
import { UserNav } from '@/components/auth/UserNav';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Middleware handles redirects, so we just show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="flex-1 container mx-auto py-6 px-4">
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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg hover:text-primary transition-colors">
              BilimDeck
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
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
      <main className="flex-1 container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}
