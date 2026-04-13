"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";

function useCountdown(closeTime: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!closeTime) return;
    const timer = setInterval(() => {
      const diff = new Date(closeTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("CLOSED");
        setIsUrgent(false);
        clearInterval(timer);
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`,
        );
        setIsUrgent(diff < 120000); // under 2 mins
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [closeTime]);

  return { timeLeft, isUrgent };
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

  const { timeLeft, isUrgent } = useCountdown(rfq?.close_time);

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
      setTimeout(() => setExtended(false), 3000);
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-center space-y-4">
          <div className="skeleton w-64 h-8 rounded-xl mx-auto" />
          <div className="skeleton w-40 h-4 rounded mx-auto" />
        </div>
      </div>
    );
  }

  const sortedBids = [...rfq.bids].sort((a, b) => a.price - b.price);
  const l1Price = sortedBids[0]?.price;
  const uniqueSuppliers = new Set(rfq.bids.map((b) => b.supplierId)).size;
  const avgPrice =
    rfq.bids.length > 0
      ? rfq.bids.reduce((a, b) => a + b.price, 0) / rfq.bids.length
      : 0;

  return (
    <div
      className="min-h-screen pt-24 pb-12 px-8"
      style={{ background: "var(--bg-primary)" }}
    >
      <Header />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Command Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link
                href="/buyer"
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
              >
                <ArrowLeft size={18} />
              </Link>
              <h2 className="text-3xl font-bold tracking-tight">{rfq.title}</h2>
              <span
                className={`badge ${rfq.status === "ACTIVE" ? "badge-active" : "badge-closed"}`}
              >
                {rfq.status === "ACTIVE" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
                {rfq.status}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock size={14} className="text-indigo-400" />
                <span>Countdown:</span>
                <span
                  className={`font-mono font-bold ${isUrgent ? "animate-urgency" : "text-white"} ${extended ? "text-amber-400" : ""}`}
                >
                  {timeLeft}
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <AlertTriangle size={14} className="text-red-400" />
                <span>Hard Close:</span>
                <span className="text-white font-mono text-xs">
                  {new Date(rfq.forced_close_time).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-[10px] text-green-400 font-bold uppercase mb-1">
                Current L1
              </p>
              <p className="text-3xl font-black text-white font-mono">
                {l1Price != null ? `$${l1Price.toFixed(2)}` : "--"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Extension flash */}
        <AnimatePresence>
          {extended && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 text-center font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Zap size={16} /> Auction Extended! Timer has been reset.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Leaderboard */}
          <div
            className="lg:col-span-3 glass-card overflow-hidden flex flex-col"
            style={{ height: "600px" }}
          >
            <div className="p-6 border-b border-white/4 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target size={18} className="text-indigo-400" /> Real-time
                Supplier Ranking
              </h3>
              <span className="badge badge-active">{rfq.bids.length} BIDS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {sortedBids.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                  <Users size={48} className="opacity-30" />
                  <p className="font-medium">Waiting for bids...</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedBids.map((bid, i) => (
                    <motion.div
                      key={bid.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-5 rounded-2xl flex justify-between items-center ${
                        i === 0
                          ? "bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5"
                          : "bg-white/2 border border-white/4"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${
                            i === 0
                              ? "bg-green-500 text-black"
                              : "bg-white/6 text-zinc-500"
                          }`}
                        >
                          {i === 0 ? <Trophy size={20} /> : `L${i + 1}`}
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {bid.supplier?.email ||
                              `Supplier #${bid.supplierId}`}
                          </p>
                          <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-0.5">
                            {new Date(bid.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-2xl font-mono font-black ${i === 0 ? "text-green-400" : "text-white"}`}
                      >
                        ${bid.price.toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 pb-3 border-b border-white/4">
                <Zap size={14} /> Auction Meta
              </h4>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/2 border border-white/4">
                  <p className="text-xs text-zinc-600 mb-1">Active Suppliers</p>
                  <p className="text-2xl font-bold">{uniqueSuppliers}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/2 border border-white/4">
                  <p className="text-xs text-zinc-600 mb-1">Average Bid</p>
                  <p className="text-2xl font-bold font-mono">
                    {avgPrice > 0 ? `$${avgPrice.toFixed(2)}` : "--"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/2 border border-white/4">
                  <p className="text-xs text-zinc-600 mb-1">Extensions</p>
                  <p className="text-2xl font-bold">
                    {rfq.extensionLogs?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
