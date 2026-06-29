"use client";

import { useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        disabled={disabled}
        placeholder={placeholder ?? 'Try "send ₦50,000 to mama" or "transfer $20 to GABC..."'}
        className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-sm focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex items-center justify-center w-8 h-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-xl transition-all"
      >
        {disabled ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
      </button>
    </div>
  );
}
