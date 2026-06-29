"use client";
import { useState, useEffect } from "react";
import GlassModal from "@/components/ui/GlassModal";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, address: string) => Promise<{ error?: string }>;
  initial?: { name: string; stellarAddress: string };
  mode: "add" | "edit";
}

function isValidStellarAddress(addr: string) {
  return /^G[A-Z2-7]{55}$/.test(addr.trim());
}

export default function ContactModal({ open, onClose, onSave, initial, mode }: ContactModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.stellarAddress ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(initial?.name ?? ""); setAddress(initial?.stellarAddress ?? ""); setError(null); }
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!isValidStellarAddress(address)) { setError("Enter a valid Stellar address (starts with G)"); return; }
    setSaving(true);
    setError(null);
    const result = await onSave(name.trim(), address.trim());
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onClose();
  };

  return (
    <GlassModal open={open} onClose={onClose} title={mode === "add" ? "Add contact" : "Edit contact"} variant="center">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink-soft)" }}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. mama"
            className="glass glass-md w-full px-4 py-3 text-sm focus:outline-none"
            style={{ color: "var(--ink)" }}
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink-soft)" }}>Stellar address</label>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="G…"
            className="glass glass-md w-full px-4 py-3 text-sm font-mono focus:outline-none"
            style={{ color: "var(--ink)" }}
          />
          {address && !isValidStellarAddress(address) && (
            <p className="text-xs mt-1.5" style={{ color: "var(--ink-soft)" }}>Must start with G and be 56 characters</p>
          )}
        </div>

        {error && <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="glass glass-pill flex-1 py-3 text-sm font-medium touch"
            style={{ color: "var(--ink-soft)" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim() || !isValidStellarAddress(address)}
            className="glass glass-pill flex-1 py-3 text-sm font-medium touch disabled:opacity-40"
            style={{ background: "var(--ink)", color: "white", border: "none" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
