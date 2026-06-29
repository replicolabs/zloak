"use client";
import { useState, useEffect, useCallback } from "react";
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft, Clock, BookOpen, Plus, Pencil, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Currency, CURRENCY_LABELS } from "@/components/ui/CurrencySelector";
import Skeleton from "@/components/ui/Skeleton";
import SendModal from "@/components/modals/SendModal";
import ReceiveModal from "@/components/modals/ReceiveModal";
import AccountSheet from "@/components/modals/AccountSheet";
import SendProgress, { Phase } from "@/components/modals/SendProgress";
import ContactModal from "@/components/modals/ContactModal";
import DeleteContactModal from "@/components/modals/DeleteContactModal";
import { executeTransfer } from "@/lib/transfer";
import { STELLAR_EXPERT_TESTNET } from "@/lib/constants";

interface Contact { _id: string; name: string; stellarAddress: string; }
interface Transfer { _id: string; recipientAddress: string; recipientName: string | null; originalAmount: number; originalCurrency: string; usdcAmount: number; status: string; createdAt: string; withdrawTxHashes: string[]; }

type Tab = "recent" | "contacts";
type Modal = null | "send" | "receive" | "account";

interface WalletHomeProps {
  address: string;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onDisconnect: () => void;
}

const SYMBOL: Record<string, string> = { NGN: "₦", GBP: "£", USD: "$" };

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    try { return JSON.stringify(obj); } catch { /* ignore */ }
  }
  return String(e);
}

