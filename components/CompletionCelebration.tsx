"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function CompletionCelebration({
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-title"
        className="relative w-full max-w-sm rounded-3xl border-4 border-coin-gold bg-white px-6 py-8 text-center shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close completion message"
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-3xl leading-none text-charcoal/70 transition hover:bg-sky-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
        >
          ×
        </button>
        <Image
          src="/images/trophy.png"
          alt="Trophy"
          width={180}
          height={180}
          className="mx-auto h-40 w-40 object-contain"
        />
        <h2 id="completion-title" className="mt-3 text-3xl font-bold text-forest-green">
          Great job!
        </h2>
        <p className="mt-2 text-lg">Completed: {taskName}</p>
      </div>
    </div>
  );
}
