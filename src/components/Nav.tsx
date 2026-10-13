"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Упражнения" },
  { href: "/analytics", label: "Аналитика" },
] as const;

/** stacked: столбик на всю ширину, для мобильного меню */
export default function Nav({ stacked = false }: { stacked?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={stacked ? "flex flex-col gap-2" : "flex w-fit gap-2"}>
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
            className={`px-5 font-extrabold ${
              stacked ? "py-3 text-base" : "py-2.5 text-sm"
            } ${active ? "pill-kid-active" : "pill-kid"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
