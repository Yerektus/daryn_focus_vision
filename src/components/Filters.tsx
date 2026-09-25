"use client";

import { Search } from "lucide-react";
import { categories, type Category, type Level } from "@/data/exercises";
import { useExerciseStore } from "@/store/useExerciseStore";
import Select from "./Select";

const levels: Level[] = ["Начальный", "Средний", "Продвинутый"];

const categoryOptions = [
  { value: "Все", label: "Все виды" },
  ...categories.map((c) => ({ value: c, label: c })),
];

const levelOptions = [
  { value: "Все", label: "Любой уровень" },
  ...levels.map((l) => ({ value: l, label: l })),
];

export default function Filters() {
  const { category, level, query, setCategory, setLevel, setQuery } =
    useExerciseStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-[18px] -translate-y-1/2 text-neutral-400"
          strokeWidth={2.5}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти упражнение"
          aria-label="Поиск упражнений"
          className="w-full rounded-full bg-white py-4 pl-13 pr-5 text-sm font-semibold text-neutral-800 outline-none placeholder:font-medium placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
        />
      </div>

      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <Select
          value={category}
          options={categoryOptions}
          onChange={(v) => setCategory(v as Category | "Все")}
          label="Вид упражнений"
        />
        <Select
          value={level}
          options={levelOptions}
          onChange={(v) => setLevel(v as Level | "Все")}
          label="Уровень сложности"
        />
      </div>
    </div>
  );
}
