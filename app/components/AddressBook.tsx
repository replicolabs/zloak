"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, Users, X } from "lucide-react";

interface Contact {
  _id: string;
  name: string;
  stellarAddress: string;
}

interface AddressBookProps {
  walletAddress: string;
}

export default function AddressBook({ walletAddress }: AddressBookProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?wallet=${walletAddress}`);
      const data = await res.json();
      setContacts(data);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const addContact = async () => {
    if (!newName.trim() || !newAddress.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, name: newName.trim(), stellarAddress: newAddress.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setContacts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewAddress("");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  const deleteContact = async (id: string) => {
    await fetch(`/api/contacts/${id}?wallet=${walletAddress}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Users size={18} />
          Address Book
          <span className="text-xs text-gray-400 font-normal">({contacts.length})</span>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {showAdd ? <X size={14} /> : <UserPlus size={14} />}
          {showAdd ? "Cancel" : "Add contact"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (e.g. mama)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Stellar address (G...)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={addContact}
            disabled={adding || !newName.trim() || !newAddress.trim()}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-all"
          >
            {adding ? "Adding…" : "Add Contact"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-4">Loading…</div>
      ) : contacts.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-6">
          No contacts yet. Add someone to get started.
        </div>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li key={c._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 group">
              <div>
                <p className="text-white text-sm font-medium capitalize">{c.name}</p>
                <p className="text-gray-500 text-xs font-mono">
                  {c.stellarAddress.slice(0, 8)}…{c.stellarAddress.slice(-6)}
                </p>
              </div>
              <button
                onClick={() => deleteContact(c._id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
