"use client";

import { fitsLevel, gmfcsRoman } from "@/data/gmfcs";
import { useExerciseStore } from "@/store/useExerciseStore";

/** Предупреждение, если упражнение сложнее уровня GMFCS из профиля ребёнка. */
export default function FitNotice({ id }: { id: string }) {
  const gmfcs = useExerciseStore((s) => s.gmfcs);
  if (gmfcs === null || fitsLevel(id, gmfcs)) return null;

  return (
    <section className="card-kid p-5">
      <p className="text-sm font-extrabold text-ink">
        Может быть сложно для уровня GMFCS {gmfcsRoman[gmfcs]}
      </p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-ink/70">
        Упражнение рассчитано на детей, которые сами стоят или ходят.
        Выполняйте его только вместе со специалистом и с надёжной страховкой.
      </p>
    </section>
  );
}
