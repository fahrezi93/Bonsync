"use client";

import { usePathname } from "next/navigation";

export function MainLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <main
      className={`flex flex-col h-dvh ${
        isAuthPage ? "" : "pt-[72px] pb-[72px] md:pb-0"
      }`}
    >
      {children}
    </main>
  );
}
