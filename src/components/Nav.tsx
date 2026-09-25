"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Упражнения" },
  { href: "/analytics", label: "Аналитика" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-fit gap-2">
      {links.map((l) => {
        const active =
          l.href === "/"
            ? pathname === "/" || pathname.startsWith("/exercise")
            : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-neutral-900 text-white"
                : "bg-[#F1EEEA] text-neutral-500 hover:bg-[#E9E5E0] hover:text-neutral-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
