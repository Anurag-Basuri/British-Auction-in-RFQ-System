"use client";

import Link from "next/link";
import { useAuth } from "../providers/auth-provider";
import { LogOut, Gavel, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
    >
      <header
        className="h-[68px] flex items-center justify-between px-4 sm:px-6 rounded-4xl border border-white/10 shadow-2xl shadow-indigo-500/10 transition-all duration-300 hover:shadow-indigo-500/20 hover:border-white/15"
        style={{
          background: "rgba(10, 10, 16, 0.75)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        }}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300">
            <Gavel
              size={18}
              className="text-indigo-400 group-hover:rotate-12 transition-transform duration-300"
            />
          </div>
          <span className="text-lg font-bold tracking-tight bg-linear-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent hidden sm:block">
            BritishAuction
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="flex items-center gap-2">
            <Link
              href={user?.role === "BUYER" ? "/buyer" : "/supplier"}
              className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              Dashboard
            </Link>

            <div className="w-px h-6 bg-white/10 mx-1 sm:mx-2" />

            <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-black/40 border border-white/5 shadow-inner sm:flex">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <User size={14} className="text-indigo-400" />
              </div>
              <div className="pr-4 py-0.5">
                <p className="text-[11px] font-medium text-zinc-200 leading-none">
                  {user?.email?.split("@")[0]}
                </p>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-1 opacity-80">
                  {user?.role}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="ml-1 sm:ml-2 w-10 h-10 flex items-center justify-center rounded-full text-zinc-500 bg-black/20 hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </nav>
        )}
      </header>
    </motion.div>
  );
}
