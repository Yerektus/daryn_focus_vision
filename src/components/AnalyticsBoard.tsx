"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  categories,
  categoryStyles,
  exercises,
  type Level,
} from "@/data/exercises";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useHydrated } from "./useHydrated";

const levels: Level[] = ["Начальный", "Средний", "Продвинутый"];

/** Уровень это порядковая шкала, поэтому один тон от светлого к тёмному. */
const levelRamp: Record<Level, string> = {
  Начальный: "#9FCBE0",
  Средний: "#5FA5C6",
  Продвинутый: "#2585AE",
};

const DAYS = 14;
const dayLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric" });
const fullDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[28px] bg-white p-5 sm:p-6">
      <p className="text-sm font-bold text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold leading-none text-neutral-900 sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-neutral-500">{hint}</p>
    </div>
  );
}

export default function AnalyticsBoard() {
  const doneMap = useExerciseStore((s) => s.done);
  const results = useExerciseStore((s) => s.results);
  const hydrated = useHydrated();
  // сегодняшняя дата фиксируется один раз, чтобы рендер оставался чистым
  const [today] = useState(() => startOfDay(Date.now()));

  const stats = useMemo(() => {
    const done = hydrated ? doneMap : {};
    const doneIds = Object.keys(done);
    const doneSet = new Set(doneIds);

    const byCategory = categories.map((c) => {
      const list = exercises.filter((e) => e.category === c);
      return {
        category: c,
        total: list.length,
        done: list.filter((e) => doneSet.has(e.id)).length,
      };
    });

    const byLevel = levels.map((l) => {
      const list = exercises.filter((e) => e.level === l);
      return {
        level: l,
        total: list.length,
        done: list.filter((e) => doneSet.has(e.id)).length,
      };
    });

    const minutes = exercises
      .filter((e) => doneSet.has(e.id))
      .reduce((sum, e) => sum + e.duration, 0);

    const perDay = new Map<number, number>();
    for (const t of Object.values(done)) {
      const key = startOfDay(t);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
    const timeline = Array.from({ length: DAYS }, (_, i) => {
      const day = today - (DAYS - 1 - i) * 86_400_000;
      return { day, count: perDay.get(day) ?? 0 };
    });

    const recent = exercises
      .filter((e) => doneSet.has(e.id))
      .map((e) => ({ exercise: e, at: done[e.id] }))
      .sort((a, b) => b.at - a.at)
      .slice(0, 5);

    return {
      doneCount: doneIds.length,
      total: exercises.length,
      byCategory,
      byLevel,
      minutes,
      timeline,
      recent,
      activeDays: timeline.filter((d) => d.count > 0).length,
      startedDirections: byCategory.filter((c) => c.done > 0).length,
    };
  }, [doneMap, hydrated, today]);

  const percent = Math.round((stats.doneCount / stats.total) * 100);


  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      <header>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
          Аналитика занятий
        </h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">
          Сводка по упражнениям, пройденным с камерой. Данные хранятся только в
          этом браузере и не отправляются на сервер.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Выполнено"
          value={`${stats.doneCount} из ${stats.total}`}
          hint={`${percent}% комплекса`}
        />
        <Tile
          label="Суммарное время"
          value={`${stats.minutes} мин`}
          hint="По длительности отмеченных упражнений"
        />
        <Tile
          label="Направлений начато"
          value={`${stats.startedDirections} из ${categories.length}`}
          hint="Есть хотя бы одно выполненное"
        />
        <Tile
          label="Дней с занятиями"
          value={`${stats.activeDays} из ${DAYS}`}
          hint="За последние две недели"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-neutral-900">
            Прогресс по направлениям
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Выполнено упражнений из доступных в направлении
          </p>

          <ul className="mt-6 space-y-5">
            {stats.byCategory.map((row) => {
              const width = (row.done / row.total) * 100;
              return (
                <li key={row.category}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold text-neutral-700">
                      {row.category}
                    </span>
                    <span className="text-sm font-extrabold text-neutral-900">
                      {row.done}
                      <span className="font-semibold text-neutral-400">
                        {" "}
                        / {row.total}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full rounded-full bg-[#F1EEEA]">
                    <div
                      className="h-3 rounded-full transition-[width] duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: categoryStyles[row.category].mark,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-neutral-900">
            Активность за 14 дней
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Сколько упражнений отмечено в каждый день
          </p>

          {!hydrated ? (
            <div className="mt-6 h-52 rounded-2xl bg-[#F1EEEA]" />
          ) : (
            <div className="mt-6 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.timeline}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid stroke="#EFECE8" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(day) => dayLabel.format(Number(day))}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#A3A3A3", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#A3A3A3", fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ stroke: "#D8D3CC", strokeWidth: 1 }}
                    separator=": "
                    labelFormatter={(day) => fullDate.format(Number(day))}
                    formatter={(value) => [`${Number(value)} упр.`, "Отмечено"]}
                    contentStyle={{
                      borderRadius: 16,
                      border: "none",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <Line
                    type="linear"
                    dataKey="count"
                    stroke="#2585AE"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#2585AE", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-neutral-900">
            По уровню сложности
          </h2>
          <ul className="mt-6 space-y-5">
            {stats.byLevel.map((row) => (
              <li key={row.level}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-neutral-700">
                    {row.level}
                  </span>
                  <span className="text-sm font-extrabold text-neutral-900">
                    {row.done}
                    <span className="font-semibold text-neutral-400">
                      {" "}
                      / {row.total}
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-3 w-full rounded-full bg-[#F1EEEA]">
                  <div
                    className="h-3 rounded-full transition-[width] duration-500"
                    style={{
                      width: `${(row.done / row.total) * 100}%`,
                      backgroundColor: levelRamp[row.level],
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-neutral-900">
            Последние отметки
          </h2>
          {stats.recent.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-[#F1EEEA] p-6 text-sm text-neutral-500">
              Пока ничего не пройдено. Откройте упражнение, потренируйтесь с
              камерой, и здесь появится статистика.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100">
              {stats.recent.map(({ exercise, at }) => {
                const s = categoryStyles[exercise.category];
                // разбор есть не у всех отметок: старые ведут на само упражнение
                const href = results[exercise.id]
                  ? `/exercise/${exercise.id}/result`
                  : `/exercise/${exercise.id}`;
                return (
                  <li key={exercise.id}>
                    <Link
                      href={href}
                      className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-[#F7F5F2]"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.mark }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-neutral-800">
                          {exercise.title}
                        </span>
                        <span className="block text-xs text-neutral-400">
                          {exercise.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-neutral-500">
                        {hydrated ? fullDate.format(at) : ""}
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-neutral-300"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
