"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { X, Plus, Save, ArrowLeft } from "lucide-react";

// Card color options
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

export default function NewDeckPage() {
  const t = useTranslations("newDeck");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);

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

  const cards = watch("cards") || [];
  const visibility = watch("visibility");
  const testShuffle = watch("test_shuffle");
  const testSequential = watch("test_sequential");
  const studySpacedRepetition = watch("study_spaced_repetition");

  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (data: DeckFormData) => {
      const response = await apiClient.post("/decks/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      toast.success(t("deckCreatedSuccess"));
      setIsDirty(false);
      router.push("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || t("deckCreatedError");
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: DeckFormData) => {
    createDeckMutation.mutate(data);
  };

  const addCard = () => {
    setValue("cards", [
      ...cards,
      { front_text: "", back_text: "", color_tag: "" },
    ]);
    setIsDirty(true);
  };

  const removeCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setValue("cards", newCards);
    setIsDirty(true);
  };

  const updateCard = (
    index: number,
    field: "front_text" | "back_text" | "color_tag",
    value: string,
  ) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setValue("cards", newCards);
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm(t("confirmLeave"))) {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={createDeckMutation.isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={createDeckMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {createDeckMutation.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Deck Info */}
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
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={visibility === "private" ? "default" : "outline"}
                  onClick={() => {
                    setValue("visibility", "private");
                    setIsDirty(true);
                  }}
                  className="flex-1"
                >
                  {t("private")}
                </Button>
                <Button
                  type="button"
                  variant={visibility === "public" ? "default" : "outline"}
                  onClick={() => {
                    setValue("visibility", "public");
                    setIsDirty(true);
                  }}
                  className="flex-1"
                >
                  {t("public")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Mode Settings */}
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

        {/* Study Mode Settings */}
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

        {/* Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
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
            {cards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
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
                <Card key={index}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">
                        {t("cardNumber", { number: index + 1 })}
                      </h4>
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
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() =>
                              updateCard(index, "color_tag", color.value)
                            }
                            className={`w-8 h-8 rounded-full border-2 ${color.class} ${
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
      </form>
    </div>
  );
}
