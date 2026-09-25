"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { bindExerciseStore } from "@/store/useExerciseStore";

/** Прогресс в localStorage отдельный для каждого аккаунта. */
export default function ProgressScope({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [boundId, setBoundId] = useState<string | null>(null);

  useLayoutEffect(() => {
    let active = true;
    bindExerciseStore(userId).then(() => {
      if (active) setBoundId(userId);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  if (boundId !== userId) {
    return <p className="text-sm font-bold text-neutral-400">Загрузка занятий…</p>;
  }

  return children;
}
