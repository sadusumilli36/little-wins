"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Avatar, { AVATARS, type AvatarId, getAvatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase";
import ProgressFlagIcon from "../components/ProgressFlagIcon";

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
  character_id: string | null;
  character_color: string | null;
  subtasks: Subtask[];
};

const TASK_SELECTION =
  "id, name, due_at, status, character_id, character_color, subtasks(id, description, completed, display_order)";

function sortTasks(tasks: Task[]) {
  return tasks.slice().sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    if (!a.due_at) return b.due_at ? 1 : 0;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });
}

function formatDueDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      const supabase = createClient();
      if (!supabase) {
        setPageError("Supabase is not configured yet.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (authError) {
        setPageError(authError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        router.replace("/auth");
        return;
      }
      setIsAuthorized(true);

      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECTION)
        .order("due_at", { ascending: true, nullsFirst: false });

      if (!active) return;
      if (error) {
        setPageError(error.message);
      } else {
        setTasks(
          sortTasks(
            (data ?? []).map((task) => ({
              ...task,
              subtasks: task.subtasks
                .slice()
                .sort((a, b) => a.display_order - b.display_order),
            })) as Task[],
          ),
        );
        setPageError(null);
      }
      setLoading(false);
    }

    void loadTasks();
    return () => {
      active = false;
    };
  }, [retry, router]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed"),
    [tasks],
  );

  async function toggleTask(task: Task) {
    setActionError(null);
    const supabase = createClient();
    if (!supabase) {
      setActionError("Supabase is not configured yet.");
      return;
    }

    const nextStatus =
      task.status === "completed" ? "in_progress" : "completed";
    const { error } = await supabase.rpc("set_task_status_with_subtasks", {
      p_task_id: task.id,
      p_status: nextStatus,
    });

    if (error) {
      setActionError(`Could not update "${task.name}": ${error.message}`);
      return;
    }

    setTasks((current) =>
      sortTasks(
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: nextStatus,
                subtasks:
                  nextStatus === "completed"
                    ? item.subtasks.map((subtask) => ({
                        ...subtask,
                        completed: true,
                      }))
                    : item.subtasks,
              }
            : item,
        ),
      ),
    );
  }

  async function toggleSubtask(task: Task, subtask: Subtask) {
    setActionError(null);
    const supabase = createClient();
    if (!supabase) {
      setActionError("Supabase is not configured yet.");
      return;
    }

    const nextSubtasks = task.subtasks.map((item) =>
      item.id === subtask.id
        ? { ...item, completed: !item.completed }
        : item,
    );
    const allSubtasksComplete =
      nextSubtasks.length > 0 &&
      nextSubtasks.every((item) => item.completed);
    const nextTaskStatus =
      allSubtasksComplete
        ? "completed"
        : task.status === "completed" && subtask.completed
          ? "in_progress"
          : task.status;
    const { error } = await supabase
      .from("subtasks")
      .update({ completed: !subtask.completed })
      .eq("id", subtask.id);

    if (error) {
      setActionError(`Could not update step: ${error.message}`);
      return;
    }

    if (nextTaskStatus !== task.status) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: nextTaskStatus })
        .eq("id", task.id);

      if (taskError) {
        const { error: rollbackError } = await supabase
          .from("subtasks")
          .update({ completed: subtask.completed })
          .eq("id", subtask.id);
        setActionError(
          `All steps are checked, but the task could not be completed: ${taskError.message}${
            rollbackError
              ? ` The step also could not be rolled back: ${rollbackError.message}`
              : ""
          }`,
        );
        return;
      }
    }

    setTasks((current) =>
      sortTasks(
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: nextTaskStatus,
                subtasks: nextSubtasks,
              }
            : item,
        ),
      ),
    );
  }

  async function createTask(
    event: FormEvent<HTMLFormElement>,
    values: {
      name: string;
      avatarId: AvatarId;
      dueAt: string;
      subtasks: string[];
    },
  ) {
    event.preventDefault();
    setActionError(null);

    const supabase = createClient();
    if (!supabase) {
      setActionError("Supabase is not configured yet.");
      return false;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setActionError(
        authError?.message ?? "Your session expired. Please sign in again.",
      );
      if (!user) router.replace("/auth");
      return false;
    }

    const avatar = getAvatar(values.avatarId);
    const { data: insertedTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        name: values.name.trim(),
        due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null,
        character_id: avatar.id,
        character_color: avatar.background,
      })
      .select(TASK_SELECTION)
      .single();

    if (insertError) {
      setActionError(`Could not add task: ${insertError.message}`);
      return false;
    }

    const descriptions = values.subtasks
      .map((description) => description.trim())
      .filter(Boolean);
    let insertedSubtasks: Subtask[] = [];
    if (descriptions.length > 0) {
      const { data, error: subtaskError } = await supabase
        .from("subtasks")
        .insert(
          descriptions.map((description, index) => ({
            task_id: insertedTask.id,
            description,
            display_order: index,
          })),
        )
        .select("id, description, completed, display_order");

      if (subtaskError) {
        const { error: cleanupError } = await supabase
          .from("tasks")
          .delete()
          .eq("id", insertedTask.id);
        setActionError(
          `The task was created, but its steps could not be saved: ${subtaskError.message}${
            cleanupError
              ? ` The incomplete task could not be removed: ${cleanupError.message}`
              : ""
          }`,
        );
        return false;
      }
      insertedSubtasks = (data ?? []) as Subtask[];
    }

    const newTask: Task = {
      ...insertedTask,
      subtasks: insertedSubtasks,
    } as Task;

    setTasks((current) => sortTasks([...current, newTask]));
    setIsFormOpen(false);
    return true;
  }

  return (
    <main className="min-h-screen bg-sky-blue pb-28 text-charcoal">
      <div className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
        <header className="flex flex-col items-center gap-5 text-center">
          <Link href="/" aria-label="Little Wins home">
            <Image
              src="/logo.png"
              alt="Little Wins"
              width={570}
              height={192}
              priority
              className="h-auto w-[420px] max-w-full"
            />
          </Link>
          <div className="flex w-full items-center justify-between gap-4">
            <h1 className="inline-flex rounded-full bg-coin-gold px-6 py-3 text-xl font-bold shadow-sm">
              All Tasks
            </h1>
            {isAuthorized && (
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setIsFormOpen(true);
                }}
                className="flex min-h-12 items-center gap-2 rounded-full bg-royal-blue px-5 py-3 font-bold text-white shadow-sm transition hover:bg-royal-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
              >
                <span aria-hidden="true" className="text-2xl leading-5">+</span>
                New task
              </button>
            )}
          </div>
        </header>

        {actionError && (
          <p
            role="alert"
            className="mx-auto mt-6 max-w-xl rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {actionError}
          </p>
        )}

        <div className="mx-auto mt-8 max-w-xl space-y-9">
          {loading && <EmptyState>Loading your tasks...</EmptyState>}
          {!loading && pageError && (
            <div
              role="alert"
              className="rounded-3xl bg-white px-5 py-6 text-center shadow-sm"
            >
              <p>{pageError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setRetry((current) => current + 1);
                }}
                className="mt-4 min-h-11 rounded-full bg-royal-blue px-5 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !pageError && (
            <>
              <TaskSection
                title="To do"
                tasks={activeTasks}
                expandedTaskIds={expandedTaskIds}
                onToggleExpanded={(taskId) =>
                  setExpandedTaskIds((current) =>
                    current.includes(taskId)
                      ? current.filter((id) => id !== taskId)
                      : [...current, taskId],
                  )
                }
                onToggleTask={toggleTask}
                onToggleSubtask={toggleSubtask}
                emptyMessage="No tasks yet. Add one to get started!"
              />
              <TaskSection
                title="Completed"
                tasks={completedTasks}
                expandedTaskIds={expandedTaskIds}
                onToggleExpanded={(taskId) =>
                  setExpandedTaskIds((current) =>
                    current.includes(taskId)
                      ? current.filter((id) => id !== taskId)
                      : [...current, taskId],
                  )
                }
                onToggleTask={toggleTask}
                onToggleSubtask={toggleSubtask}
                emptyMessage="Finished tasks will show up here."
              />
            </>
          )}
        </div>
      </div>

      <PrimaryNavigation />

      {isFormOpen && (
        <NewTaskDialog
          onClose={() => setIsFormOpen(false)}
          onSubmit={createTask}
        />
      )}
    </main>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-3xl bg-white px-5 py-8 text-center text-base shadow-sm">
      {children}
    </p>
  );
}

