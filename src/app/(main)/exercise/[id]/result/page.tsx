import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ResultBoard from "@/components/ResultBoard";
import { planFor } from "@/data/coach";
import { exercises } from "@/data/exercises";

export function generateStaticParams() {
  return exercises.map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/exercise/[id]/result">): Promise<Metadata> {
  const { id } = await params;
  const exercise = exercises.find((e) => e.id === id);
  return { title: exercise ? `Результат: ${exercise.title}` : "Результат" };
}

export default async function ResultPage({
  params,
}: PageProps<"/exercise/[id]/result">) {
  const { id } = await params;
  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) notFound();

  return (
    <ResultBoard
      exercise={exercise}
      plan={planFor(exercise.id, exercise.category)}
    />
  );
}
