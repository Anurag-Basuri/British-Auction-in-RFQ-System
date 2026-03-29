'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/header';
import { io, Socket } from 'socket.io-client';
import { useParams } from 'next/navigation';
import { Clock, TrendingDown, Target, Zap, AlertTriangle, Users } from 'lucide-react';

interface Bid {
  id: number;
  price: number;
  timestamp: string;
  supplier: { email: string };
}

interface RFQ {
  id: number;
  title: string;
  close_time: string;
  forced_close_time: string;
  status: 'ACTIVE' | 'CLOSED';
  bids: Bid[];
}

export default function BuyerLiveAuction() {
  const { id } = useParams();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetchRfq();
    const s = io('http://localhost:3000');
    s.emit('join-rfq', +id);

    s.on('BID_PLACED', (newBid: Bid) => {
      setRfq(prev => prev ? ({ ...prev, bids: [newBid, ...prev.bids].sort((a,b) => a.price - b.price || new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) }) : null);
    });

    s.on('AUCTION_EXTENDED', ({ new_close }) => {
      setRfq(prev => prev ? ({ ...prev, close_time: new_close }) : null);
    });

    s.on('AUCTION_CLOSED', () => {
      setRfq(prev => prev ? ({ ...prev, status: 'CLOSED' }) : null);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [id]);

  useEffect(() => {
    if (!rfq) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(rfq.close_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('CLOSED');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [rfq]);

  const fetchRfq = async () => {
    const res = await fetch(`http://localhost:3000/rfq/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) setRfq(await res.json());
  };

  if (!rfq) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white font-bold text-2xl animate-pulse">Initializing Command Console...</div>;

  const l1Price = rfq.bids[0]?.price || 'N/A';
  const totalExtensions = Math.floor((new Date(rfq.close_time).getTime() - new Date().getTime()) / 60000); // Mock-up logic

  return (
    <div className="min-h-screen bg-[#0a0a0b] pt-24 pb-12 px-8">
      <Header />
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="premium-card p-10 bg-linear-to-r from-[#141417] via-[#1a1a1e] to-[#141417] flex justify-between items-center border border-indigo-500/20">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">{rfq.title}</h2>
            <div className="flex gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={16} className="text-indigo-400"/> Countdown: <span className="text-white font-mono font-bold">{timeLeft}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <AlertTriangle size={16} className="text-red-400"/> Hard Close: <span className="text-white font-mono">{new Date(rfq.forced_close_time).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex items-center gap-6">
            <div className="px-6 py-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-center">
              <p className="text-[10px] text-green-400 font-bold uppercase mb-1">Current L1</p>
              <p className="text-3xl font-black text-white">${l1Price}</p>
            </div>
            <div className={`px-6 py-4 rounded-2xl border flex flex-col justify-center items-center ${rfq.status === 'ACTIVE' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-[10px] font-bold uppercase mb-1">{rfq.status === 'ACTIVE' ? 'Monitoring' : 'Finalized'}</p>
              <div className={`w-3 h-3 rounded-full ${rfq.status === 'ACTIVE' ? 'bg-indigo-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3 premium-card overflow-hidden h-[600px] flex flex-col">
            <div className="p-6 border-b border-[#1f2937] bg-[#141417] flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><Target size={20} className="text-indigo-500"/> Real-time Supplier Ranking</h3>
              <span className="bg-indigo-500 text-white text-[10px] px-2 py-1 rounded font-bold">{rfq.bids.length} TOTAL BIDS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {rfq.bids.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <Users size={48} className="opacity-20"/>
                  <p className="font-medium">No bids submitted yet.</p>
                </div>
              ) : rfq.bids.map((bid, i) => (
                <div key={bid.id} className={`p-5 rounded-2xl flex justify-between items-center transition-all ${
                  i === 0 ? 'bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5' : 'bg-[#1e1e21] border border-transparent'
                }`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                      i === 0 ? 'bg-green-500 text-black' : 'bg-[#2a2a2e] text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-white">{bid.supplier.email}</p>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{new Date(bid.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-mono font-black ${i === 0 ? 'text-green-400' : 'text-white'}`}>${bid.price}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">Confirmed Transaction</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            <div className="premium-card p-6 space-y-6 bg-indigo-500/5 border-indigo-500/10">
              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 border-b border-indigo-500/10 pb-4 flex items-center gap-2"><Zap size={16}/> Auction Meta</h4>
              <div className="space-y-4">
                <div className="bg-[#141417] p-4 rounded-xl border border-[#1f2937]">
                  <p className="text-xs text-gray-500 mb-1">Total Active Suppliers</p>
                  <p className="text-2xl font-bold">{new Set(rfq.bids.map(b => b.supplier.email)).size}</p>
                </div>
                <div className="bg-[#141417] p-4 rounded-xl border border-[#1f2937]">
                  <p className="text-xs text-gray-500 mb-1">Average Bid Price</p>
                  <p className="text-2xl font-bold">
                    {rfq.bids.length > 0 ? `$${(rfq.bids.reduce((a,b) => a + b.price, 0) / rfq.bids.length).toFixed(2)}` : '--'}
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
