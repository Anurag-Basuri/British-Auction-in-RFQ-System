"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ChevronRight, CheckCircle2, Info } from "lucide-react";
import { ApiError } from "../../lib/api-error";
import { useState } from "react";

interface ErrorAlertProps {
  error: ApiError | string | null;
  onDismiss?: () => void;
}

/**
 * Technical field name to professional label mapping
 */
const FIELD_LABELS: Record<string, string> = {
  // RFQ Creation
  title: "RFQ Identification Title",
  description: "Technical Specification",
  start_time: "Market Initialization Date",
  close_time: "Auction Soft-Close Boundary",
  forced_close_time: "Drop-Dead Finality Time",
  trigger_window_mins: "Auction Activity Window",
  extension_mins: "Overtime Increment",
  trigger_type: "Extension Calculation Logic",
  // Bidding
  freight_charges: "Ocean/Air Freight Baseline",
  origin_charges: "Port of Origin Ancillaries",
  destination_charges: "Port of Discharge Local Charges",
  transit_time: "Estimated Transit Duration",
  quote_validity: "Commercial Quote Expiry",
  // Auth
  email: "Corporate Email Address",
  password: "Security Credential",
};

/**
 * Generic message to descriptive instruction mapping
 */
const MESSAGE_ENRICHMENT: Record<string, string> = {
  "Required": "This parameter is mandatory for market synchronization.",
  "Must be 0 or more": "Negative values are not permitted for commercial charges.",
  "Must be a positive integer": "Value must be a whole number greater than zero.",
  "Enter a valid email address": "Please provide a standard corporate email (e.g., name@company.com).",
  "Minimum 6 characters": "Complexity requirement: minimum of 6 characters needed.",
};

/**
 * Premium glassmorphism error alert component.
 */
export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  const [expanded, setExpanded] = useState(true);

  if (!error) return null;

  const isApiError = error instanceof ApiError;
  const message = isApiError ? error.message : error;
  const rawFieldErrors: string[] = isApiError && Array.isArray(error.errors) ? error.errors : [];
  const statusCode = isApiError ? error.statusCode : null;

  // Map status codes to user-friendly categories
  const getCategoryLabel = (code: number | null) => {
    if (!code) return "System Event";
    if (code === 400) return "Configuration Mapping Failure";
    if (code === 401) return "Authentication Challenge";
    if (code === 403) return "Access Privilege Restricted";
    if (code === 404) return "Resource Location Failed";
    if (code === 409) return "Market Conflict Detected";
    if (code === 429) return "Traffic Throughput Throttled";
    return "Core System Exception";
  };

  /**
   * Provides actionable "How to fix" guidance based on status and context
   */
  const getActionableGuidance = (code: number | null, fields: string[]) => {
    if (!code) return null;
    
    if (code === 400 && fields.length > 0) {
      return "Critical form parameters are missing or invalid. Please populate all required fields using the professional labels provided below.";
    }
    
    if (code === 401) return "Current session token has expired. Re-authenticate to restore secure operational access.";
    if (code === 403) return "You do not have the necessary clearance for this action. Contact your lead administrator.";
    if (code === 429) return "System is processing high volume commands. Wait 60 seconds before retrying.";
    if (code >= 500) return "A synchronization error occurred in the cluster. Verify network stability and retry in the next cycle.";
    
    return "Verify the input data integrity and resubmit the command.";
  };

  const category = getCategoryLabel(statusCode);
  const guidance = getActionableGuidance(statusCode, rawFieldErrors);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.99 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-[#120808]/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_20px_rgba(239,68,68,0.1)]"
      >
        {/* Animated accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-transparent via-red-500/50 to-transparent" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-12 h-12 shrink-0 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {statusCode && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                      ERR_{statusCode}
                    </span>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400/80">
                    {category}
                  </span>
                </div>
                
                <h4 className="text-lg font-black text-red-50 text-balance leading-tight mb-2">
                  {message}
                </h4>

                {guidance && (
                  <div className="flex items-start gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                    <Info size={14} className="mt-0.5 text-indigo-400 shrink-0" />
                    <p className="text-xs text-zinc-300/90 font-medium leading-relaxed italic">
                      {guidance}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/20 transition-all duration-300"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Sub-requirements breakdown */}
          {rawFieldErrors.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-red-400 transition-colors mb-4 group"
              >
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-300 ${expanded ? "rotate-90 text-red-400" : ""}`}
                />
                Validation Resolution Logic ({rawFieldErrors.length})
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {rawFieldErrors.map((err, i) => {
                      // Parse "field: message" format
                      const colonIndex = err.indexOf(":");
                      const rawField = colonIndex > -1 ? err.slice(0, colonIndex).trim() : null;
                      const rawDetail = colonIndex > -1 ? err.slice(colonIndex + 1).trim() : err;

                      const label = rawField ? (FIELD_LABELS[rawField] || rawField.replace(/_/g, " ")) : "Parameter";
                      const detailedMessage = MESSAGE_ENRICHMENT[rawDetail] || rawDetail;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-black/40 border border-white/3 group hover:border-red-500/20 transition-all"
                        >
                          <div className="mt-1 p-1 rounded-md bg-red-500/10 border border-red-500/20">
                            <CheckCircle2 size={12} className="text-zinc-600 group-hover:text-red-400 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-red-300/70 transition-colors">
                                {label}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-tighter">
                                Required Protocol
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400 group-hover:text-red-100 transition-colors font-medium decoration-zinc-800 underline-offset-4 leading-normal">
                              {detailedMessage}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

