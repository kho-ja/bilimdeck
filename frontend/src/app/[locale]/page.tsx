import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/auth/UserNav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import {
  Brain,
  CheckCircle2,
  Globe,
  Layers,
  Sparkles,
  Timer,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  const features = [
    {
      title: t("feature1Title"),
      description: t("feature1Desc"),
      icon: Brain,
    },
    {
      title: t("feature2Title"),
      description: t("feature2Desc"),
      icon: Timer,
    },
    {
      title: t("feature3Title"),
      description: t("feature3Desc"),
      icon: Globe,
    },
  ];

  const carouselItems = [
    {
      title: t("carouselItem1Title"),
      description: t("carouselItem1Desc"),
      tone: "from-amber-200/70 via-orange-200/50 to-rose-200/70",
      icon: Layers,
    },
    {
      title: t("carouselItem2Title"),
      description: t("carouselItem2Desc"),
      tone: "from-emerald-200/70 via-teal-200/50 to-cyan-200/70",
      icon: Sparkles,
    },
    {
      title: t("carouselItem3Title"),
      description: t("carouselItem3Desc"),
      tone: "from-indigo-200/70 via-sky-200/50 to-blue-200/70",
      icon: CheckCircle2,
    },
    {
      title: t("carouselItem4Title"),
      description: t("carouselItem4Desc"),
      tone: "from-pink-200/70 via-fuchsia-200/50 to-rose-200/70",
      icon: Brain,
    },
    {
      title: t("carouselItem5Title"),
      description: t("carouselItem5Desc"),
      tone: "from-lime-200/70 via-emerald-200/40 to-teal-200/70",
      icon: Timer,
    },
    {
      title: t("carouselItem6Title"),
      description: t("carouselItem6Desc"),
      tone: "from-amber-200/70 via-yellow-200/50 to-orange-200/70",
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f3ee] text-zinc-900 dark:bg-[#0b0f14] dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-[#f7f3ee]/80 backdrop-blur dark:border-white/10 dark:bg-[#0b0f14]/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-200"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 text-xs font-semibold text-zinc-900 shadow-sm dark:from-amber-400/30 dark:via-orange-400/20 dark:to-rose-400/30 dark:text-zinc-100">
                BD
              </span>
              <span>{tCommon("appName")}</span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-zinc-600 md:flex dark:text-zinc-300">
              <Link href="/explore" className="hover:text-zinc-900 dark:hover:text-white">
                {tNav("explore")}
              </Link>
              <a
                href="#features"
                className="hover:text-zinc-900 dark:hover:text-white"
              >
                {t("sectionFeaturesTitle")}
              </a>
              <a
                href="#decks"
                className="hover:text-zinc-900 dark:hover:text-white"
              >
                {t("carouselTitle")}
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="inline-flex">
              <Link href="/explore">{tNav("explore")}</Link>
            </Button>
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
                  <Link href="/login">{t("primaryCta")}</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/register">{t("secondaryCta")}</Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="sm:hidden"
                >
                  <Link href="/login" aria-label={tNav("login")}>
                    {tNav("login").charAt(0)}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-[-140px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.35),transparent_60%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(251,191,36,0.2),transparent_60%)]" />
        <div className="pointer-events-none absolute right-[-120px] top-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.28),transparent_60%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-t from-[#f7f3ee] to-transparent dark:from-[#0b0f14]" />

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-16 sm:px-10 lg:px-12">
          <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <span className="fade-up inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 shadow-sm dark:bg-white/10 dark:text-zinc-200">
                {t("heroBadge")}
              </span>
              <h1 className="fade-up delay-1 text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
                {t("heroTitle")}
              </h1>
              <p className="fade-up delay-2 text-lg text-zinc-600 sm:text-xl dark:text-zinc-300">
                {t("heroSubtitle")}
              </p>
              <div className="fade-up delay-3 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link href="/login">{t("primaryCta")}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                >
                  <Link href="/register">{t("secondaryCta")}</Link>
                </Button>
              </div>
              <div className="fade-up delay-4 flex flex-wrap gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="text-base font-semibold text-zinc-900 dark:text-white">
                      {stat.value}
                    </span>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up delay-2 relative">
              <div className="absolute -left-8 -top-6 h-20 w-20 rounded-3xl bg-amber-200/70 blur-sm dark:bg-amber-400/20" />
              <div className="absolute -bottom-10 right-2 h-24 w-24 rounded-3xl bg-blue-200/70 blur-sm dark:bg-blue-400/20" />
              <div className="relative rounded-3xl border border-white/80 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      {t("heroCardEyebrow")}
                    </p>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {t("heroCardTitle")}
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200">
                    {t("heroCardBadge")}
                  </span>
                </div>
                <div className="space-y-4">
                  {carouselItems.slice(0, 3).map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} dark:opacity-90`}
                      >
                        <item.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-100" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="features"
            className="grid gap-6 rounded-3xl border border-white/70 bg-white/70 p-8 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {t("sectionEyebrow")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-white">
                {t("sectionFeaturesTitle")}
              </h2>
              <p className="mt-2 text-base text-zinc-600 dark:text-zinc-300">
                {t("sectionFeaturesSubtitle")}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="decks" className="grid gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {t("carouselEyebrow")}
              </p>
              <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-white">
                {t("carouselTitle")}
              </h2>
              <p className="text-base text-zinc-600 dark:text-zinc-300">
                {t("carouselSubtitle")}
              </p>
            </div>

            <div
              className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/70 py-8 dark:border-white/10 dark:bg-white/5"
              aria-label={t("carouselLabel")}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/90 to-transparent dark:from-[#0b0f14]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/90 to-transparent dark:from-[#0b0f14]" />

              <div className="carousel-track flex w-[200%] gap-4 px-6">
                {[...carouselItems, ...carouselItems].map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="w-[260px] shrink-0 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} dark:opacity-90`}
                    >
                      <item.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-100" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="carousel-track reverse mt-6 flex w-[200%] gap-4 px-6">
                {[
                  ...carouselItems.slice().reverse(),
                  ...carouselItems.slice().reverse(),
                ].map((item, index) => (
                  <div
                    key={`${item.title}-reverse-${index}`}
                    className="w-[260px] shrink-0 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} dark:opacity-90`}
                    >
                      <item.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-100" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col items-center gap-4 rounded-3xl border border-white/80 bg-zinc-900 px-8 py-10 text-center text-white dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 dark:text-zinc-300">
              {t("ctaEyebrow")}
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl dark:text-white">
              {t("ctaTitle")}
            </h2>
            <p className="max-w-2xl text-base text-white/70 dark:text-zinc-300">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full px-6 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Link href="/login">{t("primaryCta")}</Link>
              </Button>
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/register">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
