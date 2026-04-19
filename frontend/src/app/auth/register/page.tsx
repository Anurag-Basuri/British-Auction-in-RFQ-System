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
  Building2,
  Truck,
  Gavel,
  Users,
  BarChart3,
} from "lucide-react";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["BUYER", "SUPPLIER"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister, loginWithGoogle } = useAuth();
  const [error, setError] = useState<ApiError | string | null>(null);
  const [shaking, setShaking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "SUPPLIER" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      await authRegister(data);
    } catch (e) {
      setError(e instanceof ApiError ? e : "Registration failed. Please try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#05050A]">
      {/* ─── Left Brand Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden flex-col justify-between p-12">
        {/* Ambient orbs */}
        <div className="absolute top-[-10%] right-[-15%] w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[200px] pointer-events-none animate-float" />
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[200px] pointer-events-none animate-float"
          style={{ animationDelay: "3s" }}
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
            Join the
            <br />
            Network.
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-md">
            Whether you source or supply, our platform levels the playing field
            with transparent, real-time bidding.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-sm">
              <Users size={14} className="text-purple-400" />
              <span>Multi-Role Access</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-sm">
              <BarChart3 size={14} className="text-green-400" />
              <span>Real-Time Rankings</span>
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
        <div className="absolute left-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-purple-500/20 to-transparent hidden lg:block" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`w-full max-w-[480px] relative z-10 space-y-7 ${shaking ? "animate-shake" : ""}`}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-6">
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
              Create Account
            </h2>
            <p className="text-zinc-500 text-sm font-medium">
              Select your role and join the marketplace.
            </p>
          </div>

          <ErrorAlert error={error} onDismiss={() => setError(null)} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ─── Role Selector ─── */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue("role", "SUPPLIER")}
                className={`group relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  selectedRole === "SUPPLIER"
                    ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    : "border-white/5 bg-black/40 hover:border-white/15 hover:bg-white/5"
                }`}
              >
                {selectedRole === "SUPPLIER" && (
                  <div className="absolute inset-0 bg-linear-to-t from-emerald-500/10 to-transparent pointer-events-none" />
                )}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                    selectedRole === "SUPPLIER"
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : "bg-white/5 border-white/10 text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  <Truck size={24} />
                </div>
                <div className="text-center relative z-10">
                  <p
                    className={`font-bold text-sm transition-colors ${
                      selectedRole === "SUPPLIER"
                        ? "text-emerald-300"
                        : "text-zinc-400"
                    }`}
                  >
                    Supplier
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5 font-medium">
                    Submit bids & compete
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue("role", "BUYER")}
                className={`group relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  selectedRole === "BUYER"
                    ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                    : "border-white/5 bg-black/40 hover:border-white/15 hover:bg-white/5"
                }`}
              >
                {selectedRole === "BUYER" && (
                  <div className="absolute inset-0 bg-linear-to-t from-indigo-500/10 to-transparent pointer-events-none" />
                )}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                    selectedRole === "BUYER"
                      ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                      : "bg-white/5 border-white/10 text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  <Building2 size={24} />
                </div>
                <div className="text-center relative z-10">
                  <p
                    className={`font-bold text-sm transition-colors ${
                      selectedRole === "BUYER"
                        ? "text-indigo-300"
                        : "text-zinc-400"
                    }`}
                  >
                    Buyer
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5 font-medium">
                    Create & manage RFQs
                  </p>
                </div>
              </button>
            </div>

            {/* Google OAuth */}
            <div className="flex justify-center rounded-2xl overflow-hidden border border-white/10 bg-white/2 p-4 hover:border-white/20 transition-colors">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      setError("");
                      await loginWithGoogle({
                        token: credentialResponse.credential,
                        role: selectedRole,
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
                text="signup_with"
              />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative px-4 bg-[#08080F] text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                Or with email
              </div>
            </div>

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
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-indigo-500 text-white rounded-xl font-bold py-4 text-base overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Create Account
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
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
