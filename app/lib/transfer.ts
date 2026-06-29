"use client";

import { generateNote, Note } from "./note";
import { generateProof } from "./proof";
import { DENOMINATION_USDC } from "./constants";

export type StepCallback = (
  index: number,
  label: string,
  status: "pending" | "done" | "error",
  txHash?: string,
  detail?: string
) => void;

export interface TransferParams {
  senderWallet: string;
  recipientAddress: string;
  noteCount: number;
  onStep: StepCallback;
  signTransaction: (xdr: string) => Promise<string>;
}

async function apiFetch(path: string, opts?: RequestInit): Promise<unknown> {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data;
}

async function getUsdcBalance(address: string): Promise<number> {
  const data = await apiFetch(`/api/balance?address=${encodeURIComponent(address)}`) as { usdc: number };
  return data.usdc;
}

async function getPoolState(): Promise<{ root: string; commitments: string[] }> {
  return apiFetch("/api/pool/state") as Promise<{ root: string; commitments: string[] }>;
}

async function waitForCommitmentInState(
  expectedDecimal: string
): Promise<string[]> {
  const maxAttempts = 12;
  const delayMs = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    const { commitments: hexCommitments } = await getPoolState();
    const dec = hexCommitments.map((h) => BigInt("0x" + h).toString(10));
    if (dec.includes(expectedDecimal)) return dec;
    if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Deposit not reflected in pool state after 60s — Soroban RPC may be lagging");
}

async function buildDepositXdr(address: string, commitmentHex: string): Promise<string> {
  const data = await apiFetch("/api/pool/deposit-tx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, commitmentHex }),
  }) as { xdr: string };
  return data.xdr;
}

async function buildWithdrawXdr(senderAddress: string, recipientAddress: string, proofHex: string, pubSignalsHex: string): Promise<string> {
  const data = await apiFetch("/api/pool/withdraw-tx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderAddress, recipientAddress, proofHex, pubSignalsHex }),
  }) as { xdr: string };
  return data.xdr;
}

async function validateRecipient(address: string): Promise<void> {
  const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
  const usdcIssuer = process.env.NEXT_PUBLIC_USDC_ISSUER ?? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
  const res = await fetch(`${horizonUrl}/accounts/${address}`);
  if (!res.ok) {
    throw new Error("Recipient account doesn't exist on Stellar testnet — they need to activate it with XLM first.");
  }
  const account = await res.json() as { balances: { asset_type: string; asset_code?: string; asset_issuer?: string }[] };
  const hasTrustline = account.balances.some(
    (b) => b.asset_code === "USDC" && b.asset_issuer === usdcIssuer
  );
  if (!hasTrustline) {
    throw new Error("Recipient doesn't have a USDC trustline — they need to add USDC to their Stellar wallet first.");
  }
}

function saveNotePending(walletAddress: string, note: Note): void {
  if (typeof window === "undefined") return;
  const key = `zloak_pending_${walletAddress}`;
  const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as { commitmentHex: string; note: Note; savedAt: string }[];
  if (!existing.some((e) => e.commitmentHex === note.commitmentHex)) {
    existing.push({ commitmentHex: note.commitmentHex, note, savedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));
  }
}

function removeNotePending(walletAddress: string, commitmentHex: string): void {
  if (typeof window === "undefined") return;
  const key = `zloak_pending_${walletAddress}`;
  const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as { commitmentHex: string }[];
  localStorage.setItem(key, JSON.stringify(existing.filter((e) => e.commitmentHex !== commitmentHex)));
}

async function submitSignedTx(signedXdr: string): Promise<string> {
  const data = await apiFetch("/api/pool/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedXdr }),
  }) as { hash: string };
  return data.hash;
}

async function buildSwapXdr(address: string, usdcNeeded: number): Promise<string | null> {
  const data = await apiFetch("/api/pool/swap-tx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, usdcNeeded }),
  }) as { xdr: string | null };
  return data.xdr;
}

async function buildSnarkInput(
  note: Note,
  decimalCommitments: string[]
): Promise<Record<string, unknown>> {
  return apiFetch("/api/coinutils/withdraw-input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coin: {
        value: note.value,
        nullifier: note.nullifier,
        secret: note.secret,
        label: note.label,
        commitment: note.commitment,
      },
      commitmentHex: note.commitmentHex,
      commitments: decimalCommitments,
    }),
  }) as Promise<Record<string, unknown>>;
}

async function encodeProof(
  proof: object,
  publicSignals: string[]
): Promise<{ proofHex: string; pubSignalsHex: string }> {
  return apiFetch("/api/coinutils/encode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proof, publicSignals }),
  }) as Promise<{ proofHex: string; pubSignalsHex: string }>;
}

