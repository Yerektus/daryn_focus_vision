"use client";

import { useMemo } from "react";
import { exercises } from "@/data/exercises";
import { useExerciseStore } from "@/store/useExerciseStore";
import ExerciseCard from "./ExerciseCard";
import Filters from "./Filters";

export default function ExerciseBoard() {
  const category = useExerciseStore((s) => s.category);
  const level = useExerciseStore((s) => s.level);
  const query = useExerciseStore((s) => s.query);
  const resetFilters = useExerciseStore((s) => s.resetFilters);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (category !== "Все" && e.category !== category) return false;
      if (level !== "Все" && e.level !== level) return false;
      if (q && !`${e.title} ${e.goal} ${e.category}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [category, level, query]);

  return (
    <>
      <Filters />

      <p className="mt-8 text-sm font-bold text-neutral-400">
        Упражнений в подборке: {filtered.length}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-[28px] bg-white p-10 text-center">
          <p className="text-lg font-extrabold tracking-tight text-neutral-800">
            Ничего не нашлось
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-extrabold text-white"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((e) => (
            <ExerciseCard key={e.id} exercise={e} />
          ))}
        </ul>
      )}
    </>
  );
}
