"use client";
import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CurrencySelector, { Currency, CURRENCY_LABELS } from "@/components/ui/CurrencySelector";
import SlideToSend from "@/components/ui/SlideToSend";

interface Contact { _id: string; name: string; stellarAddress: string; }

interface SendManualProps {
  walletAddress: string;
  onSend: (params: { recipientAddress: string; recipientName: string | null; amountUsdc: number; currency: Currency; originalAmount: number }) => void;
  onBack: () => void;
}

function isValidStellarAddress(addr: string) { return /^G[A-Z2-7]{55}$/.test(addr.trim()); }

export default function SendManual({ walletAddress, onSend, onBack }: SendManualProps) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [rawAmount, setRawAmount] = useState("");
  const [usdcEquiv, setUsdcEquiv] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const [recipientMode, setRecipientMode] = useState<"book" | "address">("book");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [rawAddress, setRawAddress] = useState("");

  useEffect(() => {
    setLoadingContacts(true);
    fetch(`/api/contacts?wallet=${walletAddress}`)
      .then(r => r.json())
      .then(d => { setContacts(Array.isArray(d) ? d : []); setLoadingContacts(false); })
      .catch(() => setLoadingContacts(false));
  }, [walletAddress]);

  useEffect(() => {
    const num = parseFloat(rawAmount);
    if (!num || isNaN(num)) { setUsdcEquiv(null); return; }
    if (currency === "USD") { setUsdcEquiv(num); return; }
    setRateLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fx?from=${currency}&amount=${num}`);
        const data = await res.json();
        setUsdcEquiv(parseFloat((num / data[currency]).toFixed(6)));
      } catch { setUsdcEquiv(null); }
      setRateLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [rawAmount, currency]);

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.stellarAddress.includes(search));

  const recipient = recipientMode === "book" ? selected : null;
  const recipientAddr = recipientMode === "book" ? selected?.stellarAddress : rawAddress;
  const recipientName = recipientMode === "book" ? selected?.name ?? null : null;
  const canSend = !!usdcEquiv && usdcEquiv > 0 && !!recipientAddr && isValidStellarAddress(recipientAddr ?? "");

  const handleSend = useCallback(() => {
    if (!canSend || !usdcEquiv || !recipientAddr) return;
    onSend({
      recipientAddress: recipientAddr,
      recipientName,
      amountUsdc: usdcEquiv,
      currency,
      originalAmount: parseFloat(rawAmount),
    });
  }, [canSend, usdcEquiv, recipientAddr, recipientName, currency, rawAmount, onSend]);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: "var(--ink-soft)" }}>Amount</label>
        <div className="flex items-center gap-3">
          <CurrencySelector value={currency} onChange={c => { setCurrency(c); setRawAmount(""); setUsdcEquiv(null); }} />
          <input
            type="number"
            inputMode="decimal"
            value={rawAmount}
            onChange={e => setRawAmount(e.target.value)}
            placeholder="0"
            className="glass glass-md flex-1 px-4 py-3 text-lg font-semibold tabular focus:outline-none min-w-0"
            style={{ color: "var(--ink)" }}
          />
        </div>
        <div className="mt-1.5 pl-1 min-h-[20px]">
          <AnimatePresence mode="wait">
            {rateLoading && (
              <motion.p key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs" style={{ color: "var(--ink-soft)" }}>Converting…</motion.p>
            )}
            {!rateLoading && usdcEquiv !== null && (
              <motion.div key="val" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs tabular font-medium" style={{ color: "var(--ink)" }}>
                  Will send <strong>{Math.max(1, Math.ceil(usdcEquiv))} USDC</strong>
                </p>
                {usdcEquiv !== Math.max(1, Math.ceil(usdcEquiv)) && (
                  <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    ({usdcEquiv.toFixed(4)} USDC, rounded up — pool transfers in whole USDC units)
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: "var(--ink-soft)" }}>Recipient</label>
          <div className="flex gap-1">
            {(["book", "address"] as const).map(m => (
              <button key={m} onClick={() => { setRecipientMode(m); setSelected(null); setRawAddress(""); }}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{ background: recipientMode === m ? "var(--ink)" : "rgba(0,0,0,0.06)", color: recipientMode === m ? "white" : "var(--ink-soft)" }}>
                {m === "book" ? "Contacts" : "Address"}
              </button>
            ))}
          </div>
        </div>

        {recipientMode === "book" ? (
          <div className="glass glass-md overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: "var(--line)" }}>
              <Search size={14} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts…"
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "var(--ink)" }}
              />
            </div>
            <div className="max-h-[160px] overflow-y-auto">
              {loadingContacts ? (
                <p className="text-xs px-4 py-3" style={{ color: "var(--ink-soft)" }}>Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="text-xs px-4 py-3" style={{ color: "var(--ink-soft)" }}>No contacts found</p>
              ) : filtered.map(c => (
                <button key={c._id} onClick={() => setSelected(c)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors"
                  style={{ background: selected?._id === c._id ? "rgba(0,0,0,0.05)" : "transparent", color: "var(--ink)" }}>
                  <span className="font-medium capitalize">{c.name}</span>
                  <span className="font-mono text-xs" style={{ color: "var(--ink-soft)" }}>{c.stellarAddress.slice(0,6)}…{c.stellarAddress.slice(-4)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <input
            value={rawAddress}
            onChange={e => setRawAddress(e.target.value)}
            placeholder="G… Stellar address"
            className="glass glass-md w-full px-4 py-3 text-sm font-mono focus:outline-none"
            style={{ color: "var(--ink)" }}
          />
        )}
      </div>

      <div className="pt-1">
        <SlideToSend onComplete={handleSend} disabled={!canSend} label={canSend ? "Slide to send" : "Fill in amount and recipient"} />
      </div>

      <button onClick={onBack} className="w-full text-center text-xs py-1 touch" style={{ color: "var(--ink-soft)" }}>Back</button>
    </div>
  );
}
