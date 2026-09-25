/** Куда вернуть после входа. Только внутренний путь. */
export function safeNext(raw: string | null | undefined) {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.includes("\\") || raw.includes("://")) return "/";
  if (
    raw.startsWith("/login") ||
    raw.startsWith("/register") ||
    raw.startsWith("/api/auth")
  ) {
    return "/";
  }
  return raw;
}
