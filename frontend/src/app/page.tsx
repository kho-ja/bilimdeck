"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const { t } = useLanguage();

  const pingBackend = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/ping/");
      const data = await res.json();
      setApiStatus(`Backend responded: ${JSON.stringify(data)}`);
    } catch (err) {
      setApiStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">{t("common.appName")}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {user.username}
                    </span>
                    <Button variant="outline" size="sm" onClick={logout}>
                      {t("auth.logout")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">{t("auth.login")}</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/register">{t("auth.register")}</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Memory Card App
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("common.subtitle")}
          </p>
        </div>
        <Button onClick={pingBackend} disabled={loading}>
          {loading ? t("common.pinging") : t("common.ping")}
        </Button>
        {apiStatus && (
          <p className="mt-4 text-sm text-muted-foreground">
            {apiStatus}
          </p>
        )}
      </main>
    </div>
  );
}
