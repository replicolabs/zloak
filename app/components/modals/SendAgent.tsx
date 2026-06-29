"use client";
import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Currency } from "@/components/ui/CurrencySelector";

interface AgentResult {
  recipientAddress: string;
  recipientName: string | null;
  originalAmount: number;
  originalCurrency: string;
  usdcAmount: number;
  noteCount: number;
  transferPlan: string;
  error?: string;
  notFound?: boolean;
}

interface SendAgentProps {
  walletAddress: string;
  onConfirm: (params: { recipientAddress: string; recipientName: string | null; amountUsdc: number; currency: Currency; originalAmount: number }) => void;
  onBack: () => void;
}

export default function SendAgent({ walletAddress, onConfirm, onBack }: SendAgentProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    const text = message.trim();
    if (!text || loading) return;
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, senderWallet: walletAddress }),
      });
      const data: AgentResult = await res.json();
      if (!res.ok) {
        if (data.notFound) {
          setErrorMsg(`"${data.recipientName}" is not in your contacts. Add them first or use a raw Stellar address.`);
        } else {
          setErrorMsg(data.error ?? 'Could not parse instruction. Try: “send $20 to mama”');
        }
      } else {
        setResult(data);
      }
    } catch {
      setErrorMsg("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onConfirm({
      recipientAddress: result.recipientAddress,
      recipientName: result.recipientName,
      amountUsdc: result.usdcAmount,
      currency: result.originalCurrency as Currency,
      originalAmount: result.originalAmount,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
          Describe who to pay and how much in natural language.
        </p>
        <div className="glass glass-md flex items-center gap-3 px-4 py-3">
          <input
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder='e.g. "send ₦50,000 to mama"'
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--ink)" }}
            disabled={loading}
          />
          <button
            onClick={submit}
            disabled={loading || !message.trim()}
            className="flex items-center justify-center rounded-full disabled:opacity-40 transition-opacity"
            style={{ width: 32, height: 32, background: "var(--ink)", color: "white", flexShrink: 0 }}
          >
            {loading
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
              : <Send size={13} />
            }
          </button>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass glass-md px-4 py-3">
            <p className="text-sm" style={{ color: "var(--ink)" }}>{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass glass-md p-4 space-y-4">
            <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{result.transferPlan}</p>

            <div className="space-y-2 text-xs" style={{ color: "var(--ink-soft)" }}>
              <div className="flex justify-between">
                <span>To</span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }} className="capitalize">
                  {result.recipientName ?? `${result.recipientAddress.slice(0,8)}…${result.recipientAddress.slice(-6)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="tabular" style={{ color: "var(--ink)" }}>{result.originalAmount.toLocaleString()} {result.originalCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span>Will send</span>
                <span className="tabular" style={{ color: "var(--ink)", fontWeight: 500 }}>{result.noteCount} USDC</span>
              </div>
              {result.usdcAmount !== result.noteCount && (
                <div className="flex justify-end">
                  <span className="tabular" style={{ color: "var(--ink-soft)" }}>
                    ({result.usdcAmount.toFixed(4)} USDC, rounded up — pool transfers in whole USDC units)
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setResult(null); setMessage(""); }}
                className="glass glass-pill flex-1 py-2.5 text-xs font-medium touch"
                style={{ color: "var(--ink-soft)" }}
              >
                Edit
              </button>
              <button
                onClick={handleConfirm}
                className="glass-pill flex-1 py-2.5 text-xs font-medium touch"
                style={{ background: "var(--ink)", color: "white", borderRadius: 9999 }}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onBack} className="w-full text-center text-xs py-1 touch" style={{ color: "var(--ink-soft)" }}>Back</button>
    </div>
  );
}
