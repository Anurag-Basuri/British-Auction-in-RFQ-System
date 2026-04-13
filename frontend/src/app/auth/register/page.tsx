"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../../../providers/auth-provider";
import { ApiError } from "../../../lib/api-error";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Building2,
  Truck,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["BUYER", "SUPPLIER"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
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
      const err =
        e instanceof ApiError
          ? e.message
          : "Registration failed. Please try again.";
      setError(err);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] animate-float" />
      <div
        className="absolute bottom-1/3 -left-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] animate-float"
        style={{ animationDelay: "3s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-md glass-card p-10 space-y-8 relative ${shaking ? "animate-shake" : ""}`}
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-zinc-500 text-sm">
            Join the British Auction network
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("role", "SUPPLIER")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                selectedRole === "SUPPLIER"
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/10"
                  : "border-white/6 bg-white/2 text-zinc-500 hover:text-zinc-300 hover:border-white/10"
              }`}
            >
              <Truck size={22} />
              <span className="text-sm font-semibold">Supplier</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "BUYER")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                selectedRole === "BUYER"
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/10"
                  : "border-white/6 bg-white/2 text-zinc-500 hover:text-zinc-300 hover:border-white/10"
              }`}
            >
              <Building2 size={22} />
              <span className="text-sm font-semibold">Buyer</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />
              <input
                {...register("email")}
                type="email"
                className="input-field pl-11"
                placeholder="name@company.com"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs ml-1 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />
              <input
                {...register("password")}
                type="password"
                className="input-field pl-11"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs ml-1 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3.5 mt-2 text-base"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative px-4 bg-[#05050A] text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            Or register with
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  setError("");
                  // Pass the role explicitly so if it's a first-time Google sign up, they get the right role
                  await loginWithGoogle({
                    token: credentialResponse.credential,
                    role: selectedRole,
                  });
                } catch (e) {
                  setError(
                    e instanceof ApiError ? e.message : "Google OAuth failed.",
                  );
                }
              }
            }}
            onError={() => setError("Google OAuth initialization failed.")}
            useOneTap
            theme="filled_black"
            shape="pill"
            width="100%"
          />
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
