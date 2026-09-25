"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Lightbulb,
  RotateCcw,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import type { CoachPlan } from "@/data/coach";
import { categoryStyles, type Exercise } from "@/data/exercises";
import { useExerciseStore, type SessionResult } from "@/store/useExerciseStore";
import { useHydrated } from "./useHydrated";

type Finding = { title: string; advice: string };

/** «32 с», «3 мин», «3 мин 34 с»: нулевые части не показываем. */
function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} с`;
  if (seconds === 0) return `${minutes} мин`;
  return `${minutes} мин ${seconds} с`;
}

/** Разбор по локальным правилам: работает и без ключа OpenRouter. */
function analyze(result: SessionResult, plan: CoachPlan) {
  const wins: string[] = [];
  const issues: Finding[] = [];
  // в режиме рук корпус не отслеживается, выводы про плечи были бы выдумкой
  const tracksBody = plan.mode !== "hand";

  if (tracksBody && result.inFramePct >= 90) {
    wins.push("Почти всё занятие ребёнок был полностью в кадре");
  } else if (tracksBody && result.inFramePct < 75) {
    issues.push({
      title: `В кадре целиком только ${result.inFramePct}% времени`,
      advice:
        "Отодвиньте камеру на 2–3 метра и снимайте так, чтобы в кадр попадали стопы и голова. Тогда счёт повторений будет точнее.",
    });
  }

  if (tracksBody && result.shoulderTiltPct <= 10) {
    wins.push("Плечи держались ровно");
  } else if (tracksBody && result.shoulderTiltPct > 20) {
    issues.push({
      title: `Перекос плеч в ${result.shoulderTiltPct}% кадров`,
      advice:
        "Поставьте зеркало сбоку и напоминайте про ровные плечи перед каждым повторением. Можно снизить темп, чтобы ребёнок успевал контролировать положение.",
    });
  }

  if (tracksBody && result.hipTiltPct > 20) {
    issues.push({
      title: `Таз заваливался на бок в ${result.hipTiltPct}% кадров`,
      advice:
        "Проверьте, одинаково ли распределён вес на обе стопы. Помогает опора рукой с более слабой стороны и пауза в верхней точке.",
    });
  } else if (tracksBody && result.hipTiltPct <= 10) {
    wins.push("Таз оставался в ровном положении");
  }

  if (plan.mode === "reps") {
    if (result.reps >= plan.target) {
      wins.push(`Выполнено ${result.reps} повторений из ${plan.target}`);
    }
    if (result.shallowReps > 0) {
      issues.push({
        title: `${result.shallowReps} повторений без полной амплитуды`,
        advice:
          "Движение не доводилось до конца. Сделайте меньше повторений, но с паузой в крайней точке на 2–3 секунды.",
      });
    }
  }

  if (plan.mode === "hold") {
    if (result.rounds >= plan.rounds) {
      wins.push(`Пройдено ${result.rounds} кругов по ${plan.seconds} секунд`);
    }
    if (result.unstablePct > 30) {
      issues.push({
        title: "Позу было сложно удерживать",
        advice: `Сократите удержание до ${Math.max(5, Math.round(plan.seconds / 2))} секунд и добавьте опору, а время увеличивайте постепенно.`,
      });
    }
  }

  if (plan.mode === "guide" && result.guideSeconds > 0) {
    wins.push(`${result.guideSeconds} секунд занятия в кадре`);
  }

  if (plan.mode === "hand") {
    if (plan.metric === "activity") {
      if (result.guideSeconds > 0) {
        wins.push(`${result.guideSeconds} секунд активной работы пальцами`);
      }
    } else if (result.reps >= plan.target) {
      wins.push(
        plan.metric === "squeeze"
          ? `Выполнено ${result.reps} сжиманий кисти`
          : `Выполнено ${result.reps} захватов пальцами`,
      );
    }
    if (result.inFramePct < 80) {
      issues.push({
        title: `Руки были видны только ${result.inFramePct}% времени`,
        advice:
          "Держите кисти в кадре целиком, на однотонном фоне и при хорошем свете. Камеру удобнее поставить сбоку от стола.",
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      title: "Заметных отклонений камера не увидела",
      advice:
        "Технику можно усложнять: добавьте одно-два повторения или удлините удержание на 5 секунд.",
    });
  }

  return { wins, issues };
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-5">
      <p className="text-sm font-bold text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold leading-none text-neutral-900 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

export default function ResultBoard({
  exercise,
  plan,
}: {
  exercise: Exercise;
  plan: CoachPlan;
}) {
  const result = useExerciseStore((s) => s.results[exercise.id]);
  const hydrated = useHydrated();
  const [report, setReport] = useState<string[]>([]);
  const [reportNote, setReportNote] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const style = categoryStyles[exercise.category];

  useEffect(() => {
    if (!result) return;
    let cancelled = false;

    const run = async () => {
      setReportLoading(true);
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: {
              title: exercise.title,
              goal: exercise.goal,
              cue: plan.cue,
              mode: plan.mode,
            },
            result,
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setReportNote(data.error ?? "Разбор ИИ недоступен");
          return;
        }
        const data = (await res.json()) as { report?: string };
        const lines = (data.report ?? "")
          .split("\n")
          .map((line) => line.replace(/^[-•\s]+/, "").trim())
          .filter(Boolean);
        if (!cancelled) setReport(lines);
      } catch {
        if (!cancelled) setReportNote("Разбор ИИ недоступен");
      } finally {
        if (!cancelled) setReportLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [exercise.goal, exercise.title, plan.cue, plan.mode, result]);

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (!result) {
    return (
      <div className="px-1 py-2 sm:px-2 sm:py-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
          Результатов пока нет
        </h1>
        <p className="mt-3 max-w-lg text-sm font-medium text-neutral-500">
          Пройдите упражнение с камерой, и здесь появится разбор занятия.
        </p>
        <Link
          href={`/exercise/${exercise.id}`}
          className="mt-6 flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-extrabold text-white"
        >
          К упражнению
        </Link>
      </div>
    );
  }

  const { wins, issues } = analyze(result, plan);

  const achievement =
    plan.mode === "reps"
      ? `${result.reps} из ${plan.target} повторений`
      : plan.mode === "hold"
        ? `${result.rounds} из ${plan.rounds} кругов`
        : plan.mode === "hand"
          ? plan.metric === "activity"
            ? `${result.guideSeconds} секунд работы руками`
            : `${result.reps} из ${plan.target}`
          : `${result.guideSeconds} секунд в кадре`;

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      <span className="flex w-fit items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-extrabold text-white">
        <BadgeCheck className="size-4" aria-hidden />
        Упражнение засчитано
      </span>

      <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
        {exercise.title}
      </h1>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-neutral-700">
        <span
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: style.bg, color: style.ink }}
        >
          {exercise.category}
        </span>
        <span className="rounded-full bg-white px-3 py-1.5">
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(result.at)}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Tile label="Результат" value={achievement} />
        <Tile label="Длительность" value={formatDuration(result.seconds)} />
        <Tile
          label={plan.mode === "hand" ? "Руки в кадре" : "Время в кадре"}
          value={`${result.inFramePct}%`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-neutral-900">
            <ThumbsUp className="size-5 text-emerald-600" aria-hidden />
            Что получилось
          </h2>
          {wins.length === 0 ? (
            <p className="mt-4 text-sm font-medium text-neutral-500">
              В этот раз камера не набрала достаточно данных для похвалы.
              Попробуйте занятие подлиннее.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {wins.map((win) => (
                <li
                  key={win}
                  className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
                >
                  {win}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-neutral-900">
            <TriangleAlert className="size-5 text-amber-500" aria-hidden />
            Над чем поработать
          </h2>
          <ul className="mt-4 space-y-3">
            {issues.map((issue) => (
              <li key={issue.title} className="rounded-2xl bg-[#F7F5F2] p-4">
                <p className="text-sm font-extrabold text-neutral-900">
                  {issue.title}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">
                  {issue.advice}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4 rounded-[28px] bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-neutral-900">
          <Lightbulb className="size-5 text-neutral-400" aria-hidden />
          Разбор от ИИ
        </h2>
        {reportLoading && report.length === 0 && !reportNote && (
          <p className="mt-3 text-sm font-medium text-neutral-400">
            Готовлю разбор занятия…
          </p>
        )}
        {report.length > 0 && (
          <ul className="mt-4 space-y-2">
            {report.map((line) => (
              <li
                key={line}
                className="rounded-2xl bg-[#F7F5F2] px-4 py-3 text-sm font-medium leading-relaxed text-neutral-700"
              >
                {line}
              </li>
            ))}
          </ul>
        )}
        {reportNote && (
          <p className="mt-3 text-sm font-semibold text-amber-700">
            {reportNote}
          </p>
        )}
      </section>

      <div className="mt-6">
        <Link
          href={`/exercise/${exercise.id}`}
          className="flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-extrabold text-white transition hover:opacity-85"
        >
          <RotateCcw className="size-4" aria-hidden />
          Повторить упражнение
        </Link>
      </div>
    </div>
  );
}
