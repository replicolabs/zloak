"use client";
import { useEffect, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface GlassModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  variant?: "sheet" | "center";
  hideClose?: boolean;
  protected?: boolean;
}

export default function GlassModal({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  hideClose,
  protected: isProtected,
}: GlassModalProps) {
  const handleClose = useCallback(() => {
    if (isProtected || !onClose) return;
    onClose();
  }, [isProtected, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            display: "flex",
            alignItems: variant === "sheet" ? "flex-end" : "center",
            justifyContent: "center",
            padding: variant === "sheet" ? 0 : "16px",
            background: "rgba(0,0,0,0.18)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        >
          <motion.div
            key="panel"
            initial={variant === "sheet" ? { y: "100%", opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={variant === "sheet" ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={variant === "sheet" ? { y: "100%", opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass"
            style={{
              width: "min(100%, 460px)",
              maxHeight: "90svh",
              overflowY: "auto",
              borderRadius: variant === "sheet" ? "24px 24px 0 0" : 24,
              flexShrink: 0,
            }}
          >
            {(title || (!hideClose && onClose)) && (
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                {title
                  ? <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>{title}</h2>
                  : <div />
                }
                {!hideClose && onClose && !isProtected && (
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center rounded-full touch"
                    style={{ width: 32, height: 32, background: "rgba(0,0,0,0.06)", color: "var(--ink-soft)" }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className={title || (!hideClose && onClose) ? "px-6 pb-8" : "p-6"}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
