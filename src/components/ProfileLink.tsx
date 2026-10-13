"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";

export default function ProfileLink({
  name,
  stacked = false,
}: {
  name: string;
  stacked?: boolean;
}) {
  const active = usePathname().startsWith("/profile");

  return (
    <Link
      href="/profile"
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 items-center gap-2 font-extrabold ${
        stacked ? "px-5 py-3 text-base" : "px-4 py-2.5 text-sm"
      } ${active ? "pill-kid-active" : "pill-kid"}`}
    >
      <UserRound className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
      <span className={`truncate ${stacked ? "" : "max-w-[9rem] lg:max-w-[14rem]"}`}>
        {stacked ? "Профиль" : name}
      </span>
    </Link>
  );
}
