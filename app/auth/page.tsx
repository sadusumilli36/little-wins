"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() =>
    createClient() ? null : "Supabase is not configured yet.",
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted && user) {
        router.replace("/");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setIsResettingPassword(false);
    setError(null);
    setMessage(null);
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      setIsSubmitting(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Check your email for a link to choose a new password.");
    }
    setIsSubmitting(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      setIsSubmitting(false);
      return;
    }

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth`,
            },
          });

    if (result.error) {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Check your email to confirm your account, then come back to sign in.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-blue px-5 py-10 text-charcoal">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Little Wins"
            width={570}
            height={192}
            priority
            className="h-auto w-full max-w-[360px]"
          />
          <h1 className="mt-6 text-2xl font-bold">
            {isResettingPassword
              ? "Reset your password"
              : mode === "sign-in"
                ? "Welcome back!"
                : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-charcoal/75">
            {isResettingPassword
              ? "Enter your email and we’ll send you a reset link."
              : mode === "sign-in"
                ? "Sign in to keep your little wins moving."
                : "Save your tasks and progress wherever you go."}
          </p>
        </div>

        {!isResettingPassword && (
          <div className="mt-8 grid grid-cols-2 rounded-full bg-sky-blue p-1" role="tablist" aria-label="Account access">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-in"}
              onClick={() => changeMode("sign-in")}
              className={`min-h-11 rounded-full px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue ${
                mode === "sign-in" ? "bg-coin-gold" : "text-charcoal/70"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-up"}
              onClick={() => changeMode("sign-up")}
              className={`min-h-11 rounded-full px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue ${
                mode === "sign-up" ? "bg-coin-gold" : "text-charcoal/70"
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        <form
          onSubmit={isResettingPassword ? handlePasswordResetRequest : handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label htmlFor="email" className="text-sm font-bold">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-sky-blue/40 px-4 focus:border-royal-blue focus:outline-none"
            />
          </div>
          {!isResettingPassword && (
            <div>
            <label htmlFor="password" className="text-sm font-bold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-sky-blue/40 px-4 focus:border-royal-blue focus:outline-none"
            />
            {mode === "sign-up" && (
              <p className="mt-2 text-xs text-charcoal/65">Use at least 6 characters.</p>
            )}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-forest-green">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 w-full rounded-full bg-royal-blue px-5 py-3 font-bold text-white transition hover:bg-royal-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait..."
              : isResettingPassword
                ? "Send reset link"
                : mode === "sign-in"
                  ? "Log in"
                  : "Create account"}
          </button>
        </form>

        {!isResettingPassword && mode === "sign-in" && (
          <button
            type="button"
            onClick={() => {
              setIsResettingPassword(true);
              setError(null);
              setMessage(null);
            }}
            className="mt-5 block w-full text-center text-sm font-bold text-royal-blue underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            Forgot your password?
          </button>
        )}

        {isResettingPassword && (
          <button
            type="button"
            onClick={() => changeMode("sign-in")}
            className="mt-5 block w-full text-center text-sm font-bold text-royal-blue underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            Back to log in
          </button>
        )}
      </section>
    </main>
  );
}
