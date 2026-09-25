import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;
const FILE = path.join(process.cwd(), "data", "users.json");
const DUMMY_SALT = Buffer.from("dfv-auth-timing", "utf8");

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
};

let queue: Promise<unknown> = Promise.resolve();

function locked<T>(fn: () => Promise<T>) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

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
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isUser);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: UserRecord[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(users, null, 2), "utf8");
  await rename(tmp, FILE);
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
  const derived = (await scrypt(password, Buffer.from(salt, "base64url"), expected.length)) as Buffer;
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
  return locked(async () => {
    const users = await readUsers();
    if (users.some((user) => user.email === input.email)) {
      return { error: "Такая почта уже зарегистрирована" as const };
    }
    const user: UserRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      createdAt: Date.now(),
    };
    users.push(user);
    await writeUsers(users);
    return { user };
  });
}
