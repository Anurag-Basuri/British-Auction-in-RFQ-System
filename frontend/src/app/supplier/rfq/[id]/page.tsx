'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/header';
import { io, Socket } from 'socket.io-client';
import { useParams } from 'next/navigation';
import { Clock, TrendingDown, Target, Zap, AlertTriangle } from 'lucide-react';

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
  status: 'ACTIVE' | 'CLOSED';
  bids: Bid[];
}

export default function SupplierLiveAuction() {
  const { id } = useParams();
  const rfqId = Array.isArray(id) ? id[0] : id;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!rfqId) return;
    fetchRfq();
    const s = io('http://localhost:3000');
    s.emit('join-rfq', +rfqId);

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
  }, [rfqId]);

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
    const res = await fetch(`http://localhost:3000/rfq/${rfqId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) setRfq(await res.json());
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bidAmount <= 0) return;
    await fetch(`http://localhost:3000/rfq/${rfqId}/bid`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ price: bidAmount }),
    });
    setBidAmount(0);
  };

  if (!rfq) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white">Loading Live Auction...</div>;

  const l1Price = rfq.bids[0]?.price || 'N/A';
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRank = rfq.bids.findIndex(b => b.supplier.email === currentUser.email) + 1;

  return (
    <div className="min-h-screen bg-[#0a0a0b] pt-24 pb-12 px-8">
      <Header />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Bidding */}
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-card p-8 flex flex-col md:flex-row justify-between gap-8 items-center bg-linear-to-br from-[#141417] to-[#1a1a1e]">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">{rfq.title}</h2>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-1.5"><Clock size={16}/> Ends in: <span className="text-indigo-400 font-mono font-bold ml-1">{timeLeft}</span></span>
                <span className="flex items-center gap-1.5"><Zap size={16}/> L1: <span className="text-green-400 font-bold ml-1">{l1Price}</span></span>
              </div>
            </div>
            
            <div className="text-center md:text-right px-8 py-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-sm uppercase tracking-widest text-indigo-300 font-semibold mb-1">Your Rank</p>
              <p className="text-5xl font-black text-white">{userRank > 0 ? `L${userRank}` : '--'}</p>
            </div>
          </div>

          <div className="premium-card p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Target size={20} className="text-indigo-500"/> Submit New Bid</h3>
            {rfq.status === 'CLOSED' ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
                <AlertTriangle size={20}/>
                <span>This auction has concluded. Bidding is disabled.</span>
              </div>
            ) : (
              <form onSubmit={handleBid} className="flex gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    value={bidAmount || ''}
                    onChange={(e) => setBidAmount(+e.target.value)}
                    placeholder="Enter bid price"
                    className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl pl-8 pr-4 py-4 text-xl font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary px-12 py-4 text-lg shadow-xl shadow-indigo-500/30 font-bold hover:scale-105 active:scale-95 transition-all">
                  PLACE BID
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Bid History / Leaderboard */}
        <div className="premium-card flex flex-col h-[700px]">
          <div className="p-6 border-b border-[#1f2937] flex justify-between items-center bg-[#141417]">
            <h3 className="text-lg font-bold flex items-center gap-2"><TrendingDown size={18} className="text-indigo-500"/> Rank Leaderboard</h3>
            <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">{rfq.bids.length} entries</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {rfq.bids.map((bid, i) => (
              <div key={bid.id} className={`p-4 rounded-xl flex justify-between items-center transition-all ${
                i === 0 ? 'bg-green-500/10 border border-green-500/20' : 
                bid.supplier.email === currentUser.email ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' : 
                'bg-[#1e1e21] border border-transparent'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-green-500 text-black' : 'bg-[#2a2a2e] text-gray-400'
                  }`}>
                    L{i + 1}
                  </div>
                  <div>
                    <p className={`font-bold ${bid.supplier.email === currentUser.email ? 'text-indigo-400' : 'text-white'}`}>
                      {bid.supplier.email === currentUser.email ? 'YOU' : `Supplier ${bid.supplier.email.split('@')[0]}`}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p className={`text-xl font-mono font-black ${i === 0 ? 'text-green-400' : 'text-white'}`}>${bid.price}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
