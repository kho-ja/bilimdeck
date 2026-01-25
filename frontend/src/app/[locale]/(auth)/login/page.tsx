import { LoginForm } from '@/components/auth/LoginForm';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
