"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/app/header";
import { rfqService } from "../../../../services/rfq.service";
import { socketClient } from "../../../../lib/socket";
import type { RFQDetail, Bid } from "../../../../types/api";
import {
  Clock,
  AlertTriangle,
  Target,
  Zap,
  Users,
  Trophy,
  TrendingDown,
  ArrowLeft,
  Activity,
  History,
  Shield,
} from "lucide-react";
import Link from "next/link";

function useCountdown(closeTime: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (!closeTime) return;
    const timer = setInterval(() => {
      const diff = new Date(closeTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsUrgent(false);
        setIsOver(true);
        clearInterval(timer);
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          [hrs, mins, secs].map((v) => (v < 10 ? "0" + v : v)).join(":"),
        );
        setIsUrgent(diff < 120000); // under 2 mins
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [closeTime]);

  return { timeLeft, isUrgent, isOver };
}

export default function BuyerLiveAuction() {
  const { id } = useParams();
  const rfqId = Number(id);
  const queryClient = useQueryClient();
  const [extended, setExtended] = useState(false);

  const { data: rfq, isLoading } = useQuery<RFQDetail>({
    queryKey: ["rfq", rfqId],
    queryFn: () => rfqService.getRfqById(rfqId),
    enabled: !!rfqId,
    refetchInterval: 15000,
  });

  const { timeLeft, isUrgent, isOver } = useCountdown(rfq?.close_time);

  // Socket events
  useEffect(() => {
    if (!rfqId) return;
    const socket = socketClient.connect();
    socketClient.joinRfqRoom(rfqId);

    socket?.on("BID_PLACED", (newBid: Bid) => {
      queryClient.setQueryData<RFQDetail>(["rfq", rfqId], (old) => {
        if (!old) return old;
        const updatedBids = [newBid, ...old.bids].sort(
          (a, b) => a.price - b.price,
        );
        return { ...old, bids: updatedBids };
      });
    });

    socket?.on("AUCTION_EXTENDED", ({ new_close }: { new_close: string }) => {
      queryClient.setQueryData<RFQDetail>(["rfq", rfqId], (old) => {
        if (!old) return old;
        return { ...old, close_time: new_close };
      });
      setExtended(true);
      setTimeout(() => setExtended(false), 4000);
    });

    socket?.on("AUCTION_CLOSED", () => {
      queryClient.setQueryData<RFQDetail>(["rfq", rfqId], (old) => {
        if (!old) return old;
        return { ...old, status: "CLOSED" };
      });
    });

    return () => {
      socketClient.leaveRfqRoom(rfqId);
    };
  }, [rfqId, queryClient]);

  if (isLoading || !rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05050A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Syncing Telemetry...
          </p>
        </div>
      </div>
    );
  }

  const sortedBids = [...rfq.bids].sort((a, b) => a.price - b.price);

  // Unique leaderboard: only the best (lowest) bid per supplier
  const leaderboard = (() => {
    const best = new Map<number, (typeof sortedBids)[0]>();
    for (const bid of sortedBids) {
      if (!best.has(bid.supplierId)) {
        best.set(bid.supplierId, bid); // first hit is already lowest since sorted
      }
    }
    return Array.from(best.values());
  })();

  const l1Price = leaderboard[0]?.price;
  const uniqueSuppliers = leaderboard.length;
  const avgPrice =
    leaderboard.length > 0
      ? leaderboard.reduce((a, b) => a + b.price, 0) / leaderboard.length
      : 0;

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-8 relative overflow-hidden bg-[#05050A]">
      <div
        className={`absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none transition-colors duration-1000 opacity-20 ${rfq.status === "CLOSED" || isOver ? "bg-red-600" : isUrgent ? "bg-amber-500 animate-pulse" : "bg-indigo-600"}`}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <Header />

      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10 block">
        {/* Top Command Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-indigo-500 to-purple-500" />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Link
                href="/buyer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <ArrowLeft size={16} />
              </Link>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                {rfq.title}
              </h2>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border backdrop-blur-md shadow-sm ml-2 ${
                  rfq.status === "ACTIVE"
                    ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    : "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                }`}
              >
                {rfq.status === "ACTIVE" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2 shadow-[0_0_10px_#22c55e]" />
                )}
                {rfq.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm bg-black/40 px-6 py-3 rounded-full border border-white/5 w-fit">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" />
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                  Trigger:
                </span>
                <span className="text-zinc-300 font-mono font-medium text-xs">
                  {rfq.trigger_type.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                  Config:
                </span>
                <span className="text-zinc-300 font-mono font-medium text-xs">
                  {rfq.trigger_window_mins}m Window / {rfq.extension_mins}m Ext
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                  Drop-dead Time:
                </span>
                <span className="text-white font-mono text-xs font-medium">
                  {new Date(rfq.forced_close_time).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 xl:gap-12 w-full xl:w-auto mt-6 xl:mt-0">
            {/* Operator Controls */}
            {rfq.status === "ACTIVE" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to force finalize this market now? This will lock in the current lowest bid.",
                      )
                    ) {
                      try {
                        await rfqService.earlyCloseRfq(rfqId);
                        // The socket will broadcast AUCTION_CLOSED and update the UI automatically.
                      } catch (e) {
                        alert("Failed to force close market");
                      }
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center gap-2 group"
                >
                  <Zap size={14} className="group-hover:animate-pulse" /> Force
                  Finalize
                </button>
              </div>
            )}

            <div className="hidden xl:block w-px h-16 bg-white/10" />

            <div className="flex flex-col items-center xl:items-end w-full xl:w-auto">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                <Clock
                  size={12}
                  className={
                    isUrgent && rfq.status === "ACTIVE"
                      ? "text-amber-500 animate-pulse"
                      : "text-zinc-500"
                  }
                />
                {rfq.status === "ACTIVE"
                  ? "Time Remaining"
                  : "Auction Concluded"}
              </span>
              <div
                className={`text-6xl md:text-7xl lg:text-5xl font-black font-mono tracking-tighter leading-none transition-all duration-300 ${
                  rfq.status === "CLOSED" || isOver
                    ? "text-zinc-600"
                    : isUrgent
                      ? "text-red-500 animate-pulse scale-105 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]"
                      : "text-white"
                }`}
              >
                {timeLeft}
              </div>
            </div>

            <div
              className={`hidden md:block w-px h-24 ${isUrgent ? "bg-amber-500/20" : "bg-white/10"}`}
            />

            <div className="px-8 py-6 rounded-3xl bg-green-500/10 border border-green-500/20 text-center w-full md:w-auto min-w-[250px] shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-t from-green-500/10 to-transparent pointer-events-none" />
              <p className="text-[11px] text-green-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2 relative z-10">
                <Trophy size={14} /> Current L1 Price
              </p>
              <p className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter relative z-10">
                {l1Price != null ? `$${l1Price.toFixed(2)}` : "--"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Extension flash */}
        <AnimatePresence>
          {extended && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(251,191,36,0.3)] flex items-center justify-center gap-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
              <div className="p-3 bg-amber-500/20 rounded-full animate-bounce">
                <Zap size={24} className="text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black uppercase tracking-wider">
                  Overtime Triggered
                </h3>
                <p className="text-sm font-semibold opacity-90">
                  Auto-extension rules engaged. Timer reset.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-8 lg:row-span-2 glass-card overflow-hidden flex flex-col rounded-4xl border border-white/5 bg-[#0C0C12]/80 h-[800px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Live Operations Floor
                  </h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                    Real-time Bid Stream
                  </p>
                </div>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs">
                {leaderboard.length} RANKED &bull; {rfq.bids.length} TICKS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-linear-to-b from-transparent to-black/40">
              {sortedBids.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                    <Target size={64} className="opacity-40 relative z-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-zinc-400">
                      Awaiting Submissions
                    </p>
                    <p className="text-sm font-medium mt-1">
                      Socket open. Monitoring inbound traffic.
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {leaderboard.map((bid, i) => (
                    <motion.div
                      key={bid.supplierId}
                      layout
                      initial={{ opacity: 0, x: -50, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className={`p-5 sm:p-6 rounded-4xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group ${
                        i === 0
                          ? "bg-green-500/10 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
                          : i === 1
                            ? "bg-indigo-500/5 border border-indigo-500/20"
                            : "bg-black/40 border border-white/5"
                      }`}
                    >
                      {i === 0 && (
                        <div className="absolute inset-0 bg-linear-to-r from-green-500/5 to-transparent pointer-events-none" />
                      )}

                      <div className="flex items-center gap-5 relative z-10">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border shadow-inner ${
                            i === 0
                              ? "bg-green-400 text-black border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                              : i === 1
                                ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                : "bg-white/5 text-zinc-400 border-white/10"
                          }`}
                        >
                          {i === 0 ? <Trophy size={24} /> : `L${i + 1}`}
                        </div>
                        <div>
                          <p className="font-black text-lg text-white group-hover:text-indigo-300 transition-colors">
                            {bid.supplier?.email ||
                              `Supplier Entity #${bid.supplierId}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest bg-black/50 px-2 py-0.5 rounded border border-white/5">
                              Best Bid #{bid.id}
                            </p>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest flex items-center gap-1">
                              <History size={10} />
                              {new Date(bid.timestamp).toLocaleTimeString(
                                undefined,
                                { hour12: false, second: "2-digit" },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 w-full sm:w-auto text-left sm:text-right bg-black/20 sm:bg-transparent rounded-xl sm:rounded-none p-4 sm:p-0 border border-white/5 sm:border-none flex flex-col items-end">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 sm:hidden">
                          Quoted Value
                        </p>
                        <p
                          className={`text-3xl sm:text-4xl font-mono font-black tracking-tighter ${i === 0 ? "text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "text-white"}`}
                        >
                          $
                          {bid.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] text-zinc-400 border border-white/10 bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-wider">F: ${bid.freight_charges}</span>
                          <span className="text-[9px] text-zinc-400 border border-white/10 bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-wider">O: ${bid.origin_charges}</span>
                          <span className="text-[9px] text-zinc-400 border border-white/10 bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-wider">D: ${bid.destination_charges}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-card p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
                <Target size={16} /> Engagement Metrics
              </h4>
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                      Active Suppliers
                    </p>
                    <p className="text-3xl font-black text-white">
                      {uniqueSuppliers}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Users size={20} />
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group hover:border-green-500/30 transition-colors">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                      Average Bid Price
                    </p>
                    <p className="text-2xl font-black font-mono text-zinc-300">
                      {avgPrice > 0
                        ? `$${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "--"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                    <TrendingDown size={20} />
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group hover:border-amber-500/30 transition-colors">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                      Rule Extensions
                    </p>
                    <p className="text-3xl font-black text-white">
                      {rfq.extensionLogs?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Zap size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="glass-card p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
                <History size={16} /> Audit Timeline
              </h4>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {rfq.extensionLogs?.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No extension events recorded yet.</p>
                ) : (
                  rfq.extensionLogs?.map((log, index) => (
                    <div key={log.id} className="relative pl-6 pb-4 border-l border-white/10 last:border-transparent last:pb-0">
                      <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      <div className="flex flex-col gap-1 text-sm bg-black/40 p-3 rounded border border-white/5">
                        <span className="text-zinc-300 font-medium leading-snug">{log.reason}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            +{log.extended_mins} MINS
                          </span>
                          <span className="text-[10px] text-zinc-600 font-bold tracking-widest">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
