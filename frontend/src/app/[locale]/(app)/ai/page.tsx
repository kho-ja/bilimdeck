"use client";

import { AiAssistantPanel } from "@/components/ai/ai-assistant-panel";

export default function AiPage() {
  return (
    <div className="space-y-8">
      <section className="app-panel relative overflow-hidden rounded-4xl border border-white/60 px-6 py-8 dark:border-white/10 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-r from-amber-200/35 via-transparent to-sky-200/35 dark:from-amber-400/10 dark:to-sky-400/10" />
        <div className="relative space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            AI workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            AI Assistant
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Use natural language to search public flashcards, generate new
            decks, and jump directly into deck pages without breaking flow.
          </p>
        </div>
      </section>

      <AiAssistantPanel embedded />
    </div>
  );
}
