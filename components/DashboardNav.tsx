"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const pathname = usePathname() ?? "";
  const onDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const onHome = pathname === "/";

  return (
    <nav
      className={cn(
        "bd-nav flex flex-wrap items-center gap-2 sm:gap-3",
      )}
      aria-label="Dashboard"
    >
      <div
        className={cn(
          "bd-nav-pills flex rounded-full border border-soft-text/10 bg-white/90 p-1 shadow-sm backdrop-blur-sm",
        )}
      >
        <Link
          href="/dashboard"
          aria-current={onDashboard ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
            onDashboard
              ? "bg-teal-primary text-white shadow-md shadow-teal-primary/25"
              : "text-soft-text/75 hover:bg-teal-primary/10 hover:text-soft-text",
          )}
        >
          Overview
        </Link>
        <Link
          href="/"
          aria-current={onHome ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
            onHome
              ? "bg-teal-primary text-white shadow-md shadow-teal-primary/25"
              : "text-soft-text/75 hover:bg-teal-primary/10 hover:text-soft-text",
          )}
        >
          Home
        </Link>
      </div>
    </nav>
  );
}
