import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { findUserById } from "@/lib/users";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await findUserById(session.sub);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}
