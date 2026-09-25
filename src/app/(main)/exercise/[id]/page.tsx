import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DoneBadge from "@/components/DoneBadge";
import PoseCoach from "@/components/PoseCoach";
import { planFor } from "@/data/coach";
import { categoryStyles, exercises } from "@/data/exercises";

export function generateStaticParams() {
  return exercises.map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/exercise/[id]">): Promise<Metadata> {
  const { id } = await params;
  const exercise = exercises.find((e) => e.id === id);
  return { title: exercise ? exercise.title : "Упражнение" };
}

export default async function ExercisePage({
  params,
}: PageProps<"/exercise/[id]">) {
  const { id } = await params;
  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) notFound();

  const style = categoryStyles[exercise.category];
  const plan = planFor(exercise.id, exercise.category);

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      <Link
        href="/"
        className="flex w-fit items-center gap-2 text-sm font-bold text-neutral-400 transition hover:text-neutral-700"
      >
        <ArrowLeft className="size-4" strokeWidth={3} aria-hidden />
        Все упражнения
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">
            {exercise.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">
            {exercise.goal}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-neutral-700">
            <span
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: style.bg, color: style.ink }}
            >
              {exercise.category}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5">
              {exercise.duration} мин
            </span>
            <span className="rounded-full bg-white px-3 py-1.5">
              {exercise.level}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5">
              {exercise.age}
            </span>
          </div>
        </div>

        <DoneBadge id={exercise.id} />
      </header>

      <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-[28px] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-neutral-900">
            Как выполнять
          </h2>
          <ol className="mt-5 space-y-4">
            {exercise.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                  style={{ backgroundColor: style.mark }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium leading-relaxed text-neutral-700">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-4">
          <section
            className="rounded-[28px] p-5 sm:p-6"
            style={{ backgroundColor: style.bg, color: style.ink }}
          >
            <h2 className="text-lg font-extrabold">Инвентарь</h2>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              {exercise.equipment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-[28px] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-neutral-900">Совет</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
              {exercise.tip}
            </p>
          </section>

          <section className="rounded-[26px] bg-[#F7D68C] p-5 text-[#4D3405]">
            <p className="text-sm font-semibold leading-relaxed">
              Прекратите занятие при боли, усилении спастики, судорогах или
              изменении дыхания.
            </p>
          </section>
        </div>
      </div>
      <div className="mt-4">
        <PoseCoach exercise={exercise} plan={plan} />
      </div>

    </div>
  );
}
