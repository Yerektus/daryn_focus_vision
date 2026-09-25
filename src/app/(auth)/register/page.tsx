import type { Metadata } from "next";
import { RegisterForm } from "@/components/AuthForms";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Регистрация" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);

  return (
    <div className="w-full max-w-md">
      <p className="text-sm font-extrabold text-neutral-400">Упражнения для детей с ДЦП</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-neutral-900">Регистрация</h1>
      <p className="mt-3 text-base font-semibold leading-relaxed text-neutral-500">
        Создайте аккаунт: прогресс занятий сохранится отдельно.
      </p>
      <RegisterForm next={next} />
    </div>
  );
}
