import type { Metadata } from "next";
import ProfileBoard from "@/components/ProfileBoard";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Профиль",
};

export default async function ProfilePage() {
  // layout уже пускает только вошедших
  const user = await getCurrentUser();
  if (!user) return null;
  return <ProfileBoard name={user.name} email={user.email} createdAt={user.createdAt} />;
}
