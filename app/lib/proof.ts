"use client";

export interface WithdrawInput extends Record<string, unknown> {
  withdrawnValue: string;
  stateRoot: string;
  associationRoot: string;
  label: string;
  value: string;
  nullifier: string;
  secret: string;
  stateSiblings: string[];
  stateIndex: string;
  labelIndex: string;
  labelSiblings: string[];
}

export interface ZKProof {
  proof: object;
  publicSignals: string[];
}

export async function generateProof(input: Record<string, unknown>): Promise<ZKProof> {
  try {
    return await generateProofServer(input);
  } catch (e) {
    console.warn("Server proving failed, falling back to client-side:", e);
    return generateProofClient(input);
  }
}

async function generateProofClient(input: Record<string, unknown>): Promise<ZKProof> {
  const snarkjs = await import("snarkjs");

  const wasmPath = process.env.NEXT_PUBLIC_WASM_PATH ?? "/zk/main.wasm";
  const zkeyPath = process.env.NEXT_PUBLIC_ZKEY_PATH ?? "/zk/main_final.zkey";

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );
  return { proof, publicSignals };
}

async function generateProofServer(input: Record<string, unknown>): Promise<ZKProof> {
  const res = await fetch("/api/prove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "Server proving failed");
  }
  return res.json();
}
