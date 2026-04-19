"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../../../providers/auth-provider";
import { ApiError } from "../../../lib/api-error";
import { GoogleLogin } from "@react-oauth/google";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Gavel,
  Shield,
  Zap,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [error, setError] = useState<ApiError | string | null>(null);
  const [shaking, setShaking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      await login(data);
    } catch (e) {
      setError(e instanceof ApiError ? e : "Login failed. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#05050A]">
      {/* ─── Left Brand Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden flex-col justify-between p-12">
        {/* Ambient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[200px] pointer-events-none animate-float" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[200px] pointer-events-none animate-float"
          style={{ animationDelay: "4s" }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none mix-blend-overlay" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all duration-300">
              <Gavel size={22} className="text-indigo-400" />
            </div>
            <span className="text-xl font-black tracking-tight bg-linear-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
              BritishAuction
            </span>
          </Link>
        </motion.div>

        {/* Hero Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 space-y-8 max-w-lg"
        >
          <h1 className="text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] bg-linear-to-b from-white to-white/50 bg-clip-text text-transparent">
            Welcome
            <br />
            Back.
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-md">
            Rejoin the marketplace. Manage auctions, submit bids, and dominate
            the leaderboard — all in real-time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-sm">
              <Shield size={14} className="text-indigo-400" />
              <span>Enterprise-Grade Security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-sm">
              <Zap size={14} className="text-green-400" />
              <span>Live WebSocket Bidding</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom attribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10"
        >
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.25em]">
            Reverse Auction RFQ Platform &bull; v2.0
          </p>
        </motion.div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 relative">
        <div className="absolute inset-0 bg-[#08080F]" />
        <div className="absolute left-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-indigo-500/20 to-transparent hidden lg:block" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`w-full max-w-[440px] relative z-10 space-y-8 ${shaking ? "animate-shake" : ""}`}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Gavel size={18} className="text-indigo-400" />
              </div>
              <span className="text-lg font-black tracking-tight bg-linear-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
                BritishAuction
              </span>
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-white">
              Sign In
            </h2>
            <p className="text-zinc-500 text-sm font-medium">
              Enter your credentials to access the trading floor.
            </p>
          </div>

          <ErrorAlert error={error} onDismiss={() => setError(null)} />

          {/* Google OAuth — prominent position at top */}
          <div>
            <div className="flex justify-center rounded-2xl overflow-hidden border border-white/10 bg-white/2 p-4 hover:border-white/20 transition-colors">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      setError("");
                      await loginWithGoogle({
                        token: credentialResponse.credential,
                      });
                    } catch (e) {
                      setError(
                        e instanceof ApiError
                          ? e.message
                          : "Google OAuth failed.",
                      );
                    }
                  }
                }}
                onError={() => setError("Google OAuth initialization failed.")}
                theme="filled_black"
                shape="pill"
                size="large"
                text="signin_with"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative px-4 bg-[#08080F] text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
              Or with email
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors"
                />
                <input
                  {...register("email")}
                  type="email"
                  className="input-field pl-11 bg-black/40 border-white/10 focus:border-indigo-500/50 py-3.5 rounded-xl"
                  placeholder="name@company.com"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs ml-1 font-semibold">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors"
                />
                <input
                  {...register("password")}
                  type="password"
                  className="input-field pl-11 bg-black/40 border-white/10 focus:border-indigo-500/50 py-3.5 rounded-xl"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs ml-1 font-semibold">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-indigo-500 text-white rounded-xl font-bold py-4 text-base overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
