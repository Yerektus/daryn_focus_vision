import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import Nav from "@/components/Nav";
import ProgressScope from "@/components/ProgressScope";
import Tour from "@/components/Tour";
import TourButton from "@/components/TourButton";
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
      <header className="sticky top-0 z-50 border-b-2 border-line bg-[#FFF8EC]/90 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              aria-label="На главную"
              className="mr-1 flex size-11 items-center justify-center rounded-full bg-sun shadow-[0_3px_0_var(--sun-deep)]"
            >
              <Mascot className="size-9" />
            </Link>
            <div className="flex flex-wrap items-center gap-2" data-tour="nav">
              <Nav />
              <TourButton />
            </div>
          </div>
          <UserMenu name={user.name} email={user.email} />
        </div>
      </header>

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
        <ProgressScope userId={user.id}>
          {children}
          <Tour />
        </ProgressScope>
      </div>
    </>
  );
}
