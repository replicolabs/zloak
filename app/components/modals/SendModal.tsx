"use client";
import { useState } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassModal from "@/components/ui/GlassModal";
import SendManual from "./SendManual";
import SendAgent from "./SendAgent";
import { Currency } from "@/components/ui/CurrencySelector";

type SendStep = "choice" | "manual" | "agent";

interface SendModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  onSend: (params: { recipientAddress: string; recipientName: string | null; amountUsdc: number; currency: Currency; originalAmount: number }) => void;
}

export default function SendModal({ open, onClose, walletAddress, onSend }: SendModalProps) {
  const [step, setStep] = useState<SendStep>("choice");

  const handleClose = () => { setStep("choice"); onClose(); };

  const titles: Record<SendStep, string> = {
    choice: "Send",
    manual: "Send manually",
    agent: "Send with agent",
  };

  return (
    <GlassModal open={open} onClose={handleClose} title={titles[step]}>
      <AnimatePresence mode="wait">
        {step === "choice" && (
          <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <button
              onClick={() => setStep("manual")}
              className="glass glass-md w-full flex items-start gap-4 p-4 text-left touch transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-center rounded-2xl mt-0.5 flex-shrink-0" style={{ width: 40, height: 40, background: "rgba(0,0,0,0.06)" }}>
                <PenLine size={18} style={{ color: "var(--ink)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Send manually</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>Pick amount and recipient yourself</p>
              </div>
            </button>

            <button
              onClick={() => setStep("agent")}
              className="glass glass-md w-full flex items-start gap-4 p-4 text-left touch transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-center rounded-2xl mt-0.5 flex-shrink-0" style={{ width: 40, height: 40, background: "rgba(0,0,0,0.06)" }}>
                <Sparkles size={18} style={{ color: "var(--ink)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Send with Zloak agent</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>Just say who to pay</p>
              </div>
            </button>
          </motion.div>
        )}

        {step === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <SendManual walletAddress={walletAddress} onSend={onSend} onBack={() => setStep("choice")} />
          </motion.div>
        )}

        {step === "agent" && (
          <motion.div key="agent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <SendAgent walletAddress={walletAddress} onConfirm={onSend} onBack={() => setStep("choice")} />
          </motion.div>
        )}
      </AnimatePresence>
    </GlassModal>
  );
}
