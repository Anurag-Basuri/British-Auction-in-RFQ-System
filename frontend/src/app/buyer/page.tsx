"use client";

import { useQuery } from "@tanstack/react-query";
import { rfqService } from "../../services/rfq.service";
import Header from "../header";
import {
  PlusCircle,
  Clock,
  TrendingDown,
  FileText,
  Activity,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import type { RFQ } from "../../types/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

function SkeletonCard() {
  return (
    <div className="glass-card p-6 h-72 flex flex-col justify-between overflow-hidden relative">
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="skeleton w-14 h-14 rounded-2xl" />
          <div className="skeleton w-24 h-7 rounded-full" />
        </div>
        <div className="skeleton w-3/4 h-8 rounded-lg mt-4" />
        <div className="skeleton w-1/2 h-5 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div className="skeleton w-full h-5 rounded" />
        <div className="skeleton w-full h-5 rounded" />
      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const {
    data: rfqs = [],
    isLoading,
    error,
  } = useQuery<RFQ[]>({
    queryKey: ["rfqs"],
    queryFn: rfqService.getAllRfqs,
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-8 relative overflow-hidden bg-[#05050A]">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none animate-float" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <Header />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Activity size={14} /> Live Terminal
            </div>
            <h2 className="text-5xl font-black tracking-tight bg-linear-to-b from-white to-white/60 bg-clip-text text-transparent">
              Command Center
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl">
              Monitor active auctions, evaluate bids, and manage your supply chain in real-time.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/buyer/new"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.4)]"
            >
              <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">
                <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                Create New RFQ
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center rounded-4xl border-red-500/20 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-t from-red-500/10 to-transparent pointer-events-none" />
            <h3 className="text-2xl font-bold text-red-400 mb-2">Systems Offline</h3>
            <p className="text-zinc-400">{(error as Error).message}</p>
          </motion.div>
        ) : rfqs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-20 text-center rounded-4xl border-white/5 border-dashed flex flex-col items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors duration-500" />
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10 group-hover:border-indigo-500/30 group-hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] transition-all duration-500">
              <Layers size={40} className="text-zinc-600 group-hover:text-indigo-400 transition-colors duration-500" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Terminal Empty</h3>
            <p className="text-zinc-500 text-lg max-w-md">
              Initialize your first reverse auction to invite suppliers to the bidding floor.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {rfqs.map((rfq) => (
              <motion.div key={rfq.id} variants={cardVariants}>
                <Link href={`/buyer/rfq/${rfq.id}`} className="group block h-full">
                  <div className="glass-card p-8 h-[300px] flex flex-col justify-between rounded-4xl border border-white/5 bg-[#0C0C12]/80 hover:bg-[#12121A] hover:border-indigo-500/50 hover:shadow-[0_10px_40px_rgba(99,102,241,0.2)] transition-all duration-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="space-y-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all duration-500 shadow-inner">
                          <FileText size={24} className="text-zinc-500 group-hover:text-indigo-400" />
                        </div>
                        <span
                          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border backdrop-blur-md shadow-sm ${
                            rfq.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                              : rfq.status === "CLOSED"
                                ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                : "bg-white/5 text-zinc-400 border-white/10"
                          }`}
                        >
                          {rfq.status === "ACTIVE" && (
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2 shadow-[0_0_10px_#22c55e]" />
                          )}
                          {rfq.status}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold leading-tight line-clamp-2 text-zinc-100 group-hover:text-white transition-colors">
                        {rfq.title}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 mt-6 relative z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Deadline</span>
                        <div className="flex items-center gap-2 text-zinc-300 font-medium">
                          <Clock size={16} className="text-indigo-400" />
                          <span>{new Date(rfq.close_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Activity</span>
                        <div className="flex items-center gap-2 text-zinc-300 font-medium">
                          <TrendingDown size={16} className="text-green-400" />
                          <span>{rfq._count?.bids || 0} Bids</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