function TaskSection({
  title,
  tasks,
  expandedTaskIds,
  onToggleExpanded,
  onToggleTask,
  onToggleSubtask,
  emptyMessage,
}: {
  title: string;
  tasks: Task[];
  expandedTaskIds: string[];
  onToggleExpanded: (taskId: string) => void;
  onToggleTask: (task: Task) => void;
  onToggleSubtask: (task: Task, subtask: Subtask) => void;
  emptyMessage: string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="inline-flex rounded-full bg-coin-gold px-5 py-2 text-lg font-bold shadow-sm">
        {title}
      </h2>
      <div className="mt-4 space-y-4">
        {tasks.length === 0 && <EmptyState>{emptyMessage}</EmptyState>}
        {tasks.map((task) => {
          const expanded = expandedTaskIds.includes(task.id);
          const completedCount = task.subtasks.filter(
            (subtask) => subtask.completed,
          ).length;
          const avatar = getAvatar(task.character_id);

          return (
            <article
              key={task.id}
              className={`rounded-3xl bg-white p-5 shadow-sm ${
                task.status === "completed" ? "opacity-80" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => onToggleTask(task)}
                  aria-label={`Mark ${task.name} ${
                    task.status === "completed" ? "to do" : "completed"
                  }`}
                  className="mt-3 size-6 shrink-0 accent-forest-green"
                />
                <Avatar
                  id={avatar.id}
                  label={`${avatar.name} avatar`}
                  className="mt-0.5 size-12 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-lg font-bold ${
                      task.status === "completed"
                        ? "text-charcoal/60 line-through"
                        : ""
                    }`}
                  >
                    {task.name}
                  </h3>
                  <p className="mt-1 text-sm text-charcoal/75">
                    {task.subtasks.length === 0
                      ? "No steps added"
                      : `${completedCount} of ${task.subtasks.length} steps completed`}
                  </p>
                  {formatDueDate(task.due_at) && (
                    <p className="mt-1 text-sm text-charcoal/65">
                      Due {formatDueDate(task.due_at)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleExpanded(task.id)}
                  aria-expanded={expanded}
                  aria-controls={`task-subtasks-${task.id}`}
                  aria-label={`${expanded ? "Hide" : "Show"} steps for ${task.name}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl font-bold text-royal-blue transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                >
                  {expanded ? "−" : "+"}
                </button>
              </div>

              {expanded && (
                <div
                  id={`task-subtasks-${task.id}`}
                  className="mt-4 border-t border-sage-gray/40 pt-4"
                >
                  {task.subtasks.length === 0 ? (
                    <p className="text-sm text-charcoal/75">No steps yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {task.subtasks.map((subtask) => (
                        <li
                          key={subtask.id}
                          className="flex items-start gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => onToggleSubtask(task, subtask)}
                            aria-label={`Mark ${subtask.description} ${
                              subtask.completed ? "not done" : "done"
                            }`}
                            className="mt-1 size-5 shrink-0 accent-forest-green"
                          />
                          <span
                            className={
                              subtask.completed
                                ? "text-charcoal/50 line-through"
                                : ""
                            }
                          >
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
  );
}

function NewTaskDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    values: {
      name: string;
      avatarId: AvatarId;
      dueAt: string;
      subtasks: string[];
    },
  ) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<AvatarId>(AVATARS[0].id);
  const [dueAt, setDueAt] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSubtask(index: number, value: string) {
    setSubtasks((current) =>
      current.map((description, itemIndex) =>
        itemIndex === index ? value : description,
      ),
    );
  }

  function moveSubtask(index: number, offset: -1 | 1) {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= subtasks.length) return;
    setSubtasks((current) => {
      const next = current.slice();
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  async function generateSubtasks() {
    const taskName = name.trim();
    if (!taskName) {
      setError("Enter a task name before generating steps.");
      return;
    }

    setError(null);
    setGenerating(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
        } = supabase
          ? await supabase.auth.getSession()
          : { data: { session: null } };
      if (!session?.access_token) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/generate-subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        credentials: "same-origin",
        body: JSON.stringify({ task: taskName }),
      });
      const result: { subtasks?: unknown; error?: string } =
        await response.json();

      if (!response.ok || !Array.isArray(result.subtasks)) {
        throw new Error(result.error ?? "Could not generate steps.");
      }

      const generated = result.subtasks.filter(
        (subtask): subtask is string =>
          typeof subtask === "string" && subtask.trim().length > 0,
      );
      if (generated.length === 0) {
        throw new Error("Gemini did not return any steps. Please try again.");
      }
      setSubtasks(generated);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate steps. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setError(null);
    if (!name.trim()) {
      event.preventDefault();
      setError("Enter a name for your task.");
      return;
    }

    if (dueAt && Number.isNaN(new Date(dueAt).getTime())) {
      event.preventDefault();
      setError("Choose a valid due date and time.");
      return;
    }

    setSaving(true);
    const success = await onSubmit(event, {
      name,
      avatarId,
      dueAt,
      subtasks,
    });
    if (!success) setSaving(false);
  }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 px-3 py-3 sm:items-center sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
        className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="new-task-title" className="text-2xl font-bold">
              Add a task
            </h2>
            <p className="mt-1 text-sm text-charcoal/70">
              Choose a buddy, add steps, and pick a due date.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close add task"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl font-bold text-charcoal/70 hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-6 space-y-6"
        >
          <div>
            <label htmlFor="task-name" className="text-sm font-bold">
              What do you want to do?
            </label>
            <input
              id="task-name"
              autoFocus
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Clean the kitchen"
              className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-sky-blue/30 px-4 focus:border-royal-blue focus:outline-none"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-bold">Choose your buddy</legend>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {AVATARS.map((avatar) => (
                <label
                  key={avatar.id}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-semibold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-royal-blue ${
                    avatarId === avatar.id
                      ? "border-royal-blue bg-sky-blue/50"
                      : "border-transparent hover:bg-sky-blue/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="task-avatar"
                    value={avatar.id}
                    checked={avatarId === avatar.id}
                    onChange={() => setAvatarId(avatar.id)}
                    className="sr-only"
                  />
                  <Avatar
                    id={avatar.id}
                    className="size-12"
                  />
                  {avatar.name}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => void generateSubtasks()}
            disabled={generating || saving}
            className="min-h-12 w-full rounded-full bg-coin-gold px-5 py-3 font-bold text-charcoal shadow-sm transition hover:bg-coin-gold/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue disabled:cursor-wait disabled:opacity-60"
          >
            {generating ? "Generating steps..." : "Generate steps"}
          </button>

          <fieldset>
            <legend className="text-sm font-bold">Steps</legend>
            <div className="mt-3 space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`new-subtask-${index}`}>
                    Step {index + 1}
                  </label>
                  <input
                    id={`new-subtask-${index}`}
                    value={subtask}
                    onChange={(event) =>
                      updateSubtask(index, event.target.value)
                    }
                    maxLength={200}
                    placeholder={`Step ${index + 1}`}
                    className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-sage-gray/40 px-3 focus:border-royal-blue focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => moveSubtask(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move step ${index + 1} up`}
                    className="size-10 rounded-full text-lg font-bold text-royal-blue hover:bg-sky-blue disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSubtask(index, 1)}
                    disabled={index === subtasks.length - 1}
                    aria-label={`Move step ${index + 1} down`}
                    className="size-10 rounded-full text-lg font-bold text-royal-blue hover:bg-sky-blue disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSubtasks((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    aria-label={`Delete step ${index + 1}`}
                    className="size-10 rounded-full text-lg font-bold text-red-700 hover:bg-red-50"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSubtasks((current) => [...current, ""])}
                className="min-h-10 rounded-full px-4 text-sm font-bold text-royal-blue hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
              >
                + Add a step
              </button>
            </div>
          </fieldset>

          <div>
            <label htmlFor="task-due-at" className="text-sm font-bold">
              Due date and time <span className="font-normal">(optional)</span>
            </label>
            <input
              id="task-due-at"
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border-2 border-sage-gray/50 bg-white px-4 focus:border-royal-blue focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-full bg-royal-blue px-5 py-3 font-bold text-white transition hover:bg-royal-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Adding task..." : "Add task"}
          </button>
        </form>
      </section>
    </div>
  );
}

function PrimaryNavigation() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 border-t border-charcoal/10 bg-white/95 shadow-[0_-4px_16px_rgba(41,45,50,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-2xl justify-start gap-2 px-5 py-3">
        <Link
          href="/"
          className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
        >
          <span aria-hidden="true" className="text-2xl leading-5">⌂</span>
          Home
        </Link>
        <Link
          href="/tasks"
          aria-current="page"
          className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold text-royal-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
        >
          <span aria-hidden="true" className="text-2xl leading-5">✓</span>
          Tasks
        </Link>
        <Link
          href="/progress"
          className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
        >
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center leading-none">
            <ProgressFlagIcon />
          </span>
          Progress
        </Link>
      </div>
    </nav>
  );
}
