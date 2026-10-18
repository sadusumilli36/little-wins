"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import ProfileNavLink from "@/components/ProfileNavLink";
import { createClient } from "@/lib/supabase";

type ProfileRow = {
  display_name: string | null;
  age: number | null;
  contact_name: string | null;
  contact_email: string | null;
};

const INPUT_CLASS =
  "mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-sky-blue/40 px-4 focus:border-royal-blue focus:outline-none";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSetup] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("setup") === "1",
  );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();

      if (!supabase) {
        setError("Supabase is not configured yet.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError && authError.name !== "AuthSessionMissingError") {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace("/auth");
        return;
      }

      setUserId(user.id);

      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("display_name, age, contact_name, contact_email")
        .maybeSingle<ProfileRow>();

      if (!active) return;

      if (loadError) {
        setError("We could not load your profile. Please try again.");
      } else if (data) {
        setName(data.display_name ?? "");
        setAge(data.age === null ? "" : String(data.age));
        setContactName(data.contact_name ?? "");
        setContactEmail(data.contact_email ?? "");
      }
      setLoading(false);
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createClient();
    if (!supabase || !userId) {
      setError("Supabase is not configured yet.");
      return;
    }

    const trimmedAge = age.trim();
    let ageValue: number | null = null;
    if (trimmedAge !== "") {
      ageValue = Number(trimmedAge);
      if (!Number.isInteger(ageValue) || ageValue < 1 || ageValue > 120) {
        setError("Please enter your age as a whole number from 1 to 120.");
        return;
      }
    }

    setSaving(true);

    const { error: saveError } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        display_name: name.trim() || null,
        age: ageValue,
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
      },
      { onConflict: "user_id" },
    );

    if (saveError) {
      setError("We could not save your profile. Please try again.");
    } else {
      setName((value) => value.trim());
      setContactName((value) => value.trim());
      setContactEmail((value) => value.trim());
      setMessage("Saved! Your profile is up to date.");
      if (isSetup) {
        router.replace("/");
        return;
      }
    }
    setSaving(false);
  }

  function skipSetup() {
    try {
      window.sessionStorage.setItem("lw-profile-setup-skipped", "1");
    } catch {
      // Storage can be unavailable; skipping still works for this visit.
    }
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-sky-blue pb-28 text-charcoal">
      <div className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
        <header className="text-center">
          <h1 className="inline-flex rounded-full bg-coin-gold px-8 py-3 text-2xl font-bold shadow-sm">
            Settings &amp; Profile
          </h1>
          <p className="mt-3 text-charcoal/75">
            {isSetup
              ? "Welcome to Little Wins! Let's set up your profile."
              : "Tell us a little about you."}
          </p>
        </header>

        <section
          aria-label="Profile details"
          className="mx-auto mt-8 max-w-xl rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        >
          {loading ? (
            <p className="py-6 text-center">Loading your profile...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset className="space-y-5">
                <legend className="text-lg font-bold">About you</legend>
                <div>
                  <label htmlFor="profile-name" className="text-sm font-bold">
                    Your name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    autoComplete="given-name"
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="profile-age" className="text-sm font-bold">
                    Your age
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={120}
                    step={1}
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-5 border-t border-sage-gray/40 pt-5">
                <legend className="text-lg font-bold">Primary contact</legend>
                <p className="text-sm text-charcoal/75">
                  This is a caregiver or guardian who can look over your
                  progress. You do the tasks. They can cheer you on.
                </p>
                <div>
                  <label htmlFor="contact-name" className="text-sm font-bold">
                    Primary contact&apos;s name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="off"
                    maxLength={100}
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-sm font-bold">
                    Primary contact&apos;s email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="off"
                    maxLength={254}
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className={INPUT_CLASS}
                  />
                  <p className="mt-2 text-xs text-charcoal/65">
                    We save this to your account. We do not send emails to your
                    contact yet.
                  </p>
                </div>
              </fieldset>

              {error && (
                <p
                  role="alert"
                  className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {error}
                </p>
              )}
              {message && (
                <p
                  role="status"
                  className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-forest-green"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="min-h-12 w-full rounded-full bg-royal-blue px-5 py-3 font-bold text-white transition hover:bg-royal-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {isSetup && (
                <button
                  type="button"
                  onClick={skipSetup}
                  className="block w-full text-center text-sm font-bold text-royal-blue underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                >
                  Skip for now
                </button>
              )}
            </form>
          )}
        </section>
      </div>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white opacity-100 shadow-[0_-4px_16px_rgba(41,45,50,0.08)]"
      >
        <div className="mx-auto flex max-w-2xl justify-between gap-2 px-5 py-3">
          <Link
            href="/"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">⌂</span>
            Home
          </Link>
          <Link
            href="/tasks"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">✓</span>
            Tasks
          </Link>
          <Link
            href="/progress"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">●</span>
            Progress
          </Link>
          <ProfileNavLink current />
        </div>
      </nav>
    </main>
  );
}
