"use client";

import { useQuery } from "@tanstack/react-query";
import { rfqService } from "../../services/rfq.service";
import Header from "../header";
import {
  Clock,
  TrendingDown,
  Crosshair,
  ArrowRight,
  Activity,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { RFQ } from "../../types/api";
import { useState, useMemo } from "react";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-6 px-6 py-5 border-b border-white/5">
      <div className="skeleton w-20 h-6 rounded-full" />
      <div className="skeleton flex-1 h-5 rounded-lg" />
      <div className="skeleton w-28 h-5 rounded-lg" />
      <div className="skeleton w-20 h-5 rounded-lg" />
      <div className="skeleton w-28 h-9 rounded-xl" />
    </div>
  );
}

export default function SupplierDashboard() {
  const {
    data: allRfqs = [],
    isLoading,
    error,
  } = useQuery<RFQ[]>({
    queryKey: ["rfqs"],
    queryFn: rfqService.getAllRfqs,
    refetchInterval: 30000,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "CLOSED">(
    "ALL",
  );

  const rfqs = useMemo(() => {
    let filtered = allRfqs.filter((r) => r.status !== "DRAFT");

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }

    return filtered;
  }, [allRfqs, statusFilter, searchQuery]);

  const activeCount = allRfqs.filter((r) => r.status === "ACTIVE").length;
  const closedCount = allRfqs.filter((r) => r.status === "CLOSED").length;

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-8 relative overflow-hidden bg-[#05050A]">
      {/* Ambient effects */}
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[50%] bg-emerald-500/8 rounded-full blur-[180px] pointer-events-none animate-float" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <Header />

      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Crosshair size={14} /> Market Scanner
              </div>
              <h2 className="text-5xl font-black tracking-tight bg-linear-to-b from-white to-white/50 bg-clip-text text-transparent pb-1">
                Supplier Terminal
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl">
                Scan active procurement events. Identify targets. Enter and
                compete.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="px-5 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-center min-w-[100px]">
                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">
                  Live
                </p>
                <p className="text-3xl font-black text-white font-mono">
                  {activeCount}
                </p>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-zinc-500/10 border border-zinc-500/20 text-center min-w-[100px]">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">
                  Closed
                </p>
                <p className="text-3xl font-black text-zinc-500 font-mono">
                  {closedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-400 transition-colors"
              />
              <input
                type="text"
                placeholder="Search markets by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-11 bg-black/40 border-white/10 focus:border-emerald-500/40 py-3 rounded-xl w-full"
              />
            </div>
            <div className="flex gap-2">
              {(["ALL", "ACTIVE", "CLOSED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${
                    statusFilter === status
                      ? status === "ACTIVE"
                        ? "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                        : status === "CLOSED"
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-white/10 border-white/20 text-white"
                      : "bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/15"
                  }`}
                >
                  {status === "ALL" && (
                    <SlidersHorizontal size={14} className="inline mr-2" />
                  )}
                  {status}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Table Header */}
          <div className="hidden md:flex items-center gap-4 px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 bg-black/30">
            <div className="w-24">Status</div>
            <div className="flex-1">Market / RFQ Title</div>
            <div className="w-36 text-right">Deadline</div>
            <div className="w-28 text-right">Depth</div>
            <div className="w-36 text-right">Action</div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <h3 className="text-xl font-bold text-red-400 mb-2">
                Connection Failed
              </h3>
              <p className="text-zinc-500">{(error as Error).message}</p>
            </div>
          ) : rfqs.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <Activity size={32} className="text-zinc-600" />
              </div>
              <h3 className="text-2xl font-black text-zinc-400">
                No Markets Found
              </h3>
              <p className="text-zinc-600 max-w-md mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : "No active procurement opportunities right now. Check back shortly."}
              </p>
            </div>
          ) : (
            <div>
              {rfqs.map((rfq, i) => {
                const isActive = rfq.status === "ACTIVE";
                const closeDate = new Date(rfq.close_time);
                const now = new Date();
                const diff = closeDate.getTime() - now.getTime();
                const isUrgent = isActive && diff > 0 && diff < 3600000; // under 1 hour

                return (
                  <motion.div
                    key={rfq.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <Link
                      href={`/supplier/rfq/${rfq.id}`}
                      className={`group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-6 py-5 border-b border-white/5 transition-all duration-300 hover:bg-emerald-500/3 relative ${
                        isUrgent ? "bg-amber-500/2" : ""
                      }`}
                    >
                      {/* Hover accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 rounded-full" />

                      {/* Status */}
                      <div className="w-24">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                            isActive
                              ? "bg-green-500/10 text-green-400 border-green-500/25"
                              : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          }`}
                        >
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#22c55e]" />
                          )}
                          {rfq.status}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-zinc-200 group-hover:text-white truncate transition-colors">
                          {rfq.title}
                        </p>
                        {isUrgent && (
                          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-1 animate-pulse">
                            ⚡ Closing soon
                          </p>
                        )}
                      </div>

                      {/* Deadline */}
                      <div className="w-36 md:text-right flex flex-col md:items-end">
                        <div className="flex items-center gap-2 md:justify-end text-sm">
                          <Clock
                            size={14}
                            className={
                              isUrgent ? "text-amber-400" : "text-emerald-400"
                            }
                          />
                          <span
                            className={`font-mono font-medium ${isUrgent ? "text-amber-400" : "text-zinc-400"}`}
                          >
                            {closeDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {closeDate.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 md:justify-end mt-1">
                          <span className="text-[9px] text-red-500 uppercase font-black tracking-widest">
                            Drop-dead: {new Date(rfq.forced_close_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </span>
                        </div>
                      </div>

                      {/* Market Depth / Lowest Bid */}
                      <div className="w-28 md:text-right flex flex-col md:items-end">
                        <div className="flex items-center gap-2 md:justify-end text-sm">
                          <TrendingDown size={14} className="text-indigo-400" />
                          <span className="text-zinc-300 font-mono font-bold">
                            {rfq.currentLowestBid ? `$${rfq.currentLowestBid.toFixed(2)}` : "--"}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">
                          {rfq._count?.bids || 0} BIDS
                        </div>
                      </div>

                      {/* Action */}
                      <div className="w-36 md:text-right">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:border-emerald-400">
                          {isActive ? "Enter Arena" : "View Results"}
                          <ArrowRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Table Footer */}
          {!isLoading && rfqs.length > 0 && (
            <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center bg-black/20">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                {rfqs.length} market{rfqs.length !== 1 ? "s" : ""} displayed
              </p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                Auto-refresh: 30s
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
