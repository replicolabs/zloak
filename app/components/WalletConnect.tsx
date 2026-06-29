"use client";

import { useState, useEffect } from "react";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

interface WalletConnectProps {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
  publicKey: string | null;
}

export default function WalletConnect({ onConnect, onDisconnect, publicKey }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { isConnected, getAddress } = await import("@stellar/freighter-api");
        const connected = await isConnected();
        if (connected.isConnected) {
          const result = await getAddress();
          if (result.address) onConnect(result.address);
        }
      } catch {
      }
    })();
  }, [onConnect]);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { isConnected, requestAccess, getAddress } = await import("@stellar/freighter-api");
      const connected = await isConnected();
      if (!connected.isConnected) {
        setError("Freighter wallet not found. Install it from freighter.app");
        return;
      }
      await requestAccess();
      const result = await getAddress();
      if (!result.address) throw new Error("No address returned from Freighter");
      onConnect(result.address);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const shortKey = (key: string) => `${key.slice(0, 4)}...${key.slice(-4)}`;

  if (publicKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          {shortKey(publicKey)}
          <ChevronDown size={14} />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50">
            <button
              onClick={() => { navigator.clipboard.writeText(publicKey); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-t-xl"
            >
              Copy address
            </button>
            <button
              onClick={() => { onDisconnect(); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 rounded-b-xl flex items-center gap-2"
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 rounded-xl text-white text-sm font-medium transition-all"
      >
        <Wallet size={16} />
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
