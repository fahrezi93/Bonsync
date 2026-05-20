import Link from "next/link";
import { LogOut, LayoutDashboard, History, MessageCircle, Wallet, Camera } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/actions/auth-actions";
import { BottomNav } from "@/components/bottom-nav";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-[14px] bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              B
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-slate-800">BonSync</span>
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-500">
                <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
                <Link href="/history" className="hover:text-slate-900 transition-colors">Riwayat</Link>
                <Link href="/scan" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                   <Camera className="w-4 h-4 text-emerald-500" />
                   Scan
                </Link>
                <Link href="/chat" className="hover:text-slate-900 transition-colors">AI Chat</Link>
                <Link href="/settings" className="hover:text-slate-900 transition-colors">Budget</Link>
              </nav>

              <div className="hidden md:block w-px h-5 bg-slate-200" />

              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm font-medium text-slate-600 truncate max-w-[140px]">
                  {user.email?.split("@")[0]}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    title="Keluar"
                    className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Show bottom nav only on mobile/tablet */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  );
}
