'use client';

import { useQuery } from '@tanstack/react-query';
import { rfqService } from '../../services/rfq.service';
import Header from '../header';
import { Clock, TrendingDown, FileSearch, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { RFQ } from '../../types/api';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

function SkeletonCard() {
  return (
    <div className="glass-card p-6 h-64 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="skeleton w-12 h-12 rounded-xl" />
          <div className="skeleton w-20 h-6 rounded-full" />
        </div>
        <div className="skeleton w-3/4 h-6 rounded-lg" />
        <div className="skeleton w-1/2 h-4 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/4">
        <div className="skeleton w-full h-4 rounded" />
        <div className="skeleton w-full h-4 rounded" />
      </div>
    </div>
  );
}

export default function SupplierDashboard() {
  const { data: allRfqs = [], isLoading, error } = useQuery<RFQ[]>({
    queryKey: ['rfqs'],
    queryFn: rfqService.getAllRfqs,
    refetchInterval: 30000,
  });

  // Suppliers only see non-DRAFT auctions
  const rfqs = allRfqs.filter(r => r.status !== 'DRAFT');

  return (
    <div className="min-h-screen pt-24 pb-12 px-8" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <div className="max-w-7xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-4xl font-bold tracking-tight">Supplier Marketplace</h2>
          <p className="text-zinc-500">Discover and participate in active reverse auctions</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="glass-card p-12 text-center space-y-4">
            <p className="text-red-400 font-medium">Failed to load auctions</p>
            <p className="text-zinc-500 text-sm">{(error as Error).message}</p>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="glass-card p-16 text-center space-y-4">
            <FileSearch size={48} className="text-zinc-700 mx-auto" />
            <p className="text-zinc-400 font-medium text-lg">No active auctions</p>
            <p className="text-zinc-600 text-sm">Check back soon for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rfqs.map((rfq, i) => (
              <motion.div key={rfq.id} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                <Link href={`/supplier/rfq/${rfq.id}`} className="group block">
                  <div className="glass-card p-6 h-64 flex flex-col justify-between group-hover:border-indigo-500/30 transition-all duration-300 group-hover:-translate-y-1">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                          <FileSearch size={20} />
                        </div>
                        <span className={`badge ${rfq.status === 'ACTIVE' ? 'badge-active' : 'badge-closed'}`}>
                          {rfq.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                          {rfq.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold line-clamp-2 group-hover:text-indigo-300 transition-colors">{rfq.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/4 pt-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Clock size={14} />
                        <span>{new Date(rfq.close_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <TrendingDown size={14} />
                        <span>{rfq._count?.bids || 0} Bids</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
