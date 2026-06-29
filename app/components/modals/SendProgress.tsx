"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import GlassModal from "@/components/ui/GlassModal";
import { STELLAR_EXPERT_TESTNET } from "@/lib/constants";

export type Phase = "preparing" | "generating-proof" | "settling" | "done" | "error";

export interface SendProgressProps {
  open: boolean;
  phase: Phase;
  errorMessage?: string;
  withdrawHashes?: string[];
  onDismiss: () => void;
}

const PHASE_LABELS: Record<Phase, string> = {
  "preparing":        "Preparing",
  "generating-proof": "Generating proof",
  "settling":         "Settling on Stellar",
  "done":             "Done",
  "error":            "Something went wrong",
};

const PHASES: Phase[] = ["preparing", "generating-proof", "settling", "done"];

function Ring({ phase }: { phase: Phase }) {
  const isDone = phase === "done";
  const isError = phase === "error";
  const circumference = 2 * Math.PI * 36;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        {!isDone && !isError && (
          <motion.circle
            cx="44" cy="44" r="36"
            fill="none" stroke="var(--ink)" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            style={{ transformOrigin: "44px 44px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        )}
        {isDone && (
          <motion.circle
            cx="44" cy="44" r="36"
            fill="none" stroke="var(--ink)" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </svg>
      <AnimatePresence mode="wait">
        {isDone && (
          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L19 7" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
        {isError && (
          <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v6M10 14v1" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SendProgress({ open, phase, errorMessage, withdrawHashes, onDismiss }: SendProgressProps) {
  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(onDismiss, 3000);
      return () => clearTimeout(t);
    }
  }, [phase, onDismiss]);

  const currentIdx = PHASES.indexOf(phase);
  const inFlight = phase !== "done" && phase !== "error";

  return (
    <GlassModal open={open} variant="center" hideClose onClose={onDismiss} protected={inFlight}>
      <div className="flex flex-col items-center gap-6 py-4">
        <Ring phase={phase} />

        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-base font-semibold"
              style={{ color: "var(--ink)" }}
            >
              {PHASE_LABELS[phase]}
            </motion.p>
          </AnimatePresence>
          {phase === "generating-proof" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs mt-1"
              style={{ color: "var(--ink-soft)" }}
            >
              Computing on server, please wait…
            </motion.p>
          )}
          {phase === "error" && errorMessage && (
            <p className="text-xs mt-1 max-w-[260px] text-center" style={{ color: "var(--ink-soft)" }}>
              {errorMessage}
            </p>
          )}
        </div>

        {phase !== "error" && (
          <div className="flex gap-2 items-center">
            {PHASES.filter(p => p !== "done").map((p, i) => {
              const filled = currentIdx > PHASES.indexOf(p) || phase === "done";
              const active = p === phase;
              return (
                <motion.div
                  key={p}
                  animate={{ opacity: filled || active ? 1 : 0.3, scale: active ? 1.3 : 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--ink)",
                  }}
                />
              );
            })}
          </div>
        )}

        {phase === "done" && withdrawHashes && withdrawHashes.length > 0 && (
          <div className="space-y-1 w-full">
            {withdrawHashes.map(h => (
              <a
                key={h}
                href={`${STELLAR_EXPERT_TESTNET}/tx/${h}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-md flex items-center gap-2 px-3 py-2 text-xs"
                style={{ color: "var(--ink-soft)" }}
              >
                <ExternalLink size={12} />
                {h.slice(0, 12)}…{h.slice(-8)}
              </a>
            ))}
          </div>
        )}

        {phase === "error" && (
          <button
            onClick={onDismiss}
            className="glass glass-pill px-6 py-2.5 text-sm font-medium touch"
            style={{ color: "var(--ink)" }}
          >
            Dismiss
          </button>
        )}
      </div>
    </GlassModal>
  );
}
