"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import type { TaskProgress } from "./progress-types";

const GOLD = "#daa668";
const CHECKPOINT_BLACK = "#000000";
const CHECKPOINT_YELLOW = "#FBD000";
const CHECKPOINT_GREEN = "#43B047";
const WIDTH = 300;
const HEIGHT = 140;
const LEFT = 26;
const RIGHT = 44;
const MID = 68;
const AMPLITUDE = 22;
const WAVES = 2;
const CHARACTER_LANE_OFFSET = 34;

function pointAt(progress: number) {
  const x = LEFT + progress * (WIDTH - LEFT - RIGHT);
  const y = MID - AMPLITUDE * Math.sin(progress * WAVES * 2 * Math.PI);
  return { x, y };
}

function normalOffsetAt(progress: number) {
  const tangentX = WIDTH - LEFT - RIGHT;
  const tangentY =
    -AMPLITUDE * WAVES * 2 * Math.PI *
    Math.cos(progress * WAVES * 2 * Math.PI);
  const tangentLength = Math.hypot(tangentX, tangentY);

  return {
    x: (tangentY / tangentLength) * CHARACTER_LANE_OFFSET,
    y: (-tangentX / tangentLength) * CHARACTER_LANE_OFFSET,
  };
}

const TRACK_PATH = Array.from({ length: 121 }, (_, index) => {
  const point = pointAt(index / 120);
  return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}).join(" ");

function toPercent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function useAnimatedProgress(target: number) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    const start = progressRef.current;
    const distance = Math.abs(target - start);
    if (distance === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const animationFrame = requestAnimationFrame(() => {
        progressRef.current = target;
        setProgress(target);
      });
      return () => cancelAnimationFrame(animationFrame);
    }

    const duration = Math.max(500, distance * 3000);
    const startTime = performance.now();
    let animationFrame = 0;

    const animate = (now: number) => {
      const fraction = Math.min((now - startTime) / duration, 1);
      const eased =
        fraction < 0.5
          ? 2 * fraction * fraction
          : 1 - Math.pow(-2 * fraction + 2, 2) / 2;
      const next = start + (target - start) * eased;
      progressRef.current = next;
      setProgress(next);
      if (fraction < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target]);

  return progress;
}

function FinishFlag() {
  return (
    <Image
      src="/finish-character-flag.png"
      alt="Mascot holding a checkered finish flag"
      width={400}
      height={300}
      unoptimized
      className="h-full w-full object-contain"
    />
  );
}

export default function ProgressTrack({
  task,
  onFinish,
}: {
  task: TaskProgress;
  onFinish: (taskId: string) => void | Promise<void>;
}) {
  const total = task.subtasks.length;
  const completedCount = task.subtasks.filter(
    (subtask) => subtask.completed,
  ).length;
  const furthestCompletedIndex = task.subtasks.reduce(
    (furthest, subtask, index) => (subtask.completed ? index : furthest),
    -1,
  );
  const firstIncompleteIndex = task.subtasks.findIndex(
    (subtask) => !subtask.completed,
  );
  const sequentialCompletedCount =
    firstIncompleteIndex === -1 ? total : firstIncompleteIndex;
  const isComplete = total > 0 && completedCount === total;
  const target = sequentialCompletedCount / (total + 1);
  const animatedProgress = useAnimatedProgress(target);
  const character = pointAt(animatedProgress);
  const characterOffset = normalOffsetAt(animatedProgress);
  const finishPoint = pointAt(1);
  const notified = useRef(false);
  const arrived = Math.abs(animatedProgress - target) < 0.001;
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const activeIndex = pinned ?? hovered;

  useEffect(() => {
    if (isComplete && arrived && !notified.current) {
      notified.current = true;
      void onFinish(task.id);
    }
  }, [arrived, isComplete, onFinish, task.id]);

  return (
    <article aria-label={`${task.name} progress`} className="w-full">
      <div className="mb-1 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-white px-4 py-2 text-lg font-semibold shadow-sm">
        <h2>{task.name}</h2>
        <span className="text-base font-medium text-charcoal/70">
          {completedCount} of {total} done
        </span>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="#7c7d7f"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="#d7d5cf"
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="#f4f1eb"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 11"
            opacity={0.9}
          />
        </svg>

        <div
          className="pointer-events-none absolute z-10 h-[84px] w-28"
          style={{
            left: toPercent(finishPoint.x, WIDTH),
            top: toPercent(finishPoint.y, HEIGHT),
            transform: "translate(-65%, -95%)",
          }}
        >
          <FinishFlag />
        </div>

        {task.subtasks.map((subtask, index) => {
          const position = (index + 1) / (total + 1);
          const point = pointAt(position);
          const checkpointColor = subtask.completed
            ? CHECKPOINT_GREEN
            : index < furthestCompletedIndex
              ? CHECKPOINT_YELLOW
              : CHECKPOINT_BLACK;
          const isActive = activeIndex === index;
          const tooltipOffset =
            position < 0.2 ? "-15%" : position > 0.8 ? "-85%" : "-50%";

          return (
            <div key={subtask.id}>
              <button
                type="button"
                aria-label={`Subtask ${index + 1}: ${subtask.description}. ${
                  subtask.completed ? "Completed" : "Not completed"
                }`}
                aria-pressed={pinned === index}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                onClick={() =>
                  setPinned((current) => (current === index ? null : index))
                }
                className="absolute z-20 flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue"
                style={{
                  left: toPercent(point.x, WIDTH),
                  top: toPercent(point.y, HEIGHT),
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold leading-none text-white"
                  style={{
                    backgroundColor: checkpointColor,
                  }}
                >
                  {subtask.completed ? "✓" : ""}
                </span>
              </button>

              {isActive && (
                <span
                  role="status"
                  className="pointer-events-none absolute z-30 w-max max-w-[200px] rounded-full px-3 py-1 text-base font-semibold text-charcoal shadow-sm"
                  style={{
                    left: toPercent(point.x, WIDTH),
                    top: toPercent(point.y, HEIGHT),
                    transform: `translate(${tooltipOffset}, 20px)`,
                    backgroundColor: GOLD,
                  }}
                >
                  {subtask.description}
                  {subtask.completed && (
                    <span className="font-medium"> (done)</span>
                  )}
                </span>
              )}
            </div>
          );
        })}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 h-11 w-11 overflow-hidden rounded-full border border-charcoal/30 bg-white shadow"
          style={{
            left: toPercent(character.x + characterOffset.x, WIDTH),
            top: toPercent(character.y + characterOffset.y, HEIGHT),
            transform: "translate(-50%, -50%)",
          }}
        >
          <Avatar id={task.characterId} className="h-full w-full object-contain" />
        </div>
      </div>
    </article>
  );
}