export async function executeTransfer(params: TransferParams): Promise<string[]> {
  const { senderWallet, recipientAddress, noteCount, onStep, signTransaction } = params;
  const withdrawTxHashes: string[] = [];
  const totalUsdc = noteCount * DENOMINATION_USDC;

  onStep(0, "Validating recipient…", "pending");
  try {
    await validateRecipient(recipientAddress);
  } catch (e) {
    onStep(0, "Recipient invalid", "error", undefined, (e as Error).message);
    throw e;
  }

  onStep(0, `Checking USDC balance (need ${totalUsdc} USDC)`, "pending");
  try {
    const balance = await getUsdcBalance(senderWallet);
    if (balance < totalUsdc) {
      onStep(0, `Swapping XLM → ${totalUsdc} USDC`, "pending");
      const swapXdr = await buildSwapXdr(senderWallet, totalUsdc);
      if (swapXdr) {
        const signedSwap = await signTransaction(swapXdr);
        await submitSignedTx(signedSwap);
      }
    }
    onStep(0, "USDC balance ready", "done");
  } catch (e) {
    onStep(0, "USDC check failed", "error", undefined, (e as Error).message);
    throw e;
  }

  for (let i = 0; i < noteCount; i++) {
    const noteNum = i + 1;
    const base = 1 + i * 4;

    onStep(base, `[Note ${noteNum}] Generating commitment`, "pending");
    let note: Note;
    try {
      note = await generateNote();
      onStep(base, `[Note ${noteNum}] Commitment generated`, "done");
    } catch (e) {
      onStep(base, `[Note ${noteNum}] Note generation failed`, "error", undefined, (e as Error).message);
      throw e;
    }

    onStep(base + 1, `[Note ${noteNum}] Depositing into pool`, "pending");
    try {
      const depositXdr = await buildDepositXdr(senderWallet, note.commitmentHex);
      saveNotePending(senderWallet, note);
      const signedDeposit = await signTransaction(depositXdr);
      const depositHash = await submitSignedTx(signedDeposit);
      onStep(base + 1, `[Note ${noteNum}] Deposited`, "done", depositHash);
    } catch (e) {
      onStep(base + 1, `[Note ${noteNum}] Deposit failed`, "error", undefined, (e as Error).message);
      throw e;
    }

    onStep(base + 2, `[Note ${noteNum}] Generating ZK proof (~30s)`, "pending");
    let proofHex: string;
    let pubSignalsHex: string;
    try {
      const decimalCommitments = await waitForCommitmentInState(note.commitment);
      const snarkInput = await buildSnarkInput(note, decimalCommitments);

      // if these differ, the proof will always be rejected by the contract
      {
        const { root: onChainRootHex } = await getPoolState();
        const onChainRootDec = BigInt("0x" + onChainRootHex).toString(10);
        const coinutilsRoot = String(snarkInput.stateRoot ?? "");
        console.log(`[zloak] stateRoot check — coinutils: ${coinutilsRoot.slice(0, 20)}… on-chain: ${onChainRootDec.slice(0, 20)}…`);
        if (coinutilsRoot && coinutilsRoot !== onChainRootDec) {
          console.error(`[zloak] STATE ROOT MISMATCH\n  coinutils : ${coinutilsRoot}\n  on-chain  : ${onChainRootDec}`);
          throw new Error(
            `State root mismatch — the ZK circuit and on-chain Merkle tree are computing different roots. ` +
            `coinutils: ${coinutilsRoot.slice(0, 10)}… | on-chain: ${onChainRootDec.slice(0, 10)}…`
          );
        }
      }

      const { proof, publicSignals } = await generateProof(snarkInput);
      note.nullifierHash = publicSignals[0];
      const encoded = await encodeProof(proof, publicSignals);
      proofHex = encoded.proofHex;
      pubSignalsHex = encoded.pubSignalsHex;
      onStep(base + 2, `[Note ${noteNum}] Proof generated`, "done");
    } catch (e) {
      onStep(base + 2, `[Note ${noteNum}] Proof failed`, "error", undefined, (e as Error).message);
      throw e;
    }

    onStep(base + 3, `[Note ${noteNum}] Withdrawing to recipient`, "pending");
    try {
      const withdrawXdr = await buildWithdrawXdr(senderWallet, recipientAddress, proofHex, pubSignalsHex);
      const signedWithdraw = await signTransaction(withdrawXdr);
      const withdrawHash = await submitSignedTx(signedWithdraw);
      withdrawTxHashes.push(withdrawHash);
      removeNotePending(senderWallet, note.commitmentHex);
      onStep(base + 3, `[Note ${noteNum}] Withdrawn`, "done", withdrawHash);
    } catch (e) {
      onStep(base + 3, `[Note ${noteNum}] Withdrawal failed`, "error", undefined, (e as Error).message);
      throw e;
    }
  }

  return withdrawTxHashes;
}
