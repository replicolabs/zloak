"use client";
import { useRef, useState, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface SlideToSendProps {
  onComplete: () => void;
  disabled?: boolean;
  label?: string;
}

export default function SlideToSend({ onComplete, disabled, label = "Slide to send" }: SlideToSendProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  const KNOB = 52;
  const PADDING = 4;

  const trackWidth = () => (trackRef.current?.offsetWidth ?? 280) - KNOB - PADDING * 2;

  const opacity = useTransform(x, [0, trackWidth()], [1, 0]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    const tw = trackWidth();
    if (x.get() >= tw * 0.85) {
      animate(x, tw, { duration: 0.15, ease: "easeOut", onComplete: () => {
        setDone(true);
        setTimeout(onComplete, 200);
      }});
    } else {
      animate(x, 0, { duration: 0.3, ease: "easeOut" });
    }
  }, [onComplete, x]);

  return (
    <div
      ref={trackRef}
      className="glass glass-pill touch relative select-none overflow-hidden"
      style={{
        height: 60, padding: PADDING,
        background: done ? "rgba(0,0,0,0.08)" : "var(--glass-fill)",
        cursor: disabled ? "not-allowed" : undefined,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <motion.span
        style={{ opacity, color: "var(--ink-soft)" }}
        className="absolute inset-0 flex items-center justify-center text-sm font-medium pointer-events-none"
      >
        {label}
      </motion.span>
      <motion.div
        drag={disabled || done ? false : "x"}
        dragConstraints={{ left: 0, right: trackWidth() }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x, width: KNOB, height: KNOB, touchAction: "none" }}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        className="relative z-10 flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        animate={done ? { scale: [1, 1.1, 1] } : {}}
      >
        <div
          className="flex items-center justify-center rounded-full shadow-md"
          style={{ width: KNOB, height: KNOB, background: "var(--ink)" }}
        >
          {done
            ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <ArrowRight size={18} color="white" />
          }
        </div>
      </motion.div>
    </div>
  );
}
