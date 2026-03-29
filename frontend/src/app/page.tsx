'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token) {
      router.push('/auth/login');
    } else {
      router.push(user.role === 'BUYER' ? '/buyer' : '/supplier');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white animate-pulse">Initializing Reverse Auction Platform...</h1>
        <div className="w-16 h-1 w-full bg-indigo-500 rounded-full mx-auto animate-bounce opacity-20"></div>
      </div>
    </div>
  );
}
