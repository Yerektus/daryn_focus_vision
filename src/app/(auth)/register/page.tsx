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
    <div className="w-full">
      <p className="text-sm font-extrabold text-grape">Упражнения для детей с ДЦП</p>
      <h1 className="heading-kid mt-3 text-4xl">Регистрация</h1>
      <p className="mt-3 text-base font-semibold leading-relaxed text-ink/60">
        Создайте аккаунт: прогресс занятий сохранится отдельно.
      </p>
      <RegisterForm next={next} />
    </div>
  );
}
