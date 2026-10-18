"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(() => Boolean(createClient()));
  const [error, setError] = useState<string | null>(() =>
    createClient() ? null : "Supabase is not configured yet.",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (!session) {
        setError("This reset link is missing or has expired. Request a new one.");
      }
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Your password has been updated. You can now log in.");
    setPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
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
          <h1 className="mt-6 text-2xl font-bold">Choose a new password</h1>
          <p className="mt-2 text-sm text-charcoal/75">
            Pick something you’ll remember for your next Little Wins session.
          </p>
        </div>

        {isCheckingSession ? (
          <p className="mt-8 text-center text-sm text-charcoal/75">Checking your reset link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="new-password" className="text-sm font-bold">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-sky-blue/40 px-4 focus:border-royal-blue focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-sm font-bold">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-sky-blue/40 px-4 focus:border-royal-blue focus:outline-none"
              />
            </div>

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

            {message ? (
              <button
                type="button"
                onClick={() => router.replace("/auth")}
                className="min-h-12 w-full rounded-full bg-royal-blue px-5 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
              >
                Back to log in
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || Boolean(error)}
                className="min-h-12 w-full rounded-full bg-royal-blue px-5 py-3 font-bold text-white transition hover:bg-royal-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Updating password..." : "Update password"}
              </button>
            )}
          </form>
        )}
        {!message && (
          <button
            type="button"
            onClick={() => router.replace("/auth")}
            className="mt-5 block w-full text-center text-sm font-bold text-royal-blue underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            Back to log in
          </button>
        )}
      </section>
    </main>
  );
}
