"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { categoryStyles, type Exercise } from "@/data/exercises";
import { fitsLevel, gmfcsRoman } from "@/data/gmfcs";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useHydrated } from "./useHydrated";

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const doneMap = useExerciseStore((s) => s.done);
  const gmfcs = useExerciseStore((s) => s.gmfcs);
  const hydrated = useHydrated();

  const done = hydrated && exercise.id in doneMap;
  const s = categoryStyles[exercise.category];
  const Icon = s.icon;

  return (
    <li
      style={{
        backgroundColor: s.bg,
        color: s.ink,
        // «пухлая» цветная тень снизу, как у кнопок
        boxShadow: `0 6px 0 ${s.mark}55`,
      }}
      className={`relative flex flex-col rounded-[32px] transition duration-300 ${
        done ? "" : "hover:-translate-y-1 hover:-rotate-[0.6deg]"
      }`}
    >
      {done && (
        <span className="absolute -right-1.5 -top-2.5 z-10 flex rotate-6 items-center gap-1.5 rounded-full bg-sun px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-[0_3px_0_var(--sun-deep)]">
          <Star className="size-4" fill="currentColor" strokeWidth={0} aria-hidden />
          Пройдено
        </span>
      )}

      <Link
        href={`/exercise/${exercise.id}`}
        className="flex flex-1 flex-col p-5 outline-none sm:p-6"
      >
        <span className="flex items-center gap-3 pr-16">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/70">
            <Icon
              className="size-6"
              style={{ color: s.mark }}
              strokeWidth={2.5}
              aria-hidden
            />
          </span>
          <span className="text-sm font-extrabold opacity-75">
            {exercise.category}
          </span>
        </span>

        <span className="heading-kid mt-4 block text-xl leading-[1.2] text-current sm:text-2xl">
          {exercise.title}
        </span>

        <span className="mt-2 block text-sm font-medium leading-relaxed opacity-80">
          {exercise.goal}
        </span>

        <span className="mt-4 flex items-center gap-2 text-xs font-bold">
          <span className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/60 px-3 py-1">
              {exercise.duration} мин
            </span>
            <span className="rounded-full bg-white/60 px-3 py-1">
              {exercise.level}
            </span>
            <span className="rounded-full bg-white/60 px-3 py-1">
              {exercise.age}
            </span>
            {hydrated && gmfcs !== null && !fitsLevel(exercise.id, gmfcs) && (
              <span className="rounded-full bg-white/85 px-3 py-1">
                Сложно для GMFCS {gmfcsRoman[gmfcs]}
              </span>
            )}
          </span>
          <span className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70">
            <ArrowRight className="size-[18px]" strokeWidth={3} aria-hidden />
          </span>
        </span>
      </Link>
    </li>
  );
}
