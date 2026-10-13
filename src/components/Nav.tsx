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
            className={`px-5 py-2.5 text-sm font-extrabold ${
              active ? "pill-kid-active" : "pill-kid"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
