"use client";

import { CheckCircle, XCircle, Loader2, ExternalLink, Shield } from "lucide-react";
import { STELLAR_EXPERT_TESTNET } from "@/lib/constants";

export type StepStatus = "idle" | "pending" | "done" | "error";

export interface TransferStep {
  label: string;
  status: StepStatus;
  txHash?: string;
  detail?: string;
}

interface TxStatusProps {
  steps: TransferStep[];
  totalNotes: number;
  currentNote: number;
}

const stepIcon = {
  idle: <div className="w-4 h-4 rounded-full border border-gray-600" />,
  pending: <Loader2 size={16} className="text-yellow-400 animate-spin" />,
  done: <CheckCircle size={16} className="text-emerald-400" />,
  error: <XCircle size={16} className="text-red-400" />,
};

export default function TxStatus({ steps, totalNotes, currentNote }: TxStatusProps) {
  if (steps.length === 0) return null;

  const allDone = steps.every((s) => s.status === "done");
  const hasFailed = steps.some((s) => s.status === "error");

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <Shield size={16} className="text-emerald-400" />
          Private Transfer
        </div>
        {totalNotes > 1 && (
          <span className="text-xs text-gray-400">
            Note {currentNote} of {totalNotes}
          </span>
        )}
      </div>

      <ul className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">{stepIcon[step.status]}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.status === "error" ? "text-red-400" : step.status === "done" ? "text-gray-300" : "text-white"}`}>
                {step.label}
              </p>
              {step.detail && <p className="text-xs text-gray-500 mt-0.5">{step.detail}</p>}
              {step.txHash && (
                <a
                  href={`${STELLAR_EXPERT_TESTNET}/tx/${step.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1"
                >
                  <ExternalLink size={10} />
                  {step.txHash.slice(0, 10)}…{step.txHash.slice(-6)}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      {allDone && (
        <div className="border-t border-white/10 pt-3 text-xs text-gray-500">
          Transfer complete. The sender and recipient are unlinkable onchain.
        </div>
      )}
      {hasFailed && (
        <div className="border-t border-white/10 pt-3 text-xs text-red-400">
          Transfer failed. Check the error above and try again.
        </div>
      )}
    </div>
  );
}
