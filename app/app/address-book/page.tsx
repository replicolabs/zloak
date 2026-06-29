"use client";

import { useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";
import AddressBook from "@/components/AddressBook";

export default function AddressBookPage() {
  const [walletKey, setWalletKey] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" />
            <span className="font-bold tracking-tight">zloak</span>
          </div>
        </div>
        <WalletConnect
          publicKey={walletKey}
          onConnect={setWalletKey}
          onDisconnect={() => setWalletKey(null)}
        />
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        {!walletKey ? (
          <p className="text-gray-500 text-center py-16 text-sm">Connect your wallet to view your address book.</p>
        ) : (
          <AddressBook walletAddress={walletKey} />
        )}
      </main>
    </div>
  );
}
