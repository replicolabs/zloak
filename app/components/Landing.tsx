"use client";
import { motion } from "framer-motion";
import Blobs from "@/components/ui/Blobs";

interface LandingProps {
  onLaunch: () => void;
}

function PhoneMockup() {
  return (
    <div
      className="glass glass-lg overflow-hidden select-none pointer-events-none"
      style={{ width: 220, height: 420, position: "relative", flexShrink: 0 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 16 H33"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
            <circle cx="28.5" cy="19.5" r="1.8" fill="currentColor"/>
            <circle cx="25.5" cy="22.5" r="1.8" fill="currentColor"/>
            <circle cx="22.5" cy="25.5" r="1.8" fill="currentColor"/>
            <circle cx="19.5" cy="28.5" r="1.8" fill="currentColor"/>
            <path d="M15 32 H33"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.3px" }}>zloak</span>
        </div>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.06)" }} />
      </div>

      <div className="text-center py-5 px-4">
        <p style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)", letterSpacing: "-2px", lineHeight: 1 }}>
          <span style={{ fontSize: 22 }}>₦</span>84,320
        </p>
        <p style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 4 }}>Available balance</p>
      </div>

      <div className="flex gap-2 px-4">
        {["Send", "Receive"].map(label => (
          <div key={label} className="glass glass-pill flex-1 flex items-center justify-center py-2" style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>
            {label}
          </div>
        ))}
      </div>

      <div className="px-4 mt-5">
        <div className="glass glass-pill flex p-0.5">
          {["Recent", "Address book"].map((t, i) => (
            <div
              key={t}
              className="flex-1 text-center py-1.5 rounded-full"
              style={{ fontSize: 9, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "var(--ink)" : "var(--ink-soft)", background: i === 0 ? "rgba(0,0,0,0.07)" : "transparent" }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-2">
        {[
          { name: "Mama", amount: "₦50,000", sub: "2m ago" },
          { name: "Chidi", amount: "₦12,500", sub: "Yesterday" },
          { name: "GBCU…X4F2", amount: "₦8,000", sub: "3d ago" },
        ].map(item => (
          <div key={item.name} className="glass glass-md flex items-center justify-between px-3 py-2.5">
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--ink)" }}>{item.name}</p>
              <p style={{ fontSize: 9, color: "var(--ink-soft)", marginTop: 1 }}>{item.sub}</p>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ink)" }}>{item.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing({ onLaunch }: LandingProps) {
  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center"
      style={{ background: "var(--surface)" }}
    >
      <Blobs />

      <div
        className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-center gap-12 px-6 lg:px-16"
        style={{ maxWidth: 1100, margin: "0 auto" }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 lg:max-w-[460px] text-center lg:text-left"
        >
          <div className="flex items-center gap-2 justify-center lg:justify-start">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 16 H33"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
            <circle cx="28.5" cy="19.5" r="1.8" fill="currentColor"/>
            <circle cx="25.5" cy="22.5" r="1.8" fill="currentColor"/>
            <circle cx="22.5" cy="25.5" r="1.8" fill="currentColor"/>
            <circle cx="19.5" cy="28.5" r="1.8" fill="currentColor"/>
            <path d="M15 32 H33"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
          </svg>
            <span style={{ fontWeight: 800, fontSize: 20, color: "var(--ink)", letterSpacing: "-0.5px" }}>zloak</span>
          </div>

          <div>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "clamp(32px, 5vw, 56px)",
                color: "var(--ink)",
                letterSpacing: "-2px",
                lineHeight: 1.05,
              }}
            >
              Send money home,{" "}
              <span style={{ color: "var(--ink-soft)" }}>privately.</span>
            </h1>
            <p className="mt-4 text-base" style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              USDC remittance on Stellar with zero-knowledge proofs. Nobody can link sender and receiver. Yes NOBODY.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {["ZK private", "Instant", "Cross-border", "Non-custodial"].map(tag => (
              <span
                key={tag}
                className="glass glass-pill px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--ink-soft)" }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <button
              onClick={onLaunch}
              className="glass-pill px-8 py-3.5 text-sm font-semibold touch transition-all cursor-pointer active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "white", borderRadius: 9999, letterSpacing: "-0.2px" }}
            >
              Launch app
            </button>
            <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
              Stellar testnet
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,0,0,0.3)", lineHeight: 1.5 }}>
            Only USDC is supported at this time.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="hidden sm:flex flex-col items-center"
          style={{ flexShrink: 0 }}
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </div>
  );
}
