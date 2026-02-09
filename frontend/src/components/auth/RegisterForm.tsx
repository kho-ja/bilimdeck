"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

import { useTranslations } from "next-intl";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const registerSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t("usernameRequired")),
        password: z.string().min(1, t("passwordRequired")),
        email: z.string().email(t("emailInvalid")).or(z.literal("")).optional(),
      }),
    [t],
  );

  type RegisterFormData = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      await apiClient.post("/auth/register/", {
        username: data.username,
        password: data.password,
        email: data.email || "",
      });

      const res = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(t("loginFailed"));
      }

      return res;
    },
    onSuccess: () => {
      toast.success(t("registerSuccess"));
      const returnTo = searchParams.get("returnTo");
      const safeReturnTo =
        returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";
      router.push(safeReturnTo);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("registerFailed"));
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t("registerTitle")}</CardTitle>
        <CardDescription>{t("registerDescription")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {registerMutation.isError && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("registerFailed")}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("username")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("username")}
                      {...field}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("emailOptional")}
                      {...field}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-center mt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? t("registering")
                : t("registerButton")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
