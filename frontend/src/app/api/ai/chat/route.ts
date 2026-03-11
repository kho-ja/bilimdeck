import { auth } from "@/auth";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToCoreMessages } from "ai";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const bodySchema = z.object({
  messages: z.array(z.any()),
  providerId: z.string(),
  model: z.string(),
  apiKey: z.string().min(1),
});

const providerUrls: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  together: "https://api.together.xyz/v1",
};

function getErrorMessage(error: unknown) {
  if (error == null) {
    return "Unknown AI error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown AI error";
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const accessToken = (session as any)?.accessToken as string | undefined;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const { messages, providerId, model, apiKey } = parsed.data;
  const baseURL = providerUrls[providerId];
  if (!baseURL) {
    return new Response(JSON.stringify({ error: "Unsupported provider" }), {
      status: 400,
    });
  }

  const openai = createOpenAI({ baseURL, apiKey });
  const modelHeaders =
    providerId === "openrouter"
      ? {
          "HTTP-Referer": APP_URL,
          "X-Title": "BilimDeck",
        }
      : undefined;

  const callBackend = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data?.detail || data?.error || `Backend error ${response.status}`,
      );
    }
    return data;
  };

  const result = streamText({
    model: openai(model),
    system:
      "You are BilimDeck AI assistant. Use tools for deck operations. Keep answers concise and actionable. For deck search/open/create always call tools instead of guessing IDs.",
    messages: convertToCoreMessages(messages),
    headers: modelHeaders,
    tools: {
      searchPublicDecks: tool({
        description: "Search all public decks",
        parameters: z.object({
          q: z.string().default(""),
          limit: z.number().int().min(1).max(25).default(10),
        }),
        execute: async ({ q, limit }) => {
          const query = new URLSearchParams({ q, limit: String(limit) });
          return callBackend(`/decks/public/search/?${query.toString()}`);
        },
      }),
      createDeckFromStructured: tool({
        description: "Create a deck with cards for current user",
        parameters: z.object({
          name: z.string().min(3).max(200),
          description: z.string().max(2000).optional(),
          visibility: z.enum(["public", "private"]).default("private"),
          cards: z
            .array(
              z.object({
                frontText: z.string().min(1),
                backText: z.string().min(1),
                colorTag: z.string().optional(),
              }),
            )
            .min(1)
            .max(100),
        }),
        execute: async (payload) => {
          return callBackend("/ai/decks/create-from-structured/", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        },
      }),
      openDeckPage: tool({
        description: "Resolve the deck page route by id or user intent query",
        parameters: z.object({
          deckId: z.number().int().optional(),
          query: z.string().optional(),
        }),
        execute: async ({ deckId, query }) => {
          const params = new URLSearchParams();
          if (deckId) params.set("deckId", String(deckId));
          if (query) params.set("query", query);
          return callBackend(`/ai/decks/open-target/?${params.toString()}`);
        },
      }),
    },
    maxSteps: 4,
  });

  return result.toDataStreamResponse({
    getErrorMessage,
  });
}
