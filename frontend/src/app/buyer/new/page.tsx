"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/app/header";
import { rfqService } from "../../../services/rfq.service";
import { ApiError } from "../../../lib/api-error";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Rocket,
  ArrowLeft,
  Loader2,
  Clock,
  Zap,
  Settings2,
  Target,
} from "lucide-react";

const rfqSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  close_time: z.string().min(1, "Close time is required"),
  forced_close_time: z.string().min(1, "Forced close time is required"),
  trigger_window_mins: z.number().int().positive("Must be a positive integer"),
  extension_mins: z.number().int().positive("Must be a positive integer"),
  trigger_type: z.enum(["ANY_BID", "RANK_CHANGE", "L1_CHANGE"]),
});

type RfqForm = z.infer<typeof rfqSchema>;

export default function CreateRfq() {
  const router = useRouter();
  const [error, setError] = useState<ApiError | string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RfqForm>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      trigger_window_mins: 15,
      extension_mins: 5,
      trigger_type: "ANY_BID",
    },
  });

  const watchTitle = watch("title");
  const watchTriggerType = watch("trigger_type");

  const scrollToError = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: RfqForm) => {
    try {
      setError(null);
      // Convert to ISO 8601 for the backend
      const payload = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        close_time: new Date(data.close_time).toISOString(),
        forced_close_time: new Date(data.forced_close_time).toISOString(),
      };
      await rfqService.createRfq(payload);
      router.push("/buyer");
    } catch (e) {
      setError(e instanceof ApiError ? e : "Failed to create RFQ.");
      scrollToError();
    }
  };

  const onInvalid = (errors: any) => {
    console.log("Form Validation Failed:", errors);
    // Map react-hook-form errors to ApiError-like structure for ErrorAlert
    const fieldErrorMessages = Object.entries(errors).map(([field, err]: [string, any]) => {
      return `${field}: ${err.message || "Required"}`;
    });

    const clientError = new ApiError(
      "Infrastructure mapping failed. Please correct the parameters below.",
      400,
      fieldErrorMessages
    );

    setError(clientError);
    scrollToError();
  };

  const triggerOptions = [
    {
      value: "ANY_BID",
      label: "Any Bid",
      description: "Extends on every bid in the window",
    },
    {
      value: "RANK_CHANGE",
      label: "Rank Change",
      description: "Extends when supplier rankings shift",
    },
    {
      value: "L1_CHANGE",
      label: "L1 Change",
      description: "Extends only when the lowest bid changes",
    },
  ];

  return (
    <div
      className="min-h-screen pt-32 px-4 sm:px-8 pb-16 relative overflow-hidden"
      style={{ background: "#05050A" }}
    >
      <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-float" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      <Header />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white mb-1">
              Initialize Auction
            </h2>
            <p className="text-indigo-400/80 text-sm font-semibold uppercase tracking-widest">
              Define reverse auction strict parameters
            </p>
          </div>
        </div>

        <div className="mb-8 max-w-2xl mx-auto">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* General Details */}
              <section className="glass-card p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                  <Settings2 size={18} /> Asset Classification
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Event Title
                    </label>
                    <input
                      {...register("title")}
                      className="input-field bg-black/40 border-white/10 focus:border-indigo-500/50 py-4 text-base rounded-xl"
                      placeholder="e.g., Q3 Global Logistics Sourcing"
                      aria-invalid={!!errors.title}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-xs ml-1 font-medium mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Technical Specification
                    </label>
                    <textarea
                      {...register("description")}
                      className="input-field min-h-[140px] resize-none bg-black/40 border-white/10 focus:border-indigo-500/50 py-4 rounded-xl"
                      placeholder="Detailing exact material thresholds, delivery locations, and compliance requirements..."
                    />
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="glass-card p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                  <Clock size={18} /> Temporal Boundries
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Initialization
                    </label>
                    <input
                      type="datetime-local"
                      {...register("start_time")}
                      className="input-field bg-black/40 border-white/10 focus:border-indigo-500/50 py-3 rounded-xl [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                      aria-invalid={!!errors.start_time}
                    />
                    {errors.start_time && (
                      <p className="text-red-400 text-xs ml-1 font-medium">
                        {errors.start_time.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Soft Close
                    </label>
                    <input
                      type="datetime-local"
                      {...register("close_time")}
                      className="input-field bg-black/40 border-white/10 focus:border-indigo-500/50 py-3 rounded-xl [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                      aria-invalid={!!errors.close_time}
                    />
                    {errors.close_time && (
                      <p className="text-red-400 text-xs ml-1 font-medium">
                        {errors.close_time.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Hard Close (Drop-dead)
                    </label>
                    <input
                      type="datetime-local"
                      {...register("forced_close_time")}
                      className="input-field bg-black/40 border-white/10 focus:border-red-500/50 py-3 rounded-xl [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
                      aria-invalid={!!errors.forced_close_time}
                    />
                    {errors.forced_close_time && (
                      <p className="text-red-400 text-xs ml-1 font-medium">
                        {errors.forced_close_time.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Auction Dynamics */}
              <section className="glass-card p-8 rounded-4xl border border-white/5 bg-[#0C0C12]/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-3">
                    <Zap size={18} /> Advanced Dynamics
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-bold tracking-widest border border-indigo-500/20">
                    Pro Options
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Trigger Window (Mins)
                    </label>
                    <input
                      type="number"
                      {...register("trigger_window_mins", {
                        valueAsNumber: true,
                      })}
                      className="input-field bg-black/40 border-white/10 focus:border-indigo-500/50 py-3 rounded-xl font-mono text-lg"
                      aria-invalid={!!errors.trigger_window_mins}
                    />
                    {errors.trigger_window_mins && (
                      <p className="text-red-400 text-xs ml-1 font-medium">
                        {errors.trigger_window_mins.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Overtime Extension (Mins)
                    </label>
                    <input
                      type="number"
                      {...register("extension_mins", {
                        valueAsNumber: true,
                      })}
                      className="input-field bg-black/40 border-white/10 focus:border-indigo-500/50 py-3 rounded-xl font-mono text-lg text-green-400"
                      aria-invalid={!!errors.extension_mins}
                    />
                    {errors.extension_mins && (
                      <p className="text-red-400 text-xs ml-1 font-medium">
                        {errors.extension_mins.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Extension Trigger Logic
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {triggerOptions.map((opt) => (
                      <label key={opt.value} className="cursor-pointer group">
                        <input
                          type="radio"
                          {...register("trigger_type")}
                          value={opt.value}
                          className="peer hidden"
                        />
                        <div className="p-5 rounded-2xl border border-white/5 bg-black/30 peer-checked:border-indigo-500/50 peer-checked:bg-indigo-500/10 peer-checked:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 h-full">
                          <div className="w-5 h-5 rounded-full border-2 border-zinc-600 peer-checked:border-indigo-400 peer-checked:bg-indigo-400 flex items-center justify-center mb-3 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                          </div>
                          <p className="font-bold text-sm text-zinc-300 peer-checked:text-indigo-300 mb-1 transition-colors">
                            {opt.label}
                          </p>
                          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Side Summary Panel */}
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-4xl border border-indigo-500/30 bg-indigo-500/5 sticky top-28 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                <Target size={32} className="text-indigo-400 mb-6" />
                <h4 className="text-lg font-black text-white mb-2">
                  Auction Synopsis
                </h4>
                <p className="text-zinc-400 text-sm mb-6 pb-6 border-b border-white/10">
                  {watchTitle || "Awaiting Title Parameters..."}
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Rule Engine
                    </span>
                    <span className="text-indigo-300 font-mono bg-indigo-500/10 px-2 py-1 rounded text-xs border border-indigo-500/20">
                      {watchTriggerType.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Access Level
                    </span>
                    <span className="text-green-400 font-mono bg-green-500/10 px-2 py-1 rounded text-xs border border-green-500/20">
                      PUBLIC MARKET
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full inline-flex items-center justify-center gap-3 bg-indigo-500 text-white rounded-xl font-bold py-4 text-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Rocket
                          size={18}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
                        />
                        Deploy Market
                      </>
                    )}
                  </span>
                </button>
                <p className="text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-4">
                  Action establishes live socket links
                </p>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
