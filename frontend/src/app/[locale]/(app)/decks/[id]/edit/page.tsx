"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Plus,
  Save,
  ArrowLeft,
  Eye,
  Lock,
  Sparkles,
  Undo2,
} from "lucide-react";
import type { DeckEdit } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

const COLOR_OPTIONS = [
  {
    value: "blue",
    labelKey: "colorBlue",
    class: "bg-blue-100 dark:bg-blue-900",
  },
  {
    value: "green",
    labelKey: "colorGreen",
    class: "bg-green-100 dark:bg-green-900",
  },
  {
    value: "yellow",
    labelKey: "colorYellow",
    class: "bg-yellow-100 dark:bg-yellow-900",
  },
  { value: "red", labelKey: "colorRed", class: "bg-red-100 dark:bg-red-900" },
  {
    value: "purple",
    labelKey: "colorPurple",
    class: "bg-purple-100 dark:bg-purple-900",
  },
  {
    value: "gray",
    labelKey: "colorGray",
    class: "bg-gray-100 dark:bg-gray-900",
  },
];

export default function EditDeckPage() {
  const t = useTranslations("newDeck");
  const router = useRouter();
  const params = useParams();
  const deckId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [deletedCardIds, setDeletedCardIds] = useState<Array<string | number>>(
    [],
  );
  const [removedCards, setRemovedCards] = useState<
    Array<{
      tempId: string;
      index: number;
      card: DeckFormData["cards"][number];
    }>
  >([]);

  const deckSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(3, t("deckNameMin")).max(200, t("deckNameMax")),
          description: z.string().optional(),
          visibility: z.enum(["public", "private"]),
          test_shuffle: z.boolean(),
          test_sequential: z.boolean(),
          study_spaced_repetition: z.boolean(),
          cards: z
            .array(
              z.object({
                id: z.union([z.string(), z.number()]).optional(),
                front_text: z.string().min(1, t("frontTextRequired")),
                back_text: z.string().min(1, t("backTextRequired")),
                color_tag: z.string().optional(),
              }),
            )
            .min(0),
        })
        .refine(
          (data) => {
            if (data.test_sequential && data.test_shuffle) {
              return false;
            }
            return true;
          },
          {
            message: t("shuffleDisabledMessage"),
            path: ["test_shuffle"],
          },
        ),
    [t],
  );

  type DeckFormData = z.infer<typeof deckSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DeckFormData>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "private",
      test_shuffle: true,
      test_sequential: false,
      study_spaced_repetition: true,
      cards: [],
    },
  });

  const {
    data: deck,
    isLoading,
    error,
    refetch,
  } = useQuery<DeckEdit>({
    queryKey: ["deck-edit", deckId],
    enabled: Boolean(deckId),
    queryFn: async () => {
      const response = await apiClient.get(`/decks/${deckId}/edit/`);
      return response.data;
    },
  });

  useEffect(() => {
    if (!deck) return;
    reset({
      name: deck.name,
      description: deck.description || "",
      visibility: deck.visibility,
      test_shuffle: deck.test_shuffle,
      test_sequential: deck.test_sequential,
      study_spaced_repetition: deck.study_spaced_repetition,
      cards: deck.cards || [],
    });
    setDeletedCardIds([]);
    setIsDirty(false);
  }, [deck, reset]);

  const cards = watch("cards") || [];
  const visibility = watch("visibility");
  const testShuffle = watch("test_shuffle");
  const testSequential = watch("test_sequential");
  const studySpacedRepetition = watch("study_spaced_repetition");

  const updateMutation = useMutation({
    mutationFn: async (data: DeckFormData) => {
      const response = await apiClient.put(`/decks/${deckId}/edit/`, {
        ...data,
        deletedCardIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      queryClient.invalidateQueries({ queryKey: ["deck-details", deckId] });
      toast.success(t("deckCreatedSuccess"));
      setIsDirty(false);
      router.push(`/decks/${deckId}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || t("deckCreatedError");
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: DeckFormData) => {
    updateMutation.mutate(data);
  };

  const addCard = () => {
    setValue("cards", [
      ...cards,
      { front_text: "", back_text: "", color_tag: "" },
    ]);
    setIsDirty(true);
  };

  const removeCard = (index: number) => {
    const cardToRemove = cards[index];
    if (cardToRemove?.id) {
      setDeletedCardIds((prev) => [
        ...prev,
        cardToRemove.id as string | number,
      ]);
    }
    setRemovedCards((prev) => [
      {
        tempId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        index,
        card: cardToRemove,
      },
      ...prev,
    ]);
    const newCards = cards.filter((_, i) => i !== index);
    setValue("cards", newCards);
    setIsDirty(true);
  };

  const undoRemoveCard = (tempId: string) => {
    const removed = removedCards.find((item) => item.tempId === tempId);
    if (!removed) return;

    if (removed.card?.id) {
      setDeletedCardIds((prev) => prev.filter((id) => id !== removed.card.id));
    }

    const nextCards = [...cards];
    const insertIndex = Math.min(removed.index, nextCards.length);
    nextCards.splice(insertIndex, 0, removed.card);
    setValue("cards", nextCards);
    setRemovedCards((prev) => prev.filter((item) => item.tempId !== tempId));
    setIsDirty(true);
  };

  const updateCard = (
    index: number,
    field: "front_text" | "back_text" | "color_tag",
    value: string,
  ) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setValue("cards", newCards);
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm(t("confirmLeave"))) {
        router.push(`/decks/${deckId}`);
      }
    } else {
      router.push(`/decks/${deckId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8 sm:px-10 lg:px-12">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t("errorTitle")}
        description={t("errorMessage")}
        retryLabel={t("retry")}
        onRetry={() => refetch()}
        actionLabel={t("backToDeck")}
        onAction={() => router.push(`/decks/${deckId}`)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-3xl border bg-gradient-to-br from-amber-100/70 via-background to-rose-100/70 p-6 shadow-sm dark:border-white/10 dark:from-amber-500/10 dark:via-background dark:to-rose-500/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {t("editTitle")}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("editTitle")}
              </h1>
              <p className="text-muted-foreground">{t("editSubtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                {t("cards")}: {cards.length}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              <span>
                {visibility === "public" ? t("public") : t("private")}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("deckInfo")}</CardTitle>
                <CardDescription>{t("deckInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("deckName")} *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder={t("deckNamePlaceholder")}
                    onChange={(e) => {
                      register("name").onChange(e);
                      setIsDirty(true);
                    }}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("description")}</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder={t("descriptionPlaceholder")}
                    onChange={(e) => {
                      register("description").onChange(e);
                      setIsDirty(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("visibility")}</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant={visibility === "private" ? "default" : "outline"}
                      onClick={() => {
                        setValue("visibility", "private");
                        setIsDirty(true);
                      }}
                      className="w-full"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {t("private")}
                    </Button>
                    <Button
                      type="button"
                      variant={visibility === "public" ? "default" : "outline"}
                      onClick={() => {
                        setValue("visibility", "public");
                        setIsDirty(true);
                      }}
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t("public")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("testModeSettings")}</CardTitle>
                <CardDescription>{t("testModeDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("shuffle")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("shuffleDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={testShuffle}
                    onCheckedChange={(checked) => {
                      setValue("test_shuffle", checked);
                      setIsDirty(true);
                    }}
                    disabled={testSequential}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("sequential")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("sequentialDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={testSequential}
                    onCheckedChange={(checked) => {
                      setValue("test_sequential", checked);
                      if (checked) setValue("test_shuffle", false);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {errors.test_shuffle && (
                  <p className="text-sm text-destructive">
                    {errors.test_shuffle.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("studyModeSettings")}</CardTitle>
                <CardDescription>{t("studyModeDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("spacedRepetition")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("spacedRepetitionDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={studySpacedRepetition}
                    onCheckedChange={(checked) => {
                      setValue("study_spaced_repetition", checked);
                      setIsDirty(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{t("cards")}</CardTitle>
                    <CardDescription>{t("cardsDesc")}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addCard}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addCard")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {removedCards.length > 0 && (
                  <div className="rounded-2xl border border-dashed p-4">
                    <p className="text-sm font-semibold">{t("removedCards")}</p>
                    <div className="mt-3 flex flex-col gap-2">
                      {removedCards.map((item) => (
                        <div
                          key={item.tempId}
                          className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"
                        >
                          <span className="line-clamp-1">
                            {item.card.front_text || t("cardRemoved")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => undoRemoveCard(item.tempId)}
                          >
                            <Undo2 className="mr-2 h-4 w-4" />
                            {t("undo")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cards.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                    <p>{t("noCards")}</p>
                    <Button
                      type="button"
                      onClick={addCard}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addFirstCard")}
                    </Button>
                  </div>
                ) : (
                  cards.map((card, index) => (
                    <Card key={index} className="border-muted/60 shadow-sm">
                      <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">
                              {t("cardNumber", { number: index + 1 })}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {card.color_tag
                                ? t("colorTag") + `: ${card.color_tag}`
                                : t("colorTag")}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCard(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>{t("frontText")} *</Label>
                          <Textarea
                            value={card.front_text}
                            onChange={(e) =>
                              updateCard(index, "front_text", e.target.value)
                            }
                            placeholder={t("frontTextPlaceholder")}
                            rows={2}
                          />
                          {errors.cards?.[index]?.front_text && (
                            <p className="text-sm text-destructive">
                              {errors.cards[index].front_text?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("backText")} *</Label>
                          <Textarea
                            value={card.back_text}
                            onChange={(e) =>
                              updateCard(index, "back_text", e.target.value)
                            }
                            placeholder={t("backTextPlaceholder")}
                            rows={2}
                          />
                          {errors.cards?.[index]?.back_text && (
                            <p className="text-sm text-destructive">
                              {errors.cards[index].back_text?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>{t("colorTag")}</Label>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() =>
                                  updateCard(index, "color_tag", color.value)
                                }
                                className={`h-8 w-8 rounded-full border-2 ${color.class} ${
                                  card.color_tag === color.value
                                    ? "border-primary ring-2 ring-primary ring-offset-2"
                                    : "border-transparent"
                                }`}
                                title={t(color.labelKey)}
                                aria-label={t(color.labelKey)}
                              />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
