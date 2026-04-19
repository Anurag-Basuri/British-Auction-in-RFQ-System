"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ChevronRight } from "lucide-react";
import { ApiError } from "../../lib/api-error";
import { useState } from "react";

interface ErrorAlertProps {
  error: ApiError | string | null;
  onDismiss?: () => void;
}

/**
 * Premium glassmorphism error alert component.
 * Accepts either a raw string or a structured ApiError.
 * When an ApiError with field-level `errors[]` is provided,
 * it renders an actionable bulleted breakdown so the user
 * knows exactly what to fix.
 */
export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  const [expanded, setExpanded] = useState(true);

  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const message = isApiError ? error.message : error;
  const fieldErrors: string[] =
    isApiError && Array.isArray(error.errors) ? error.errors : [];
  const statusCode = isApiError ? error.statusCode : null;

  // Map status codes to user-friendly categories
  const getCategoryLabel = (code: number | null) => {
    if (!code) return "Error";
    if (code === 400) return "Validation Error";
    if (code === 401) return "Authentication Error";
    if (code === 403) return "Access Denied";
    if (code === 404) return "Not Found";
    if (code === 409) return "Conflict";
    if (code === 429) return "Rate Limited";
    return "Server Error";
  };

  // Map status codes to actionable guidance
  const getGuidance = (code: number | null) => {
    if (!code) return null;
    if (code === 401) return "Please log in again to refresh your session.";
    if (code === 403)
      return "You do not have permission to perform this action.";
    if (code === 429)
      return "Too many requests. Please wait a moment and try again.";
    if (code >= 500)
      return "This is a server issue. Please try again shortly or contact support.";
    return null;
  };

  const category = getCategoryLabel(statusCode);
  const guidance = getGuidance(statusCode);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.07] backdrop-blur-xl shadow-[0_8px_40px_rgba(239,68,68,0.12)]"
      >
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-red-500 to-transparent opacity-60" />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 w-9 h-9 shrink-0 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  {statusCode && (
                    <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                      {statusCode}
                    </span>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400/70">
                    {category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-200 leading-snug">
                  {message}
                </p>
                {guidance && (
                  <p className="text-xs text-red-300/50 mt-1.5 font-medium leading-relaxed">
                    {guidance}
                  </p>
                )}
              </div>
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-7 h-7 shrink-0 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center text-red-400/60 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Expandable field-level errors */}
          {fieldErrors.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-300 transition-colors mb-2"
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                />
                {fieldErrors.length} field{fieldErrors.length > 1 ? "s" : ""}{" "}
                require attention
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-1.5 overflow-hidden pl-1"
                  >
                    {fieldErrors.map((err, i) => {
                      // Parse "field: message" format from backend
                      const colonIndex = err.indexOf(":");
                      const field =
                        colonIndex > -1
                          ? err.slice(0, colonIndex).trim()
                          : null;
                      const detail =
                        colonIndex > -1
                          ? err.slice(colonIndex + 1).trim()
                          : err;

                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2.5 py-1.5 px-3 rounded-lg bg-red-500/6 border border-red-500/10"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                          <div className="flex-1 min-w-0">
                            {field && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-red-300/70 block mb-0.5">
                                {field.replace(/_/g, " ")}
                              </span>
                            )}
                            <span className="text-xs text-red-200/80 font-medium leading-relaxed">
                              {detail}
                            </span>
                          </div>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
