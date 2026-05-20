export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page tidak pakai Nav — layout sendiri tanpa header/bottom nav
  return <>{children}</>;
}
