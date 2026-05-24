"use client";

import { usePathname } from "next/navigation";

export function MainLayoutWrapper({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLandingPage = pathname === "/" && !isAuthenticated;

  // Landing page: no wrapper constraints, full viewport control
  if (isLandingPage) {
    return <>{children}</>;
  }

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
