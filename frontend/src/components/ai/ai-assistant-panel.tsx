"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  AI_PROVIDERS,
  loadAiSettings,
  saveAiSettings,
} from "@/lib/ai-settings";
import type { AiUserSettings } from "@/types/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Bot,
  ChevronRight,
  MessageSquare,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";

type AiAssistantPanelProps = {
  embedded?: boolean;
};

type ChatPart = {
  text?: string;
};

function getMessageText(parts: ChatPart[] | readonly ChatPart[] | undefined) {
  return (
    parts
      ?.map((part) => part.text ?? "")
      .join(" ")
      .trim() ?? ""
  );
}

export function AiAssistantPanel({ embedded = false }: AiAssistantPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(embedded);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AiUserSettings>(() =>
    loadAiSettings(),
  );

  const provider = useMemo(
    () =>
      AI_PROVIDERS.find((item) => item.id === settings.providerId) ||
      AI_PROVIDERS[0],
    [settings.providerId],
  );

  const contextHint = useMemo(() => {
    if (pathname?.includes("/explore"))
      return "Focus on searching public flashcards.";
    if (pathname?.includes("/decks/new"))
      return "Help generate a new deck and cards.";
    if (pathname?.includes("/decks/"))
      return "Help open and work with this deck context.";
    return "Help user search, create, and open flashcard decks.";
  }, [pathname]);

  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: "/api/ai/chat",
      body: {
        providerId: settings.providerId,
        model: settings.model,
        apiKey: settings.apiKey,
        contextHint,
      },
    });

  const onSaveSettings = () => {
    saveAiSettings(settings);
    setSettingsOpen(false);
  };

  const statusLabel = status === "streaming" ? "Thinking" : "Ready";

  const openFirstRoute = (text: string) => {
    const match = text.match(/\/decks\/\d+/);
    if (match) router.push(match[0]);
  };

  const panel = (
    <Card
      className={cn(
        "app-panel overflow-hidden rounded-[1.75rem] border-white/60 shadow-2xl dark:border-white/10",
        embedded ? "w-full" : "w-[380px] max-w-[calc(100vw-2rem)]",
      )}
    >
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="size-3.5" />
              BilimDeck AI
            </div>
            <CardTitle className="text-lg">Assistant workspace</CardTitle>
            <p className="max-w-xs text-sm text-muted-foreground">
              {contextHint}
            </p>
          </div>
          {!embedded ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close AI Assistant"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">
            {provider.label}
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">
            {statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Model settings</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <Settings2 className="size-4" />
              Settings
            </Button>
          </div>

          {settingsOpen ? (
            <div className="space-y-2">
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={settings.providerId}
                onChange={(event) => {
                  const next =
                    AI_PROVIDERS.find(
                      (item) => item.id === event.target.value,
                    ) || AI_PROVIDERS[0];
                  setSettings({
                    ...settings,
                    providerId: next.id,
                    model: next.defaultModel,
                  });
                }}
              >
                {AI_PROVIDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={settings.model}
                onChange={(event) =>
                  setSettings({ ...settings, model: event.target.value })
                }
              >
                {provider.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <Input
                type="password"
                placeholder="API key"
                value={settings.apiKey}
                onChange={(event) =>
                  setSettings({ ...settings, apiKey: event.target.value })
                }
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={onSaveSettings}>
                  Save settings
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {provider.label} · {settings.model}
            </p>
          )}
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-background/55 p-3">
          {messages.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-8 text-center">
              <Bot className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Start with a natural request
                </p>
                <p className="text-xs text-muted-foreground">
                  Search public decks, generate cards, or ask the assistant to
                  open a deck page.
                </p>
              </div>
            </div>
          ) : null}

          {messages.map((message) => {
            const text = getMessageText(
              message.parts as ChatPart[] | undefined,
            );
            const routeMatch = text.match(/\/decks\/\d+/);
            const isAssistant = message.role === "assistant";

            return (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm shadow-sm",
                  isAssistant
                    ? "border-sky-200/70 bg-sky-50/80 dark:border-sky-500/20 dark:bg-sky-500/10"
                    : "border-amber-200/70 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10",
                )}
              >
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {isAssistant ? (
                    <Bot className="size-3.5" />
                  ) : (
                    <MessageSquare className="size-3.5" />
                  )}
                  {message.role}
                </div>
                <p className="whitespace-pre-wrap leading-6">{text || "..."}</p>
                {routeMatch ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto px-0"
                    onClick={() => openFirstRoute(text)}
                  >
                    Open deck
                    <ChevronRight className="size-4" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {error ? (
          <p className="text-xs text-destructive">{error.message}</p>
        ) : null}
        {!settings.apiKey ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Add an API key in settings before sending a prompt.
          </p>
        ) : null}

        <form
          onSubmit={(event) => {
            if (!settings.apiKey) {
              event.preventDefault();
              return;
            }
            handleSubmit(event);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask AI to search, create, or open a deck..."
            className="h-11 rounded-xl"
          />
          <Button
            type="submit"
            disabled={status === "streaming"}
            className="h-11 rounded-xl px-5"
          >
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return embedded ? (
    panel
  ) : (
    <div className="fixed bottom-6 right-6 z-40">
      {!open ? (
        <Button
          className="h-12 rounded-full px-5 shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="size-4" />
          Open AI Assistant
        </Button>
      ) : (
        panel
      )}
    </div>
  );
}
