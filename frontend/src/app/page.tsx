"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Memory Card App
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Django + Next.js + shadcn/ui
        </p>
        <Button onClick={pingBackend} disabled={loading}>
          {loading ? "Pinging..." : "Ping Django Backend"}
        </Button>
        {apiStatus && (
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            {apiStatus}
          </p>
        )}
      </main>
    </div>
  );
}
