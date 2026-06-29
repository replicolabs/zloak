"use client";
import { motion } from "framer-motion";

interface SkeletonProps { className?: string; width?: string | number; height?: string | number; }

export default function Skeleton({ className = "", width, height = 16 }: SkeletonProps) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      className={`rounded-lg ${className}`}
      style={{
        width: width ?? "100%",
        height,
        background: "rgba(0,0,0,0.08)",
      }}
    />
  );
}
