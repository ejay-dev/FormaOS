"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Product" },
  { href: "/industries", label: "Industries" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function NavLinks({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const pathname = usePathname() || "/";

  if (variant === "mobile") {
    return (
      <div className="text-sm">
        {links.map((l) => {
          const isActive = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "block rounded-lg px-4 py-2.5 transition-colors",
                isActive ? "bg-white/12 text-foreground" : "hover:bg-white/10 text-foreground/80"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium">
      {links.map((l) => {
        const isActive = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={clsx("mk-nav-link text-foreground/80 transition-colors", isActive && "text-foreground")}
            aria-current={isActive ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
