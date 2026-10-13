"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type AuthState } from "@/app/auth-actions";

const inputClass =
  "mt-2 w-full rounded-2xl border-2 border-line bg-[#FFFCF5] px-4 py-3 text-base font-semibold text-ink outline-none transition placeholder:text-ink/30 focus:border-grape focus:bg-white";

function nextQuery(next: string) {
  return next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
}

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {error}
    </p>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null as AuthState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <ErrorNote error={state?.error} />
      <label className="text-sm font-extrabold text-ink/80">
        Почта
        <input
          className={inputClass}
          name="email"
          type="email"
          autoComplete="email"
          required
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="text-sm font-extrabold text-ink/80">
        Пароль
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Не короче 8 символов"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-kid mt-2 px-5 py-3.5 text-base font-extrabold disabled:opacity-60"
      >
        {pending ? "Входим…" : "Войти"}
      </button>
      <p className="text-sm font-bold text-ink/60">
        Нет аккаунта?{" "}
        <Link href={`/register${nextQuery(next)}`} className="font-extrabold text-grape underline underline-offset-2">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(register, null as AuthState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <ErrorNote error={state?.error} />
      <label className="text-sm font-extrabold text-ink/80">
        Имя
        <input
          className={inputClass}
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={40}
          placeholder="Как к вам обращаться"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="text-sm font-extrabold text-ink/80">
        Почта
        <input
          className={inputClass}
          name="email"
          type="email"
          autoComplete="email"
          required
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="text-sm font-extrabold text-ink/80">
        Пароль
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Не короче 8 символов"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-kid mt-2 px-5 py-3.5 text-base font-extrabold disabled:opacity-60"
      >
        {pending ? "Создаём…" : "Создать аккаунт"}
      </button>
      <p className="text-sm font-bold text-ink/60">
        Уже есть аккаунт?{" "}
        <Link href={`/login${nextQuery(next)}`} className="font-extrabold text-grape underline underline-offset-2">
          Войти
        </Link>
      </p>
    </form>
  );
}
