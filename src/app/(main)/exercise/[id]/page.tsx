import type { Metadata } from "next";
import { ArrowLeft, Lightbulb, Package, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DoneBadge from "@/components/DoneBadge";
import FitNotice from "@/components/FitNotice";
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
  const Icon = style.icon;
  const plan = planFor(exercise.id, exercise.category);

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-4">
      <Link
        href="/"
        className="pill-kid flex w-fit items-center gap-2 px-4 py-2 text-sm font-extrabold"
      >
        <ArrowLeft className="size-4" strokeWidth={3} aria-hidden />
        Все упражнения
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="heading-kid text-4xl leading-[1.05] sm:text-5xl">
            {exercise.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-ink/60 sm:text-base">
            {exercise.goal}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold text-ink/80">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: style.bg, color: style.ink }}
            >
              <Icon className="size-3.5" strokeWidth={2.75} aria-hidden />
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
        <section
          data-tour="steps"
          className="card-kid p-5 sm:p-6"
        >
          <h2 className="heading-kid text-xl">
            Как выполнять
          </h2>
          <ol className="mt-5 space-y-4">
            {exercise.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{
                    backgroundColor: style.mark,
                    boxShadow: `0 3px 0 ${style.mark}66`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="pt-1.5 text-sm font-medium leading-relaxed text-ink/80">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-4">
          <FitNotice id={exercise.id} />
          <section
            className="rounded-[32px] p-5 sm:p-6"
            style={{
              backgroundColor: style.bg,
              color: style.ink,
              boxShadow: `0 6px 0 ${style.mark}55`,
            }}
          >
            <h2 className="heading-kid flex items-center gap-2 text-xl text-current">
              <Package className="size-5" strokeWidth={2.5} aria-hidden />
              Инвентарь
            </h2>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              {exercise.equipment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card-kid p-5 sm:p-6">
            <h2 className="heading-kid flex items-center gap-2 text-xl">
              <Lightbulb className="size-5 text-[#E3A514]" strokeWidth={2.5} aria-hidden />
              Совет
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink/70">
              {exercise.tip}
            </p>
          </section>

          <section
            data-tour="safety"
            className="flex gap-3 rounded-[32px] bg-[#FFE7A8] p-5 text-[#4D3405] shadow-[0_6px_0_#F3CF72]"
          >
            <ShieldAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.5} aria-hidden />
            <p className="text-sm font-bold leading-relaxed">
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
