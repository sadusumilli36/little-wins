"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ProfileNavLink from "@/components/ProfileNavLink";
import { createClient } from "@/lib/supabase";
import ProgressFlagIcon from "../components/ProgressFlagIcon";
import ProgressTrack from "./ProgressTrack";
import type { SubtaskProgress, TaskProgress } from "./progress-types";

type SupabaseTask = {
  id: string;
  name: string;
  status: "upcoming" | "in_progress" | "completed";
  character_id: string | null;
  character_color: string | null;
  subtasks: SubtaskProgress[];
};

export default function ProgressPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [finishedQueue, setFinishedQueue] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProgress(showLoading: boolean) {
      if (showLoading) setLoading(true);
      setError(null);
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
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        router.replace("/auth");
        return;
      }
      setUserId(user.id);

      let dismissedTaskIds: string[] = [];
      try {
        const savedDismissals = window.localStorage.getItem(
          `little-wins:progress-dismissed:${user.id}`,
        );
        const parsed: unknown = savedDismissals ? JSON.parse(savedDismissals) : [];
        if (
          !Array.isArray(parsed) ||
          !parsed.every((taskId): taskId is string => typeof taskId === "string")
        ) {
          throw new Error("Saved progress dismissals have an invalid format.");
        }
        dismissedTaskIds = parsed;
      } catch (storageError) {
        setError(
          `Could not read saved progress dismissals: ${
            storageError instanceof Error
              ? storageError.message
              : "browser storage is unavailable"
          }`,
        );
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("tasks")
        .select(
          "id, name, status, character_id, character_color, subtasks(id, description, completed, display_order)",
        )
        .order("created_at", { ascending: true });

      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const loadedTasks = (data ?? []) as SupabaseTask[];
      const alreadyCompleted = loadedTasks.filter(
        (task) =>
          task.status !== "completed" &&
          task.subtasks.length > 0 &&
          task.subtasks.every((subtask) => subtask.completed),
      );

      if (alreadyCompleted.length > 0) {
        const { error: statusError } = await supabase
          .from("tasks")
          .update({ status: "completed" })
          .in(
            "id",
            alreadyCompleted.map((task) => task.id),
          );

        if (statusError) {
          setError(`Could not complete finished tasks: ${statusError.message}`);
          setLoading(false);
          return;
        }
      }

      const completedTaskIds = new Set(
        loadedTasks
          .filter(
            (task) =>
              task.status === "completed" ||
              alreadyCompleted.some((completed) => completed.id === task.id),
          )
          .map((task) => task.id),
      );
      const activeDismissedTaskIds = dismissedTaskIds.filter((taskId) =>
        completedTaskIds.has(taskId),
      );

      if (activeDismissedTaskIds.length !== dismissedTaskIds.length) {
        try {
          window.localStorage.setItem(
            `little-wins:progress-dismissed:${user.id}`,
            JSON.stringify(activeDismissedTaskIds),
          );
        } catch (storageError) {
          setError(
            `Could not update saved progress dismissals: ${
              storageError instanceof Error
                ? storageError.message
                : "browser storage is unavailable"
            }`,
          );
          setLoading(false);
          return;
        }
      }

      setDismissed(activeDismissedTaskIds);
      setTasks(
        loadedTasks.map((task) => ({
          id: task.id,
          name: task.name,
          status:
            alreadyCompleted.some((completed) => completed.id === task.id)
              ? "completed"
              : task.status,
          characterId: task.character_id,
          characterColor: task.character_color,
          subtasks: task.subtasks
            .slice()
            .sort((a, b) => a.display_order - b.display_order),
        })),
      );
      setError(null);
      setLoading(false);
    }

    void loadProgress(true);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadProgress(false);
      }
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [retry, router]);

  const handleFinish = useCallback(async (taskId: string) => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    const { error: statusError } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId);

    if (statusError) {
      setError(`Could not complete task: ${statusError.message}`);
      return;
    }

    setDismissed((current) => {
      if (current.includes(taskId)) return current;
      return [...current, taskId];
    });
    setFinishedQueue((queue) =>
      queue.includes(taskId) ? queue : [...queue, taskId],
    );
    if (userId) {
      const storageKey = `little-wins:progress-dismissed:${userId}`;
      try {
        const saved = window.localStorage.getItem(storageKey);
        const savedIds: unknown = saved ? JSON.parse(saved) : [];
        const dismissedIds = Array.isArray(savedIds)
          ? savedIds.filter((id): id is string => typeof id === "string")
          : [];
        if (!dismissedIds.includes(taskId)) {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify([...dismissedIds, taskId]),
          );
        }
      } catch (storageError) {
        setError(
          `Could not save completed progress: ${
            storageError instanceof Error
              ? storageError.message
              : "browser storage is unavailable"
          }`,
        );
      }
    }
  }, [userId]);

  const finishedTask = tasks.find((task) => task.id === finishedQueue[0]);
  const visibleTasks = tasks.filter(
    (task) => task.status !== "completed" && !dismissed.includes(task.id),
  );

  const closePopup = () => {
    if (!finishedTask) return;
    setFinishedQueue((queue) => queue.slice(1));
  };

  return (
    <main className="min-h-screen bg-sky-blue pb-[calc(7rem+env(safe-area-inset-bottom))] text-charcoal">
      <div className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
        <header className="text-center">
          <h1 className="inline-flex rounded-full bg-coin-gold px-8 py-3 text-2xl font-bold shadow-sm">
            Progress
          </h1>
          <p className="mt-5 text-lg text-charcoal/75">
            Each dot is a step along your task&apos;s path.
          </p>
        </header>

        <section
          aria-label="Task progress tracks"
          className="mx-auto mt-12 flex max-w-xl flex-col gap-10"
        >
          {loading && (
            <p role="status" className="rounded-3xl bg-white px-5 py-8 text-center text-lg shadow-sm">
              Loading your progress...
            </p>
          )}

          {!loading && error && (
            <div role="alert" className="rounded-3xl bg-white px-5 py-8 text-center text-lg shadow-sm">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((current) => current + 1)}
                className="mt-4 min-h-11 rounded-full bg-royal-blue px-5 py-2 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && visibleTasks.map((task) => (
            <ProgressTrack
              key={task.id}
              task={task}
              onFinish={handleFinish}
            />
          ))}

          {!loading && !error && visibleTasks.length === 0 && (
            <p className="rounded-3xl bg-white px-5 py-8 text-center text-lg shadow-sm">
              No tracks right now. Add a task to start a new one.
            </p>
          )}
        </section>
      </div>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(41,45,50,0.08)]"
      >
        <div className="mx-auto flex max-w-2xl justify-between gap-2 px-5 py-3">
          <Link
            href="/"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-base font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">⌂</span>
            Home
          </Link>
          <Link
            href="/tasks"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-base font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">✓</span>
            Tasks
          </Link>
          <Link
            href="/progress"
            aria-current="page"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-base font-bold text-royal-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center leading-none">
              <ProgressFlagIcon />
            </span>
            Progress
          </Link>
          <ProfileNavLink />
        </div>
      </nav>

      {finishedTask && (
        <FinishPopup taskName={finishedTask.name} onClose={closePopup} />
      )}
    </main>
  );
}

function FinishPopup({
  taskName,
  onClose,
}: {
  taskName: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        className="w-full max-w-sm rounded-3xl border-4 border-coin-gold bg-white px-6 py-8 text-center shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="finish-title" className="text-2xl font-bold">
          Hooray, you&apos;ve finished this task!
        </h2>
        <p className="mt-2 text-xl">Completed: {taskName}</p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-6 rounded-full bg-royal-blue px-8 py-3 text-lg font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
        >
          Close
        </button>
      </div>
    </div>
  );
}
