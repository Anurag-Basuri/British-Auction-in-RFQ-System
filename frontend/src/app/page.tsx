"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Target,
  Shield,
  Clock,
  BarChart3,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen text-white overflow-hidden relative selection:bg-indigo-500/30"
      style={{ background: "#05050A" }}
    >
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-screen w-full overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px] animate-pulse"
          style={{ animationDuration: "12s" }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#05050A]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              British<span className="text-indigo-400">Auction</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="btn-primary text-sm px-5 py-2.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-widest"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            V1.0 is now live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]"
          >
            Procurement,
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient">
              Mathematically Perfected.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium"
          >
            Enterprise-grade British Reverse Auctions. Real-time WebSocket
            contention. Auto-extending bid windows. True market value discovery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <Link
              href="/auth/register"
              className="btn-primary px-8 py-4 text-base w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Launch Live Arena <ArrowRight size={18} />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 text-base rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all w-full sm:w-auto text-center"
            >
              View Architecture
            </a>
          </motion.div>
        </div>

        {/* Floating UI Mockups */}
        <div className="mt-32 relative hidden md:block">
          <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-[#05050A] to-transparent z-10" />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-5xl rounded-t-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl overflow-hidden"
          >
            {/* Fake Mac Header */}
            <div className="h-10 border-b border-white/5 bg-white/2 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>

            {/* Fake UI Content */}
            <div className="p-8 grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="h-32 rounded-xl bg-white/3 border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <div className="w-1/3 h-4 rounded bg-white/10" />
                  <div className="flex justify-between items-end">
                    <div className="w-1/4 h-8 rounded bg-white/20" />
                    <div className="w-1/6 h-4 rounded bg-amber-500/20" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-16 rounded-xl bg-white/2 border border-white/5 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/20" />
                      <div className="w-24 h-3 rounded bg-white/10" />
                    </div>
                    <div className="w-20 h-4 rounded bg-white/20" />
                  </div>
                  <div className="h-16 rounded-xl bg-white/2 border border-white/5 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5" />
                      <div className="w-24 h-3 rounded bg-white/10" />
                    </div>
                    <div className="w-20 h-4 rounded bg-white/10" />
                  </div>
                </div>
              </div>
              <div className="col-span-1 space-y-6">
                <div className="h-24 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-6 flex flex-col justify-between">
                  <div className="w-1/2 h-3 rounded bg-indigo-400/50" />
                  <div className="w-3/4 h-8 rounded bg-indigo-400" />
                </div>
                <div className="h-48 rounded-xl bg-white/3 border border-white/5 p-6 space-y-4">
                  <div className="w-1/2 h-3 rounded bg-white/10" />
                  <div className="w-full h-8 rounded bg-white/5" />
                  <div className="w-full h-8 rounded bg-white/5" />
                  <div className="w-2/3 h-8 rounded bg-white/5" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="relative z-20 bg-[#05050A] py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Engineered for Scale
            </h2>
            <p className="text-zinc-500 max-w-2xl">
              The technical foundation designed to handle high-stakes
              multi-million dollar procurement negotiations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="text-amber-400" size={24} />}
              title="Sub-second Sockets"
              desc="Optimistic React Query cache injections via Socket.IO. See bids before they visually render."
            />
            <FeatureCard
              icon={<Target className="text-indigo-400" size={24} />}
              title="British Math Engine"
              desc="Autonomous BullMQ background workers extending auctions by exact micro-seconds on late contention."
            />
            <FeatureCard
              icon={<Shield className="text-green-400" size={24} />}
              title="Cryptographic RBAC"
              desc="Strict topological separation between Buyers and Suppliers validated via stateless JWT interceptors."
            />
            <FeatureCard
              icon={<Clock className="text-blue-400" size={24} />}
              title="Staggered Revalidation"
              desc="Resilient 30s background fetching loops to ensure data absolute consistency across network drops."
            />
            <FeatureCard
              icon={<BarChart3 className="text-purple-400" size={24} />}
              title="Typed Data Fortress"
              desc="End-to-End type safety mapping PostgreSQL bits directly to UI pixels via Prisma and Zod."
            />
            <FeatureCard
              icon={<Lock className="text-rose-400" size={24} />}
              title="Decentralized Auth"
              desc="Frictionless onboarding utilizing Google OAuth natively tied to systemic role provisioning."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-zinc-600 text-sm">
        <p>© 2026 British Auction Platform. Open Source architecture.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/4 transition-colors group">
      <div className="w-12 h-12 rounded-xl bg-white/4 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-zinc-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
