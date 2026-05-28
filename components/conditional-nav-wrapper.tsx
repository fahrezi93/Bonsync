"use client";

import { usePathname } from "next/navigation";

export function ConditionalNavWrapper({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();

  // Hide nav entirely on auth pages, onboarding, or root landing page
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/onboarding") ||
    (pathname === "/" && !isAuthenticated)
  ) {
    return null;
  }

  return <>{children}</>;
}
