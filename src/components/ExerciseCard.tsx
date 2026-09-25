"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { categoryStyles, type Exercise } from "@/data/exercises";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useHydrated } from "./useHydrated";

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const doneMap = useExerciseStore((s) => s.done);
  const hydrated = useHydrated();

  const done = hydrated && exercise.id in doneMap;
  const s = categoryStyles[exercise.category];

  return (
    <li
      style={{ backgroundColor: s.bg, color: s.ink }}
      className={`relative flex flex-col rounded-[28px] transition duration-300 ${
        done ? "ring-2 ring-neutral-900/25" : "hover:-translate-y-1"
      }`}
    >
      {done && (
        <BadgeCheck
          className="absolute right-5 top-5 z-10 size-7 text-neutral-900 sm:right-6 sm:top-6"
          fill="currentColor"
          stroke={s.bg}
          strokeWidth={2}
          aria-label="Пройдено"
        />
      )}

      <Link
        href={`/exercise/${exercise.id}`}
        className="flex flex-1 flex-col p-5 outline-none sm:p-6"
      >
        <span className="block pr-28 text-sm font-bold opacity-70">
          {exercise.category}
        </span>

        <span className="mt-3 block text-xl font-extrabold leading-[1.2] tracking-tight sm:text-2xl">
          {exercise.title}
        </span>

        <span className="mt-2 block text-sm font-medium leading-relaxed opacity-80">
          {exercise.goal}
        </span>

        <span className="mt-4 flex items-center gap-2 text-xs font-bold">
          <span className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/55 px-3 py-1">
              {exercise.duration} мин
            </span>
            <span className="rounded-full bg-white/55 px-3 py-1">
              {exercise.level}
            </span>
            <span className="rounded-full bg-white/55 px-3 py-1">
              {exercise.age}
            </span>
          </span>
          <ArrowRight
            className="ml-auto size-[18px] shrink-0 opacity-50"
            strokeWidth={3}
            aria-hidden
          />
        </span>
      </Link>
    </li>
  );
}
