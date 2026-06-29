"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { STELLAR_EXPERT_TESTNET } from "@/lib/constants";

interface Transfer {
  _id: string;
  recipientAddress: string;
  recipientName: string | null;
  originalAmount: number;
  originalCurrency: string;
  usdcAmount: number;
  noteCount: number;
  depositTxHashes: string[];
  withdrawTxHashes: string[];
  status: "pending" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
}

interface TransferHistoryProps {
  walletAddress: string;
  refreshKey?: number;
}

const statusIcon = {
  pending: <Loader2 size={14} className="text-yellow-400 animate-spin" />,
  completed: <CheckCircle size={14} className="text-emerald-400" />,
  failed: <XCircle size={14} className="text-red-400" />,
};

const currencySymbol: Record<string, string> = { USD: "$", GBP: "£", NGN: "₦" };

export default function TransferHistory({ walletAddress, refreshKey = 0 }: TransferHistoryProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transfers?wallet=${walletAddress}&limit=20`);
      const data = await res.json();
      setTransfers(data);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers, refreshKey]);

  if (loading) return <div className="text-gray-500 text-sm text-center py-6">Loading transfers…</div>;
  if (transfers.length === 0) return <div className="text-gray-500 text-sm text-center py-6">No transfers yet.</div>;

  return (
    <ul className="space-y-3">
      {transfers.map((t) => (
        <li key={t._id} className="bg-white/5 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon[t.status]}
              <span className="text-white text-sm font-medium">
                {currencySymbol[t.originalCurrency] ?? ""}{t.originalAmount.toLocaleString()} {t.originalCurrency}
              </span>
              <span className="text-gray-500 text-xs">({t.usdcAmount} USDC)</span>
            </div>
            <span className="text-gray-500 text-xs">
              <Clock size={10} className="inline mr-1" />
              {new Date(t.createdAt).toLocaleDateString()}
            </span>
          </div>

          <p className="text-gray-400 text-xs">
            To:{" "}
            <span className="text-gray-300">
              {t.recipientName ? (
                <><span className="capitalize">{t.recipientName}</span>{" "}
                <span className="font-mono text-gray-500">
                  ({t.recipientAddress.slice(0, 6)}…{t.recipientAddress.slice(-4)})
                </span></>
              ) : (
                <span className="font-mono">{t.recipientAddress.slice(0, 8)}…{t.recipientAddress.slice(-6)}</span>
              )}
            </span>
          </p>

          {t.errorMessage && (
            <p className="text-red-400 text-xs">{t.errorMessage}</p>
          )}

          {t.withdrawTxHashes.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {t.withdrawTxHashes.map((hash) => (
                <a
                  key={hash}
                  href={`${STELLAR_EXPERT_TESTNET}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <ExternalLink size={10} />
                  {hash.slice(0, 8)}…
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