function TransferRow({ t }: { t: Transfer }) {
  const [copied, setCopied] = useState(false);
  const hash = t.withdrawTxHashes?.[0];

  const copyHash = async () => {
    if (!hash) return;
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <li className="glass glass-md px-4 py-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate capitalize" style={{ color: "var(--ink)" }}>
          {t.recipientName ?? `${t.recipientAddress.slice(0,6)}…${t.recipientAddress.slice(-4)}`}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>{relativeTime(t.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold tabular" style={{ color: "var(--ink)" }}>
          {SYMBOL[t.originalCurrency] ?? ""}{t.originalAmount.toLocaleString()}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)", fontWeight: t.status === "failed" ? 600 : 400 }}>
          {t.status === "completed" ? "Sent" : t.status === "failed" ? "Failed" : "Pending"}
        </p>
      </div>
      {hash && (
        <div className="flex gap-1 flex-shrink-0">
          <a
            href={`${STELLAR_EXPERT_TESTNET}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full"
            style={{ width: 28, height: 28, background: "rgba(0,0,0,0.06)", color: "var(--ink-soft)" }}
          >
            <ExternalLink size={12} />
          </a>
          <button
            onClick={copyHash}
            className="flex items-center justify-center rounded-full"
            style={{ width: 28, height: 28, background: "rgba(0,0,0,0.06)", color: "var(--ink-soft)" }}
          >
            <AnimatePresence mode="wait">
              {copied
                ? <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={12} /></motion.div>
                : <motion.div key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy size={12} /></motion.div>
              }
            </AnimatePresence>
          </button>
        </div>
      )}
    </li>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

export default function WalletHome({ address, currency, onCurrencyChange, onDisconnect }: WalletHomeProps) {
  const [tab, setTab] = useState<Tab>("recent");
  const [modal, setModal] = useState<Modal>(null);

  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [displayBalance, setDisplayBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactModal, setContactModal] = useState<{ mode: "add" | "edit"; contact?: Contact } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Contact | null>(null);

  const [sendPhase, setSendPhase] = useState<Phase>("preparing");
  const [sendError, setSendError] = useState<string | undefined>();
  const [withdrawHashes, setWithdrawHashes] = useState<string[]>([]);
  const [sendProgressOpen, setSendProgressOpen] = useState(false);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/balance?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      setUsdcBalance(typeof data.usdc === "number" ? data.usdc : 0);
    } catch { setUsdcBalance(0); }
    setBalanceLoading(false);
  }, [address]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  useEffect(() => {
    if (usdcBalance === null) return;
    if (currency === "USD") { setDisplayBalance(usdcBalance.toFixed(2)); return; }
    fetch(`/api/fx?from=${currency}&amount=1`)
      .then(r => r.json())
      .then(data => {
        const rate = data[currency];
        if (rate) setDisplayBalance((usdcBalance * rate).toLocaleString("en-NG", { maximumFractionDigits: 0 }));
      })
      .catch(() => setDisplayBalance(usdcBalance.toFixed(2)));
  }, [usdcBalance, currency]);

  const loadTransfers = useCallback(async () => {
    setTransfersLoading(true);
    try {
      const res = await fetch(`/api/transfers?wallet=${address}&limit=20`);
      const data = await res.json();
      const list: Transfer[] = Array.isArray(data) ? data : [];

      const TEN_MIN = 10 * 60 * 1000;
      const stale = list.filter(
        t => t.status === "pending" && Date.now() - new Date(t.createdAt).getTime() > TEN_MIN
      );
      if (stale.length > 0) {
        await Promise.all(stale.map(t =>
          fetch("/api/transfers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: t._id, status: "failed", errorMessage: "Transfer was interrupted — if USDC was deducted, check your pending notes." }),
          })
        ));
        const res2 = await fetch(`/api/transfers?wallet=${address}&limit=20`);
        const data2 = await res2.json();
        setTransfers(Array.isArray(data2) ? data2 : []);
      } else {
        setTransfers(list);
      }
    } catch { setTransfers([]); }
    setTransfersLoading(false);
  }, [address]);

  useEffect(() => { loadTransfers(); }, [loadTransfers]);

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/contacts?wallet=${address}`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch { setContacts([]); }
    setContactsLoading(false);
  }, [address]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const signWithKit = async (xdr: string): Promise<string> => {
    const { StellarWalletsKit } = await import("@/lib/walletKit");
    const result = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    if (!result.signedTxXdr) throw new Error("Transaction signing was cancelled");
    return result.signedTxXdr;
  };

  const handleSend = useCallback(async (params: { recipientAddress: string; recipientName: string | null; amountUsdc: number; currency: Currency; originalAmount: number }) => {
    setModal(null);
    const noteCount = Math.max(1, Math.ceil(params.amountUsdc));
    setSendPhase("preparing");
    setSendError(undefined);
    setWithdrawHashes([]);
    setSendProgressOpen(true);

    let transferId: string | null = null;
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderWallet: address,
          recipientAddress: params.recipientAddress,
          recipientName: params.recipientName,
          originalAmount: params.originalAmount,
          originalCurrency: params.currency,
          usdcAmount: params.amountUsdc,
          noteCount,
        }),
      });
      const rec = await res.json();
      transferId = rec._id;
    } catch {}

    try {
      const hashes = await executeTransfer({
        senderWallet: address,
        recipientAddress: params.recipientAddress,
        noteCount,
        signTransaction: signWithKit,
        onStep: (idx, label, status) => {
          if (label.includes("Generating ZK proof") && status === "pending") {
            setSendPhase("generating-proof");
          } else if (label.includes("Withdrawing") && status === "pending") {
            setSendPhase("settling");
          } else if (label.includes("Depositing") && status === "pending") {
            setSendPhase("preparing");
          } else if (status === "done" && idx > 0) {
          }
        },
      });
      setWithdrawHashes(hashes);
      setSendPhase("done");
      if (transferId) {
        await fetch("/api/transfers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: transferId, status: "completed", withdrawTxHash: hashes[0] }) });
      }
      await loadBalance();
      await loadTransfers();
    } catch (e) {
      setSendPhase("error");
      setSendError(getErrorMessage(e));
      if (transferId) {
        await fetch("/api/transfers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: transferId, status: "failed", errorMessage: getErrorMessage(e) }) });
      }
    }
  }, [address, loadBalance, loadTransfers]);

  const saveContact = async (name: string, stellarAddress: string): Promise<{ error?: string }> => {
    try {
      const existing = contactModal?.contact;
      if (existing) {
        const res = await fetch(`/api/contacts/${existing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address, name, stellarAddress }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error };
        setContacts(prev => prev.map(c => c._id === existing._id ? data : c).sort((a,b)=>a.name.localeCompare(b.name)));
      } else {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address, name, stellarAddress }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error };
        setContacts(prev => [...prev, data].sort((a,b)=>a.name.localeCompare(b.name)));
      }
      return {};
    } catch { return { error: "Network error" }; }
  };

  const deleteContact = async (c: Contact) => {
    await fetch(`/api/contacts/${c._id}?wallet=${address}`, { method: "DELETE" });
    setContacts(prev => prev.filter(x => x._id !== c._id));
  };

  return (
    <>
      <div
        className="flex flex-col h-full"
        style={{ maxWidth: 420, width: "100%", margin: "0 auto", position: "relative", zIndex: 1 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 16 H33"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
            <circle cx="28.5" cy="19.5" r="1.8" fill="currentColor"/>
            <circle cx="25.5" cy="22.5" r="1.8" fill="currentColor"/>
            <circle cx="22.5" cy="25.5" r="1.8" fill="currentColor"/>
            <circle cx="19.5" cy="28.5" r="1.8" fill="currentColor"/>
            <path d="M15 32 H33"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"/>
          </svg>
            <span className="font-bold text-sm tracking-tight" style={{ color: "var(--ink)" }}>zloak</span>
          </div>
          <button
            onClick={() => setModal("account")}
            className="flex items-center justify-center rounded-full touch"
            style={{ width: 36, height: 36, background: "rgba(0,0,0,0.06)", color: "var(--ink)" }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
        <div className="px-5 py-6 text-center">
          {balanceLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton width={160} height={48} className="rounded-xl mx-auto" />
              <Skeleton width={80} height={16} className="rounded-lg mx-auto" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-bold tabular leading-none" style={{ fontSize: 48, color: "var(--ink)", letterSpacing: "-2px" }}>
                <span style={{ fontSize: 28 }}>{CURRENCY_LABELS[currency].symbol}</span>
                {displayBalance ?? "0"}
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: "var(--ink-soft)" }}>Available balance</p>
            </motion.div>
          )}
        </div>
        <div className="px-5 flex gap-3">
          <button
            onClick={() => setModal("send")}
            className="glass glass-pill flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold touch"
            style={{ color: "var(--ink)" }}
          >
            <ArrowUpRight size={16} />
            Send
          </button>
          <button
            onClick={() => setModal("receive")}
            className="glass glass-pill flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold touch"
            style={{ color: "var(--ink)" }}
          >
            <ArrowDownLeft size={16} />
            Receive
          </button>
        </div>
        <div className="px-5 pt-6 pb-2">
          <div className="glass glass-pill flex p-1" style={{ display: "inline-flex", width: "100%" }}>
            {(["recent", "contacts"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-sm font-medium rounded-full transition-all touch relative"
                style={{ color: tab === t ? "var(--ink)" : "var(--ink-soft)" }}
              >
                {tab === t && (
                  <motion.div layoutId="tabPill" className="absolute inset-0 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative flex items-center justify-center gap-1.5">
                  {t === "recent" ? <Clock size={13} /> : <BookOpen size={13} />}
                  {t === "recent" ? "Recent" : "Address book"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <AnimatePresence mode="wait">
            {tab === "recent" && (
              <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {transfersLoading ? (
                  <div className="space-y-3 pt-2">
                    {[1,2,3].map(i => <Skeleton key={i} height={60} className="rounded-2xl" />)}
                  </div>
                ) : transfers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Clock size={28} style={{ color: "rgba(0,0,0,0.2)" }} />
                    <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No recent transactions</p>
                  </div>
                ) : (
                  <ul className="space-y-2 pt-2">
                    {transfers.map(t => (
                      <TransferRow key={t._id} t={t} />
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {tab === "contacts" && (
              <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="flex justify-end pt-2 pb-1">
                  <button
                    onClick={() => setContactModal({ mode: "add" })}
                    className="glass glass-pill flex items-center gap-1.5 px-3 py-2 text-xs font-medium touch"
                    style={{ color: "var(--ink)" }}
                  >
                    <Plus size={13} /> Add contact
                  </button>
                </div>

                {contactsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} height={60} className="rounded-2xl" />)}
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <BookOpen size={28} style={{ color: "rgba(0,0,0,0.2)" }} />
                    <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No contacts yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {contacts.map(c => (
                      <li key={c._id} className="glass glass-md px-4 py-3 flex items-center gap-3 group">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium capitalize" style={{ color: "var(--ink)" }}>{c.name}</p>
                          <p className="text-xs font-mono mt-0.5 truncate" style={{ color: "var(--ink-soft)" }}>{c.stellarAddress.slice(0,8)}…{c.stellarAddress.slice(-6)}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => setContactModal({ mode: "edit", contact: c })} className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "rgba(0,0,0,0.06)", color: "var(--ink-soft)" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteModal(c)} className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: "rgba(0,0,0,0.06)", color: "var(--ink-soft)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <SendModal
        open={modal === "send"}
        onClose={() => setModal(null)}
        walletAddress={address}
        onSend={handleSend}
      />
      <ReceiveModal open={modal === "receive"} onClose={() => setModal(null)} address={address} />
      <AccountSheet open={modal === "account"} onClose={() => setModal(null)} address={address} currency={currency} onCurrencyChange={onCurrencyChange} onDisconnect={onDisconnect} />
      <SendProgress
        open={sendProgressOpen}
        phase={sendPhase}
        errorMessage={sendError}
        withdrawHashes={withdrawHashes}
        onDismiss={() => setSendProgressOpen(false)}
      />
      <ContactModal
        open={!!contactModal}
        onClose={() => setContactModal(null)}
        onSave={saveContact}
        initial={contactModal?.contact ? { name: contactModal.contact.name, stellarAddress: contactModal.contact.stellarAddress } : undefined}
        mode={contactModal?.mode ?? "add"}
      />
      <DeleteContactModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onDelete={() => deleteContact(deleteModal!)}
        name={deleteModal?.name ?? ""}
      />
    </>
  );
}
