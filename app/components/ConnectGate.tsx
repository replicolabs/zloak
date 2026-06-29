"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import Blobs from "@/components/ui/Blobs";
import { initKit, StellarWalletsKit } from "@/lib/walletKit";

interface ConnectGateProps {
  onConnected: (address: string) => void;
}

export default function ConnectGate({ onConnected }: ConnectGateProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { initKit(); }, []);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { address } = await StellarWalletsKit.authModal();
      onConnected(address);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message
        : typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message)
        : String(e);
      if (!msg || msg.toLowerCase().includes("close") || msg.toLowerCase().includes("cancel")) {
        setError("Connection cancelled.");
      } else {
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5"
      style={{ background: "var(--surface)" }}
    >
      <Blobs />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass glass-lg w-full flex flex-col items-center gap-6 px-7 py-10"
        style={{ maxWidth: 380, position: "relative", zIndex: 1 }}
      >
        <div className="flex flex-col items-center gap-2">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="42" height="42" rx="13" fill="currentColor"/>
            <path d="M15 16 H33" stroke="var(--surface, #F2F2F3)" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="28.5" cy="19.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <circle cx="25.5" cy="22.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <circle cx="22.5" cy="25.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <circle cx="19.5" cy="28.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <path d="M15 32 H33" stroke="var(--surface, #F2F2F3)" strokeWidth="3.5" strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--ink)", letterSpacing: "-0.5px" }}>
            zloak
          </span>
          <p className="text-xs text-center" style={{ color: "var(--ink-soft)" }}>
            Private cross-border remittance on Stellar
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="glass glass-md w-full px-4 py-3"
          >
            <p className="text-sm" style={{ color: "var(--ink)" }}>{error}</p>
          </motion.div>
        )}

        <button
          onClick={connect}
          disabled={connecting}
          className="glass-pill w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-semibold touch transition-opacity disabled:opacity-60"
          style={{ background: "var(--ink)", color: "white", borderRadius: 9999 }}
        >
          {connecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }}
              />
              Connecting…
            </>
          ) : (
            <>
              <Wallet size={16} />
              Connect Wallet
            </>
          )}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--ink-soft)", lineHeight: 1.5 }}>
          Non-custodial. Zero-knowledge proofs keep transfers private.
        </p>
      </motion.div>
    </div>
  );
}
