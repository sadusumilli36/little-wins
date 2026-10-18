"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ProgressTrack from "./ProgressTrack";
import { MOCK_TASKS } from "./progress-mock";

export default function ProgressPage() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [finishedQueue, setFinishedQueue] = useState<string[]>([]);

  const handleFinish = useCallback((taskId: string) => {
    setFinishedQueue((queue) =>
      queue.includes(taskId) ? queue : [...queue, taskId],
    );
  }, []);

  const finishedTask = MOCK_TASKS.find((task) => task.id === finishedQueue[0]);
  const visibleTasks = MOCK_TASKS.filter(
    (task) => !dismissed.includes(task.id),
  );

  const closePopup = () => {
    if (!finishedTask) return;
    setDismissed((current) => [...current, finishedTask.id]);
    setFinishedQueue((queue) => queue.slice(1));
  };

  return (
    <main className="min-h-screen bg-sky-blue pb-28 text-charcoal">
      <div className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
        <header className="text-center">
          <h1 className="inline-flex rounded-full bg-coin-gold px-8 py-3 text-2xl font-bold shadow-sm">
            Progress
          </h1>
          <p className="mt-3 text-charcoal/75">
            Each dot is a step along your task&apos;s path.
          </p>
        </header>

        <section
          aria-label="Task progress tracks"
          className="mx-auto mt-8 flex max-w-xl flex-col gap-8"
        >
          {visibleTasks.map((task) => (
            <ProgressTrack
              key={task.id}
              task={task}
              onFinish={handleFinish}
            />
          ))}

          {visibleTasks.length === 0 && (
            <p className="rounded-3xl bg-white px-5 py-8 text-center text-base shadow-sm">
              No tracks right now. Add a task to start a new one.
            </p>
          )}
        </section>
      </div>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 border-t border-charcoal/10 bg-white/95 shadow-[0_-4px_16px_rgba(41,45,50,0.08)] backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl justify-start gap-2 px-5 py-3">
          <Link
            href="/"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-sm font-bold text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">⌂</span>
            Home
          </Link>
          <Link
            href="/progress"
            aria-current="page"
            className="flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-5 text-sm font-bold text-royal-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
          >
            <span aria-hidden="true" className="text-2xl leading-5">●</span>
            Progress
          </Link>
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        className="w-full max-w-sm rounded-3xl border-4 border-coin-gold bg-white px-6 py-8 text-center shadow-xl"
      >
        <h2 id="finish-title" className="text-2xl font-bold">
          Hooray! You&apos;ve finished this task!
        </h2>
        <p className="mt-2 text-lg">{taskName}</p>
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
