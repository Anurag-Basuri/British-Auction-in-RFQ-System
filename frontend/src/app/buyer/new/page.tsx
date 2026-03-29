'use client';

import { useState } from 'react';
import Header from '@/app/header';
import { useRouter } from 'next/navigation';

export default function CreateRfq() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    close_time: '',
    forced_close_time: '',
    trigger_window_mins: 5,
    extension_mins: 10,
    trigger_type: 'ANY_BID'
  });
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/rfq', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push('/buyer');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] pt-24 px-8 pb-12">
      <Header />
      <div className="max-w-3xl mx-auto premium-card p-10 space-y-10">
        <div>
          <h2 className="text-3xl font-bold">New Auction Configuration</h2>
          <p className="text-gray-400 mt-2">Configure parameters for your reverse auction</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-l-4 border-indigo-500 pl-4">General Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
                  placeholder="e.g., Raw Materials Sourcing 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
                  placeholder="Additional context for suppliers..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <h3 className="text-lg font-semibold border-l-4 border-indigo-500 pl-4 md:col-span-3">Timeline</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Start Time</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Close Time</label>
              <input
                type="datetime-local"
                value={formData.close_time}
                onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Forced Close</label>
              <input
                type="datetime-local"
                value={formData.forced_close_time}
                onChange={(e) => setFormData({ ...formData, forced_close_time: e.target.value })}
                className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <h3 className="text-lg font-semibold border-l-4 border-indigo-500 pl-4 md:col-span-3">Auction Dynamics (X, Y)</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Trigger Window (X mins)</label>
              <input
                type="number"
                value={formData.trigger_window_mins}
                onChange={(e) => setFormData({ ...formData, trigger_window_mins: +e.target.value })}
                className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Extension Time (Y mins)</label>
              <input
                type="number"
                value={formData.extension_mins}
                onChange={(e) => setFormData({ ...formData, extension_mins: +e.target.value })}
                className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Trigger Condition</label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                className="w-full bg-[#1e1e21] border border-[#2a2a2e] rounded-xl px-4 py-3"
              >
                <option value="ANY_BID">Any Bid</option>
                <option value="RANK_CHANGE">Rank Change</option>
                <option value="L1_CHANGE">L1 Change</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-x-4 pt-8">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="btn-primary flex-1 md:flex-none px-12 py-3 shadow-xl shadow-indigo-500/20">Launch Auction</button>
          </div>
        </form>
      </div>
    </div>
  );
}
