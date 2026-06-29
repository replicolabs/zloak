"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";

interface SplashProps {
  onDone: () => void;
}

export default function Splash({ onDone }: SplashProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "var(--surface)" }}
    >
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ position: "absolute", inset: 0 }}
        >
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="2"
          />
          <motion.circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52 * 0.28} ${2 * Math.PI * 52 * 0.72}`}
            style={{ transformOrigin: "60px 60px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center gap-1"
        >
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="42" height="42" rx="13" fill="currentColor"/>
            <path d="M15 16 H33"
                  stroke="var(--surface, #F2F2F3)"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
            <circle cx="28.5" cy="19.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <circle cx="25.5" cy="22.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <circle cx="22.5" cy="25.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <circle cx="19.5" cy="28.5" r="1.8" fill="var(--surface, #F2F2F3)"/>
            <path d="M15 32 H33"
                  stroke="var(--surface, #F2F2F3)"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-sm tracking-tight" style={{ color: "var(--ink)", letterSpacing: "-0.5px" }}>
            zloak
          </span>
        </motion.div>
      </div>
    </div>
  );
}
