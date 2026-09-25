import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ProgressScope from "@/components/ProgressScope";
import UserMenu from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    redirect(token ? "/api/auth/logout" : "/login");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F7F5F2]/85 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Nav />
          <UserMenu name={user.name} email={user.email} />
        </div>
      </header>

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
        <ProgressScope userId={user.id}>{children}</ProgressScope>
      </div>
    </>
  );
}
