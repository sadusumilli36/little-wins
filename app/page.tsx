"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type Subtask = {
  id: string;
  description: string;
  completed: boolean;
  display_order: number;
};

type Task = {
  id: string;
  name: string;
  due_at: string | null;
  status: "upcoming" | "in_progress" | "completed";
  subtasks: Subtask[];
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTasks() {
      const supabase = createClient();

      if (!supabase) {
        setMessage("Supabase is not configured yet.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setMessage(
          authError.name === "AuthSessionMissingError"
            ? "Sign in to see your tasks."
            : authError.message,
        );
        setLoading(false);
        return;
      }

      if (!user) {
        setMessage("Sign in to see your tasks.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("id, name, due_at, status, subtasks(id, description, completed, display_order)")
        .neq("status", "completed")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(3);

      if (error) {
        setMessage(error.message);
      } else {
        setTasks((data ?? []) as Task[]);
      }
      setLoading(false);
    }

    void loadTasks();
  }, []);

  const upcomingTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed"),
    [tasks],
  );

  async function toggleTask(task: Task) {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    const nextStatus = task.status === "completed" ? "in_progress" : "completed";
    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", task.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTasks((current) => current.filter((item) => item.id !== task.id));
  }

  async function toggleSubtask(task: Task, subtask: Subtask) {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    const { error } = await supabase
      .from("subtasks")
      .update({ completed: !subtask.completed })
      .eq("id", subtask.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    const updatedSubtasks = task.subtasks.map((item) =>
      item.id === subtask.id ? { ...item, completed: !item.completed } : item,
    );
    const allComplete =
      updatedSubtasks.length > 0 && updatedSubtasks.every((item) => item.completed);

    if (allComplete) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", task.id);

      if (taskError) {
        setMessage(taskError.message);
        return;
      }
      setTasks((current) => current.filter((item) => item.id !== task.id));
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, subtasks: updatedSubtasks } : item,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-sky-blue pb-28 text-charcoal">
      <div className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <Image
            src="/logo.png"
            alt="Little Wins"
            width={570}
            height={192}
            priority
            className="h-auto w-[570px] max-w-full"
          />
        </header>

        <section
          aria-labelledby="upcoming-heading"
          className="mx-auto mt-10 max-w-xl text-center"
        >
          <h1
            id="upcoming-heading"
            className="inline-flex rounded-full bg-coin-gold px-6 py-3 text-xl font-bold shadow-sm"
          >
            Upcoming Tasks
          </h1>

          <div className="mt-5 space-y-4 text-left">
            {loading && <EmptyState>Loading your tasks...</EmptyState>}
            {!loading && message && <EmptyState>{message}</EmptyState>}
            {!loading && !message && upcomingTasks.length === 0 && (
              <EmptyState>There are no tasks!</EmptyState>
            )}
            {!loading &&
              !message &&
              upcomingTasks.map((task) => {
                const completedCount = task.subtasks.filter(
                  (subtask) => subtask.completed,
                ).length;
                const expanded = expandedTaskId === task.id;

                return (
                  <article
                    key={task.id}
                    className="rounded-3xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => void toggleTask(task)}
                        aria-label={`Mark ${task.name} complete`}
                        className="mt-1 size-6 shrink-0 accent-forest-green"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold">{task.name}</h2>
                        <p className="mt-1 text-sm text-charcoal/75">
                          {task.subtasks.length === 0
                            ? "Ready when you are"
                            : `${completedCount} of ${task.subtasks.length} steps completed`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTaskId(expanded ? null : task.id)
                        }
                        aria-expanded={expanded}
                        aria-controls={`subtasks-${task.id}`}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl font-bold text-royal-blue transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                        aria-label={`${expanded ? "Hide" : "Show"} subtasks for ${task.name}`}
                      >
                        {expanded ? "−" : "+"}
                      </button>
                    </div>

                    {expanded && (
                      <div id={`subtasks-${task.id}`} className="mt-4 border-t border-sage-gray/40 pt-4">
                        {task.subtasks.length === 0 ? (
                          <p className="text-sm text-charcoal/75">No subtasks yet.</p>
                        ) : (
                          <ul className="space-y-3">
                            {task.subtasks
                              .slice()
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((subtask) => (
                                <li key={subtask.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() => void toggleSubtask(task, subtask)}
                                    className="size-5 accent-forest-green"
                                    aria-label={`Mark ${subtask.description} complete`}
                                  />
                                  <span className={subtask.completed ? "text-charcoal/50 line-through" : ""}>
                                    {subtask.description}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      </div>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 border-t border-charcoal/10 bg-white/95 shadow-[0_-4px_16px_rgba(41,45,50,0.08)] backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl justify-start gap-2 px-5 py-3">
          <Link
            href="/"
            aria-current="page"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-sm font-bold text-royal-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">⌂</span>
            Home
          </Link>
          <Link
            href="/progress"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">●</span>
            Progress
          </Link>
        </div>
      </nav>
    </main>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white px-5 py-8 text-center text-base shadow-sm">
      {children}
    </div>
  );
}
