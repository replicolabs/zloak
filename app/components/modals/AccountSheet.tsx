"use client";
import { useState } from "react";
import { Copy, Check, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import GlassModal from "@/components/ui/GlassModal";
import { Currency, CURRENCY_LABELS } from "@/components/ui/CurrencySelector";

interface AccountSheetProps {
  open: boolean;
  onClose: () => void;
  address: string;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onDisconnect: () => void;
}

const CURRENCIES: Currency[] = ["NGN", "USD", "GBP"];

export default function AccountSheet({ open, onClose, address, currency, onCurrencyChange, onDisconnect }: AccountSheetProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const short = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "";

  return (
    <GlassModal open={open} onClose={onClose} title="Account">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Wallet address</p>
          <div className="glass glass-md flex items-center justify-between gap-3 px-4 py-3">
            <span className="font-mono text-sm truncate" style={{ color: "var(--ink)" }}>{short}</span>
            <button
              onClick={copy}
              className="flex items-center justify-center flex-shrink-0 rounded-full touch"
              style={{ width: 32, height: 32, background: "rgba(0,0,0,0.06)", color: "var(--ink-soft)" }}
            >
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={14} /></motion.div>
                  : <motion.div key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy size={14} /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Display currency</p>
          <div
            className="glass glass-pill flex p-1"
            style={{ width: "100%" }}
          >
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => onCurrencyChange(c)}
                className="flex-1 relative py-2.5 text-sm font-medium rounded-full touch"
                style={{ color: c === currency ? "white" : "var(--ink-soft)", zIndex: 1 }}
              >
                {c === currency && (
                  <motion.div
                    layoutId="currencyPill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--ink)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1">
                  <span>{CURRENCY_LABELS[c].symbol}</span>
                  <span>{c}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-1">
          <div style={{ height: 1, background: "rgba(0,0,0,0.07)", borderRadius: 1 }} />
          <button
            onClick={() => { onClose(); onDisconnect(); }}
            className="w-full flex items-center gap-3 px-1 py-3 text-sm font-medium touch"
            style={{ color: "var(--ink-soft)" }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            Disconnect wallet
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
