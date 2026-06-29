"use client";
import { useState } from "react";
import GlassModal from "@/components/ui/GlassModal";

interface DeleteContactModalProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  name: string;
}

export default function DeleteContactModal({ open, onClose, onDelete, name }: DeleteContactModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  };

  return (
    <GlassModal open={open} onClose={onClose} variant="center" hideClose>
      <div className="text-center space-y-4">
        <p className="font-semibold" style={{ color: "var(--ink)" }}>Delete contact?</p>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          <span className="font-medium capitalize" style={{ color: "var(--ink)" }}>{name}</span> will be removed from your address book.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="glass glass-pill flex-1 py-3 text-sm font-medium touch"
            style={{ color: "var(--ink-soft)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="glass glass-pill flex-1 py-3 text-sm font-medium touch disabled:opacity-40"
            style={{ background: "rgba(0,0,0,0.88)", color: "white", border: "none" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
