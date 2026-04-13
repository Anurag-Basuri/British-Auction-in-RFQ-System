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
import {
  Rocket,
  ArrowLeft,
  Loader2,
  Clock,
  Zap,
  Settings2,
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
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RfqForm>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      trigger_window_mins: 15,
      extension_mins: 5,
      trigger_type: "ANY_BID",
    },
  });

  const onSubmit = async (data: RfqForm) => {
    try {
      setError("");
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
      const err = e instanceof ApiError ? e.message : "Failed to create RFQ.";
      setError(err);
    }
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
      className="min-h-screen pt-24 px-8 pb-12"
      style={{ background: "var(--bg-primary)" }}
    >
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl mx-auto glass-card p-10 space-y-10"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">New Auction</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Configure parameters for your reverse auction
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* General Details */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 border-b border-white/4 pb-3">
              <Settings2 size={16} /> General Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Title
                </label>
                <input
                  {...register("title")}
                  className="input-field"
                  placeholder="e.g., Raw Materials Sourcing 2024"
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-red-400 text-xs ml-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Additional context for suppliers..."
                />
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 border-b border-white/4 pb-3">
              <Clock size={16} /> Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  {...register("start_time")}
                  className="input-field"
                  aria-invalid={!!errors.start_time}
                />
                {errors.start_time && (
                  <p className="text-red-400 text-xs ml-1">
                    {errors.start_time.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Close Time
                </label>
                <input
                  type="datetime-local"
                  {...register("close_time")}
                  className="input-field"
                  aria-invalid={!!errors.close_time}
                />
                {errors.close_time && (
                  <p className="text-red-400 text-xs ml-1">
                    {errors.close_time.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Forced Close
                </label>
                <input
                  type="datetime-local"
                  {...register("forced_close_time")}
                  className="input-field"
                  aria-invalid={!!errors.forced_close_time}
                />
                {errors.forced_close_time && (
                  <p className="text-red-400 text-xs ml-1">
                    {errors.forced_close_time.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Auction Dynamics */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 border-b border-white/4 pb-3">
              <Zap size={16} /> Auction Dynamics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Trigger Window (X mins)
                </label>
                <input
                  type="number"
                  {...register("trigger_window_mins", { valueAsNumber: true })}
                  className="input-field"
                  aria-invalid={!!errors.trigger_window_mins}
                />
                {errors.trigger_window_mins && (
                  <p className="text-red-400 text-xs ml-1">
                    {errors.trigger_window_mins.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                  Extension (Y mins)
                </label>
                <input
                  type="number"
                  {...register("extension_mins", { valueAsNumber: true })}
                  className="input-field"
                  aria-invalid={!!errors.extension_mins}
                />
                {errors.extension_mins && (
                  <p className="text-red-400 text-xs ml-1">
                    {errors.extension_mins.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
                Trigger Condition
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {triggerOptions.map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      {...register("trigger_type")}
                      value={opt.value}
                      className="peer hidden"
                    />
                    <div className="p-4 rounded-xl border border-white/6 bg-white/2 peer-checked:border-indigo-500/50 peer-checked:bg-indigo-500/10 transition-all duration-200">
                      <p className="font-semibold text-sm peer-checked:text-indigo-300">
                        {opt.label}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4 border-t border-white/4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-10"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Rocket size={16} /> Launch Auction
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
