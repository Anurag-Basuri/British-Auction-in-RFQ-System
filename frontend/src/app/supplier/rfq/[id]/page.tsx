"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/app/header";
import { rfqService } from "../../../../services/rfq.service";
import { bidService } from "../../../../services/bid.service";
import { socketClient } from "../../../../lib/socket";
import { ApiError } from "../../../../lib/api-error";
import { useAuth } from "../../../../providers/auth-provider";
import type { RFQDetail, Bid } from "../../../../types/api";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Clock,
  Target,
  Zap,
  AlertTriangle,
  TrendingDown,
  Trophy,
  ArrowLeft,
  Loader2,
  Send,
  Activity,
  History,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

const bidSchema = z.object({
  freight_charges: z.number().nonnegative("Must be 0 or more"),
  origin_charges: z.number().nonnegative("Must be 0 or more"),
  destination_charges: z.number().nonnegative("Must be 0 or more"),
  transit_time: z.string().min(1, "Required"),
  quote_validity: z.string().min(1, "Required"),
});

type BidForm = z.infer<typeof bidSchema>;

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

export default function SupplierLiveAuction() {
  const { id } = useParams();
  const rfqId = Number(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bidError, setBidError] = useState<ApiError | string | null>(null);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [extended, setExtended] = useState(false);

  const { data: rfq, isLoading } = useQuery<RFQDetail>({
    queryKey: ["rfq", rfqId],
    queryFn: () => rfqService.getRfqById(rfqId),
    enabled: !!rfqId,
    refetchInterval: 15000,
  });

  const { timeLeft, isUrgent, isOver } = useCountdown(rfq?.close_time);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BidForm>({
    resolver: zodResolver(bidSchema),
  });

  // Socket events
  useEffect(() => {
    if (!rfqId) return;
    const socket = socketClient.connect();
    socketClient.joinRfqRoom(rfqId);

    socket?.on("BID_PLACED", (newBid: Bid) => {
      queryClient.setQueryData<RFQDetail>(["rfq", rfqId], (old) => {
        if (!old) return old;
        const exists = old.bids.find((b) => b.id === newBid.id);
        if (exists) return old;
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

  const onSubmit = async (data: BidForm) => {
    try {
      setBidError("");
      setBidSuccess(false);
      await bidService.placeBid(rfqId, {
        ...data,
        quote_validity: new Date(data.quote_validity).toISOString(),
        client_bid_id: crypto.randomUUID(),
      });
      setBidSuccess(true);
      reset();
      setTimeout(() => setBidSuccess(false), 3000);
    } catch (e) {
      setBidError(e instanceof ApiError ? e : "Failed to submit bid.");
    }
  };

  if (isLoading || !rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05050A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Establishing Connection...
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
        best.set(bid.supplierId, bid);
      }
    }
    return Array.from(best.values());
  })();

  const l1Price = leaderboard[0]?.price;
  const userRank = leaderboard.findIndex((b) => b.supplierId === user?.id) + 1;
  const isWinning = userRank === 1;

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-8 relative overflow-hidden bg-[#05050A]">
      <div
        className={`absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[200px] pointer-events-none transition-colors duration-1000 opacity-20 ${rfq.status === "CLOSED" || isOver ? "bg-red-600" : isWinning ? "bg-green-500" : "bg-emerald-600"}`}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <Header />

      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
        {/* Top Intelligence Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-emerald-500 to-teal-500" />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Link
                href="/supplier"
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

            <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-full border border-white/5 w-fit">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                <Clock
                  size={12}
                  className={
                    isUrgent && rfq.status === "ACTIVE"
                      ? "text-amber-500 animate-pulse"
                      : "text-zinc-500"
                  }
                />
                {rfq.status === "ACTIVE" ? "Hard Close" : "Concluded"}
              </span>
              <span className="text-white font-mono text-xs font-medium">
                {new Date(rfq.forced_close_time).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 xl:gap-12 w-full xl:w-auto">
            <div className="flex flex-col items-center xl:items-end w-full xl:w-auto">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                <Clock size={12} /> Live Countdown
              </span>
              <div
                className={`text-6xl md:text-7xl lg:text-8xl font-black font-mono tracking-tighter leading-none transition-all duration-300 ${
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

            <div className={`hidden md:block w-px h-24 bg-white/10`} />

            <div
              className={`px-8 py-6 rounded-3xl border text-center w-full md:w-auto min-w-[250px] relative overflow-hidden transition-all duration-500 ${
                isWinning
                  ? "bg-green-500/10 border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)]"
                  : userRank > 0
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                    : "bg-white/5 border-white/10"
              }`}
            >
              <div
                className={`absolute inset-0 bg-linear-to-t pointer-events-none ${isWinning ? "from-green-500/20" : "from-indigo-500/20"}`}
              />
              <p
                className={`text-[11px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2 relative z-10 ${isWinning ? "text-green-400" : "text-indigo-400"}`}
              >
                {isWinning ? <Trophy size={14} /> : <Target size={14} />}
                Your Position
              </p>
              <p className="text-5xl font-black text-white font-mono tracking-tighter relative z-10">
                {userRank > 0 ? `L${userRank}` : "--"}
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
                  Timer reset due to competitor activity.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Action Center - Bid Form */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="glass-card p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      Execution Terminal
                    </h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                      Configure and deploy competitive quote
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                {rfq.status === "ACTIVE" &&
                  l1Price &&
                  l1Price > 0 &&
                  !isWinning && (
                    <div className="hidden lg:flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mr-2">
                        Quick Beat L1:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const target = l1Price * 0.99; // 1% undercut
                          setValue(
                            "freight_charges",
                            +(target * 0.8).toFixed(2),
                          );
                          setValue(
                            "origin_charges",
                            +(target * 0.1).toFixed(2),
                          );
                          setValue(
                            "destination_charges",
                            +(target * 0.1).toFixed(2),
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                        -1%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = l1Price * 0.95; // 5% undercut
                          setValue(
                            "freight_charges",
                            +(target * 0.8).toFixed(2),
                          );
                          setValue(
                            "origin_charges",
                            +(target * 0.1).toFixed(2),
                          );
                          setValue(
                            "destination_charges",
                            +(target * 0.1).toFixed(2),
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                        -5%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = l1Price * 0.9; // 10% undercut
                          setValue(
                            "freight_charges",
                            +(target * 0.8).toFixed(2),
                          );
                          setValue(
                            "origin_charges",
                            +(target * 0.1).toFixed(2),
                          );
                          setValue(
                            "destination_charges",
                            +(target * 0.1).toFixed(2),
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                        -10%
                      </button>
                    </div>
                  )}
              </div>

              {rfq.status === "CLOSED" ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 p-8 bg-red-500/10 border border-red-500/20 rounded-4xl">
                    <ShieldAlert size={48} className="text-red-400" />
                    <h3 className="text-2xl font-black text-white">
                      Market Closed
                    </h3>
                    <p className="text-zinc-400">
                      Submissions are currently locked.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-8 relative z-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Financials */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Freight Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("freight_charges", {
                          valueAsNumber: true,
                        })}
                        className="input-field bg-black/40 border-white/10 focus:border-emerald-500/50 py-4 text-xl font-mono rounded-xl group"
                        placeholder="0.00"
                        aria-invalid={!!errors.freight_charges}
                      />
                      {errors.freight_charges && (
                        <p className="text-red-400 text-xs ml-1 font-bold">
                          {errors.freight_charges.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Origin Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("origin_charges", { valueAsNumber: true })}
                        className="input-field bg-black/40 border-white/10 focus:border-emerald-500/50 py-4 text-xl font-mono rounded-xl"
                        placeholder="0.00"
                        aria-invalid={!!errors.origin_charges}
                      />
                      {errors.origin_charges && (
                        <p className="text-red-400 text-xs ml-1 font-bold">
                          {errors.origin_charges.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Dest. Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("destination_charges", {
                          valueAsNumber: true,
                        })}
                        className="input-field bg-black/40 border-white/10 focus:border-emerald-500/50 py-4 text-xl font-mono rounded-xl"
                        placeholder="0.00"
                        aria-invalid={!!errors.destination_charges}
                      />
                      {errors.destination_charges && (
                        <p className="text-red-400 text-xs ml-1 font-bold">
                          {errors.destination_charges.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Transit ETA
                      </label>
                      <input
                        {...register("transit_time")}
                        className="input-field bg-black/40 border-white/10 focus:border-emerald-500/50 py-3 rounded-xl text-sm"
                        placeholder="e.g., 3-5 business days"
                        aria-invalid={!!errors.transit_time}
                      />
                      {errors.transit_time && (
                        <p className="text-red-400 text-xs ml-1 font-bold">
                          {errors.transit_time.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                        Offer Validity
                      </label>
                      <input
                        type="datetime-local"
                        {...register("quote_validity")}
                        className="input-field bg-black/40 border-white/10 focus:border-emerald-500/50 py-3 rounded-xl text-sm [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                        aria-invalid={!!errors.quote_validity}
                      />
                      {errors.quote_validity && (
                        <p className="text-red-400 text-xs ml-1 font-bold">
                          {errors.quote_validity.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ErrorAlert
                      error={bidError}
                      onDismiss={() => setBidError(null)}
                    />
                  </div>

                  {bidSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                    >
                      Vector confirmed. Bid injected into market.
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full inline-flex items-center justify-center gap-3 bg-emerald-500 text-white rounded-2xl font-bold py-6 text-xl overflow-hidden transition-all hover:scale-[1.01] active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-full transition-transform duration-700 ease-in-out" />
                    <span className="relative z-10 flex items-center gap-3">
                      {isSubmitting ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <>
                          <Send
                            size={20}
                            className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                          />
                          Execute Market Bid
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Deep Orderbook Leaderboard */}
          <div className="lg:col-span-4 glass-card overflow-hidden flex flex-col rounded-4xl border border-white/5 bg-[#0C0C12]/80 h-[800px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
                  <TrendingDown size={18} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                  Orderbook
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                {leaderboard.length} ranked
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-linear-to-b from-transparent to-black/40">
              <AnimatePresence mode="popLayout">
                {leaderboard.map((bid, i) => {
                  const isMe = bid.supplierId === user?.id;
                  return (
                    <motion.div
                      key={bid.supplierId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-xl flex justify-between items-center border ${
                        i === 0
                          ? "bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                          : isMe
                            ? "bg-indigo-500/10 border-indigo-500/30 box-shadow-inner"
                            : "bg-white/2 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border shadow-inner ${
                            i === 0
                              ? "bg-green-400 text-black border-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                              : isMe
                                ? "bg-indigo-500 border-indigo-400 text-white"
                                : "bg-white/5 text-zinc-500 border-white/10"
                          }`}
                        >
                          {i === 0 ? <Trophy size={16} /> : `L${i + 1}`}
                        </div>
                        <div>
                          <p
                            className={`font-black text-sm ${isMe ? "text-indigo-400" : "text-zinc-300"}`}
                          >
                            {isMe
                              ? "YOUR ENTITY"
                              : `Supplier #${bid.supplierId}`}
                          </p>
                          <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest mt-0.5">
                            {new Date(bid.timestamp).toLocaleTimeString(
                              undefined,
                              { hour12: false },
                            )}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-xl font-mono font-black ${i === 0 ? "text-green-400" : isMe ? "text-indigo-300" : "text-white"}`}
                      >
                        $
                        {bid.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
