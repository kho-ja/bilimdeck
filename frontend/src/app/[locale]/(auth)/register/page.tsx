import { RegisterForm } from "@/components/auth/RegisterForm";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const t = useTranslations("auth");

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
          {t("backToHome")}
        </Link>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            {t("loginButton")}
          </Link>
        </p>
      </div>
    </div>
  );
}
