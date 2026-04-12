'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else {
      router.push(user?.role === 'BUYER' ? '/buyer' : '/supplier');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-glow" />
          <h1 className="relative text-4xl font-bold text-white">
            Initializing Platform...
          </h1>
        </div>
        <div className="w-48 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto opacity-60 animate-pulse" />
      </div>
    </div>
  );
}
