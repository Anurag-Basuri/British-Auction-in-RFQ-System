'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/app/header';
import { rfqService } from '../../../../services/rfq.service';
import { bidService } from '../../../../services/bid.service';
import { socketClient } from '../../../../lib/socket';
import { ApiError } from '../../../../lib/api-error';
import { useAuth } from '../../../../providers/auth-provider';
import type { RFQDetail, Bid } from '../../../../types/api';
import { Clock, Target, Zap, AlertTriangle, TrendingDown, Trophy, ArrowLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';

const bidSchema = z.object({
  freight_charges: z.number().nonnegative('Must be 0 or more'),
  origin_charges: z.number().nonnegative('Must be 0 or more'),
  destination_charges: z.number().nonnegative('Must be 0 or more'),
  transit_time: z.string().min(1, 'Required'),
  quote_validity: z.string().min(1, 'Required'),
});

type BidForm = z.infer<typeof bidSchema>;

function useCountdown(closeTime: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!closeTime) return;
    const timer = setInterval(() => {
      const diff = new Date(closeTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('CLOSED');
        setIsUrgent(false);
        clearInterval(timer);
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`);
        setIsUrgent(diff < 120000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [closeTime]);

  return { timeLeft, isUrgent };
}

export default function SupplierLiveAuction() {
  const { id } = useParams();
  const rfqId = Number(Array.isArray(id) ? id[0] : id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [extended, setExtended] = useState(false);

  const { data: rfq, isLoading } = useQuery<RFQDetail>({
    queryKey: ['rfq', rfqId],
    queryFn: () => rfqService.getRfqById(rfqId),
    enabled: !!rfqId,
    refetchInterval: 15000,
  });

  const { timeLeft, isUrgent } = useCountdown(rfq?.close_time);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BidForm>({
    resolver: zodResolver(bidSchema),
  });

  // Socket events
  useEffect(() => {
    if (!rfqId) return;
    const socket = socketClient.connect();
    socketClient.joinRfqRoom(rfqId);

    socket?.on('BID_PLACED', (newBid: Bid) => {
      queryClient.setQueryData<RFQDetail>(['rfq', rfqId], (old) => {
        if (!old) return old;
        const exists = old.bids.find(b => b.id === newBid.id);
        if (exists) return old;
        const updatedBids = [newBid, ...old.bids].sort((a, b) => a.price - b.price);
        return { ...old, bids: updatedBids };
      });
    });

    socket?.on('AUCTION_EXTENDED', ({ new_close }: { new_close: string }) => {
      queryClient.setQueryData<RFQDetail>(['rfq', rfqId], (old) => {
        if (!old) return old;
        return { ...old, close_time: new_close };
      });
      setExtended(true);
      setTimeout(() => setExtended(false), 3000);
    });

    socket?.on('AUCTION_CLOSED', () => {
      queryClient.setQueryData<RFQDetail>(['rfq', rfqId], (old) => {
        if (!old) return old;
        return { ...old, status: 'CLOSED' };
      });
    });

    return () => {
      socketClient.leaveRfqRoom(rfqId);
    };
  }, [rfqId, queryClient]);

  const onSubmit = async (data: BidForm) => {
    try {
      setBidError('');
      setBidSuccess(false);
      await bidService.placeBid(rfqId, {
        ...data,
        quote_validity: new Date(data.quote_validity).toISOString(),
      });
      setBidSuccess(true);
      reset();
      setTimeout(() => setBidSuccess(false), 3000);
    } catch (e) {
      setBidError(e instanceof ApiError ? e.message : 'Failed to submit bid.');
    }
  };

  if (isLoading || !rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4">
          <div className="skeleton w-64 h-8 rounded-xl mx-auto" />
          <div className="skeleton w-40 h-4 rounded mx-auto" />
        </div>
      </div>
    );
  }

  const sortedBids = [...rfq.bids].sort((a, b) => a.price - b.price);
  const l1Price = sortedBids[0]?.price;
  const userRank = sortedBids.findIndex(b => b.supplierId === user?.id) + 1;

  return (
    <div className="min-h-screen pt-24 pb-12 px-8" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link href="/supplier" className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                <ArrowLeft size={18} />
              </Link>
              <h2 className="text-3xl font-bold tracking-tight">{rfq.title}</h2>
              <span className={`badge ${rfq.status === 'ACTIVE' ? 'badge-active' : 'badge-closed'}`}>
                {rfq.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                {rfq.status}
              </span>
            </div>
            <div className="flex gap-6 text-sm flex-wrap">
              <span className="flex items-center gap-2 text-zinc-500">
                <Clock size={14} className="text-indigo-400" /> Ends in:
                <span className={`font-mono font-bold ${isUrgent ? 'animate-urgency' : 'text-white'} ${extended ? 'text-amber-400' : ''}`}>{timeLeft}</span>
              </span>
              <span className="flex items-center gap-2 text-zinc-500">
                <Zap size={14} className="text-green-400" /> L1:
                <span className="text-green-400 font-bold font-mono">{l1Price != null ? `$${l1Price.toFixed(2)}` : '--'}</span>
              </span>
            </div>
          </div>
          <div className="px-8 py-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-1">Your Rank</p>
            <p className="text-5xl font-black text-white">{userRank > 0 ? `L${userRank}` : '--'}</p>
          </div>
        </motion.div>

        {/* Extension flash */}
        <AnimatePresence>
          {extended && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 text-center font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Zap size={16} /> Auction Extended! Timer has been reset.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Bid Form + Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Target size={18} className="text-indigo-400" /> Submit New Bid
              </h3>

              {rfq.status === 'CLOSED' ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                  <AlertTriangle size={18} />
                  <span className="font-medium">This auction has concluded. Bidding is disabled.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Freight Charges</label>
                      <input type="number" step="0.01" {...register('freight_charges', { valueAsNumber: true })} className="input-field" placeholder="0.00" />
                      {errors.freight_charges && <p className="text-red-400 text-xs ml-1">{errors.freight_charges.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Origin Charges</label>
                      <input type="number" step="0.01" {...register('origin_charges', { valueAsNumber: true })} className="input-field" placeholder="0.00" />
                      {errors.origin_charges && <p className="text-red-400 text-xs ml-1">{errors.origin_charges.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Dest. Charges</label>
                      <input type="number" step="0.01" {...register('destination_charges', { valueAsNumber: true })} className="input-field" placeholder="0.00" />
                      {errors.destination_charges && <p className="text-red-400 text-xs ml-1">{errors.destination_charges.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Transit Time</label>
                      <input {...register('transit_time')} className="input-field" placeholder="e.g., 3-5 business days" />
                      {errors.transit_time && <p className="text-red-400 text-xs ml-1">{errors.transit_time.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Quote Validity</label>
                      <input type="datetime-local" {...register('quote_validity')} className="input-field" />
                      {errors.quote_validity && <p className="text-red-400 text-xs ml-1">{errors.quote_validity.message}</p>}
                    </div>
                  </div>

                  {bidError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center font-medium">{bidError}</div>
                  )}

                  {bidSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm text-center font-medium">
                      Bid submitted successfully!
                    </motion.div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-base">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Place Bid</>}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: Leaderboard */}
          <div className="glass-card flex flex-col" style={{ height: '700px' }}>
            <div className="p-6 border-b border-white/4 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingDown size={16} className="text-indigo-400" /> Leaderboard
              </h3>
              <span className="text-xs text-zinc-600 uppercase font-bold">{rfq.bids.length} entries</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {sortedBids.map((bid, i) => (
                  <motion.div
                    key={bid.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-xl flex justify-between items-center ${
                      i === 0
                        ? 'bg-green-500/10 border border-green-500/20'
                        : bid.supplierId === user?.id
                          ? 'bg-indigo-500/10 border border-indigo-500/20'
                          : 'bg-white/2 border border-white/4'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-green-500 text-black' : 'bg-white/6 text-zinc-500'
                      }`}>
                        {i === 0 ? <Trophy size={16} /> : `L${i + 1}`}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${bid.supplierId === user?.id ? 'text-indigo-400' : 'text-white'}`}>
                          {bid.supplierId === user?.id ? 'YOU' : `Supplier #${bid.supplierId}`}
                        </p>
                        <p className="text-[10px] text-zinc-600 uppercase font-bold">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <p className={`text-lg font-mono font-black ${i === 0 ? 'text-green-400' : 'text-white'}`}>
                      ${bid.price.toFixed(2)}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
