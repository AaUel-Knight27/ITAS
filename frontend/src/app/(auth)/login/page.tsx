"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Lock, User } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import { getRoleHomePath } from "@/lib/roles";

type LoginFormValues = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, isAmharic } = useLanguage();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t("auth.username_required")),
        password: z.string().min(1, t("auth.password_required")),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(getRoleHomePath(session.user.role ?? ""));
    }
  }, [status, session, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);

    const result = await signIn("credentials", {
      username: values.username,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(t("auth.invalid_credentials"));
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className={`text-sm text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
            {t("auth.checking")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <main className="flex min-h-screen bg-slate-100 dark:bg-gray-950">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold text-primary-foreground">ITAS Learning Management System</span>
        </div>

        <div className="space-y-6">
          <h2 className={`text-4xl font-bold leading-tight text-primary-foreground text-balance ${isAmharic ? "ethiopic-text" : ""}`}>
            {t("auth.hero_title")}
          </h2>
          <p className={`text-lg text-primary-foreground/80 ${isAmharic ? "ethiopic-text" : ""}`}>
            {t("auth.hero_description")}
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">500+</p>
              <p className={`text-sm text-primary-foreground/70 ${isAmharic ? "ethiopic-text" : ""}`}>{t("auth.learning_resources")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">50K+</p>
              <p className={`text-sm text-primary-foreground/70 ${isAmharic ? "ethiopic-text" : ""}`}>{t("auth.active_learners")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">98%</p>
              <p className={`text-sm text-primary-foreground/70 ${isAmharic ? "ethiopic-text" : ""}`}>{t("auth.satisfaction_rate")}</p>
            </div>
          </div>
        </div>

        <p className={`text-sm text-primary-foreground/60 ${isAmharic ? "ethiopic-text" : ""}`}>
          {t("auth.ministry_division")}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 dark:bg-gray-900 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-end gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold text-foreground">TEP</span>
          </div>

          <div className="text-center lg:text-left">
            <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
              {t("auth.welcome_back")}
            </h1>
            <p className={`mt-2 text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
              {t("auth.sign_in_continue")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className={`text-sm font-medium text-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
                {t("auth.username")}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  {...register("username")}
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder={t("auth.enter_username")}
                />
              </div>
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className={`text-sm font-medium text-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-12 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder={t("auth.enter_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {authError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-medium text-destructive">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {t("auth.signing_in")}
                </span>
              ) : (
                t("auth.sign_in")
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-muted-foreground">{t("auth.need_help")}</span>
            </div>
          </div>

          <p className={`text-center text-sm text-muted-foreground ${isAmharic ? "ethiopic-text" : ""}`}>
            {t("auth.contact_admin")}
          </p>
        </div>
      </div>
    </main>
  );
}
