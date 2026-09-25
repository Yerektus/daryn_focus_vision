"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Прогресс восстанавливается из localStorage, поэтому первый клиентский рендер
 *  должен совпадать с серверным, иначе React ругается на разметку. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
