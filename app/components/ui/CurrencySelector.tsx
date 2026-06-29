"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Currency = "NGN" | "USD" | "GBP";
export const CURRENCY_LABELS: Record<Currency, { symbol: string; name: string }> = {
  NGN: { symbol: "₦", name: "Naira" },
  USD: { symbol: "$", name: "Dollar" },
  GBP: { symbol: "£", name: "Pound" },
};

interface CurrencySelectorProps {
  value: Currency;
  onChange: (c: Currency) => void;
  size?: "sm" | "md";
}

export default function CurrencySelector({ value, onChange, size = "md" }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const px = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`glass glass-pill flex items-center gap-1.5 font-medium touch ${px}`}
        style={{ color: "var(--ink)" }}
        type="button"
      >
        <span>{CURRENCY_LABELS[value].symbol}</span>
        <span>{value}</span>
        <ChevronDown size={14} style={{ color: "var(--ink-soft)" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="glass glass-md absolute left-0 top-full mt-1 z-50 min-w-[120px] overflow-hidden"
            style={{ padding: "4px" }}
          >
            {(["NGN", "USD", "GBP"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-left transition-colors"
                style={{
                  background: c === value ? "rgba(0,0,0,0.06)" : "transparent",
                  color: "var(--ink)",
                  fontWeight: c === value ? 600 : 400,
                }}
                type="button"
              >
                <span className="w-4">{CURRENCY_LABELS[c].symbol}</span>
                <span>{CURRENCY_LABELS[c].name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
