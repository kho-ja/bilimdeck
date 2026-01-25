'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const loginSchema = useMemo(() => z.object({
    username: z.string().min(1, t('usernameRequired')),
    password: z.string().min(1, t('passwordRequired')),
  }), [t]);

  type LoginFormData = z.infer<typeof loginSchema>;

  // React Hook Form setup with shadcn Form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // React Query mutation for login
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(t('invalidCredentials'));
      }

      return res;
    },
    onSuccess: () => {
      toast.success(t('loginSuccess'));
      router.push('/dashboard');
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('loginFailed'));
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('loginTitle')}</CardTitle>
        <CardDescription>{t('loginDescription')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {loginMutation.isError && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('invalidCredentials')}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('username')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('username')}
                      {...field}
                      disabled={loginMutation.isPending}
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
                  <FormLabel>{t('password')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={loginMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-center mt-4">
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t('loggingIn') : t('loginButton')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
