"use client";

import { usePathname } from "next/navigation";

export function ConditionalNavWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide nav entirely on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return <>{children}</>;
}
