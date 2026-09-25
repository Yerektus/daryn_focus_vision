"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { COOKIE_NAME, cookieOptions, signSession } from "@/lib/session";
import {
  burnPasswordTime,
  createUser,
  findUserByEmail,
  verifyPassword,
} from "@/lib/users";

export type AuthState = { error: string } | null;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function startSession(userId: string) {
  const token = await signSession(userId);
  if (!token) return false;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, cookieOptions());
  return true;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = text(formData, "email").trim().toLowerCase();
  const password = text(formData, "password");
  const next = safeNext(text(formData, "next"));

  if (!email || !password) return { error: "Введите почту и пароль" };
  if (password.length > 128) return { error: "Неверная почта или пароль" };

  const user = await findUserByEmail(email);
  if (!user) {
    await burnPasswordTime(password);
    return { error: "Неверная почта или пароль" };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Неверная почта или пароль" };
  if (!(await startSession(user.id))) {
    return { error: "Сервер не настроен: задайте AUTH_SECRET" };
  }
  redirect(next);
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = text(formData, "name").trim().replace(/\s+/g, " ");
  const email = text(formData, "email").trim().toLowerCase();
  const password = text(formData, "password");
  const next = safeNext(text(formData, "next"));

  if (name.length < 2 || name.length > 40 || /[\u0000-\u001F]/.test(name)) {
    return { error: "Имя: от 2 до 40 символов" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return { error: "Укажите корректную почту" };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "Пароль: от 8 до 128 символов" };
  }

  const created = await createUser({ name, email, password });
  if ("error" in created) return { error: created.error ?? "Не удалось создать аккаунт" };
  if (!(await startSession(created.user.id))) {
    return { error: "Сервер не настроен: задайте AUTH_SECRET" };
  }
  redirect(next);
}

export async function logout() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  redirect("/login");
}
