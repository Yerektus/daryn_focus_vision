import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { promisify } from "node:util";
import { cookieOptions, signJson, verifyJson } from "@/lib/session";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;
const DUMMY_SALT = Buffer.from("dfv-auth-timing", "utf8");

/** На Vercel файловая система только для чтения, поэтому список аккаунтов живёт в cookie. */
export const ACCOUNTS_COOKIE = "dfv_accounts";
const ACCOUNTS_MAX_AGE = 60 * 60 * 24 * 400;

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
};

function isUser(value: unknown): value is UserRecord {
  if (!value || typeof value !== "object") return false;
  const user = value as UserRecord;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.passwordHash === "string" &&
    typeof user.createdAt === "number"
  );
}

async function readUsers() {
  const token = (await cookies()).get(ACCOUNTS_COOKIE)?.value;
  if (!token) return [];
  const parsed = await verifyJson(token);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isUser);
}

async function writeUsers(users: UserRecord[]) {
  const token = await signJson(users);
  if (!token) return false;
  (await cookies()).set(ACCOUNTS_COOKIE, token, cookieOptions(ACCOUNTS_MAX_AGE));
  return true;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/** Тратит то же время, что проверка пароля, если пользователя нет. */
export async function burnPasswordTime(password: string) {
  await scrypt(password, DUMMY_SALT, KEYLEN);
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) {
    await burnPasswordTime(password);
    return false;
  }
  const expected = Buffer.from(hash, "base64url");
  const derived = (await scrypt(
    password,
    Buffer.from(salt, "base64url"),
    expected.length,
  )) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function findUserByEmail(email: string) {
  const users = await readUsers();
  return users.find((user) => user.email === email) ?? null;
}

export async function findUserById(id: string) {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: UserRecord } | { error: string }> {
  const users = await readUsers();
  if (users.some((user) => user.email === input.email)) {
    return { error: "Такая почта уже зарегистрирована" };
  }
  const user: UserRecord = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    createdAt: Date.now(),
  };
  users.push(user);
  const saved = await writeUsers(users);
  if (!saved) return { error: "Сервер не настроен: задайте AUTH_SECRET" };
  return { user };
}
