'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/header';
import { Clock, TrendingDown, Target, FileSearch } from 'lucide-react';
import Link from 'next/link';

interface RFQ {
  id: number;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  close_time: string;
  _count: { bids: number };
}

export default function SupplierDashboard() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveRfqs();
  }, []);

  const fetchActiveRfqs = async () => {
    try {
      const res = await fetch('http://localhost:3000/rfq', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const activeOnly = data.filter((r: RFQ) => r.status !== 'DRAFT');
        setRfqs(activeOnly);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] pt-24 pb-12 px-8">
      <Header />
      
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Supplier Marketplace</h2>
          <p className="text-gray-400">Discover and participate in active reverse auctions</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-[#141417] rounded-2xl border border-[#1f2937]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rfqs.map(rfq => (
              <Link key={rfq.id} href={`/supplier/rfq/${rfq.id}`} className="group">
                <div className="premium-card p-6 h-64 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <FileSearch size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${
                        rfq.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold line-clamp-2">{rfq.title}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#1f2937] pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={16} />
                      <span>{new Date(rfq.close_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <TrendingDown size={16} />
                      <span>{rfq._count.bids} Bids</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
