"use client";

import Link from "next/link";
import { useAuth } from "../providers/auth-provider";
import { LogOut, Gavel, User } from "lucide-react";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8"
      style={{
        background: "rgba(5, 5, 10, 0.7)",
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
          <Gavel size={18} className="text-indigo-400" />
        </div>
        <span className="text-lg font-bold tracking-tight bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          BritishAuction
        </span>
      </Link>

      {isAuthenticated && (
        <nav className="flex items-center gap-1">
          <Link
            href={user?.role === "BUYER" ? "/buyer" : "/supplier"}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Dashboard
          </Link>

          <div className="w-px h-5 bg-white/10 mx-2" />

          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/3 border border-white/6">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <User size={14} className="text-indigo-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-zinc-300 leading-none">
                {user?.email}
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="ml-2 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </nav>
      )}
    </header>
  );
}
