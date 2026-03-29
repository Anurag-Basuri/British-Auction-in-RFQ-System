'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-[#1f2937] z-50 flex items-center justify-between px-8">
      <div className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
        Auction System
      </div>
      <nav className="flex space-x-6">
        <Link href="/buyer" className="hover:text-blue-400 transition-colors">Buyer Portal</Link>
        <Link href="/supplier" className="hover:text-blue-400 transition-colors">Supplier Portal</Link>
        <button onClick={logout} className="hover:text-red-400 transition-colors">Logout</button>
      </nav>
    </header>
  );
}
