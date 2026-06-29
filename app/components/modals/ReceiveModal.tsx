"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import GlassModal from "@/components/ui/GlassModal";

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
}

export default function ReceiveModal({ open, onClose, address }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const short = address ? `${address.slice(0, 6)}…${address.slice(-6)}` : "";

  return (
    <GlassModal open={open} onClose={onClose} title="Receive">
      <div className="flex flex-col items-center gap-6">
        <div
          className="glass glass-md flex items-center justify-center"
          style={{ padding: 20 }}
        >
          {address && (
            <QRCodeSVG
              value={address}
              size={200}
              bgColor="transparent"
              fgColor="var(--ink)"
              level="M"
            />
          )}
        </div>
        <p className="font-mono text-sm text-center break-all" style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
          {address}
        </p>
        <button
          onClick={copy}
          className="glass glass-pill touch flex items-center gap-2 px-5 py-2.5 text-sm font-medium w-full justify-center"
          style={{ color: "var(--ink)" }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Check size={15} /> Copied
              </motion.span>
            ) : (
              <motion.span key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Copy size={15} /> Copy address
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </GlassModal>
  );
}
