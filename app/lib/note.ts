export interface Note {
  value: string;
  nullifier: string;
  secret: string;
  label: string;
  commitment: string;
  commitmentHex: string;
  nullifierHash: string; 
}

export async function generateNote(): Promise<Note> {
  const res = await fetch("/api/coinutils/generate", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Note generation failed: ${err.error ?? res.statusText}`);
  }
  const data = await res.json();

  return {
    value: data.coin.value,
    nullifier: data.coin.nullifier,
    secret: data.coin.secret,
    label: data.coin.label,
    commitment: data.coin.commitment,
    commitmentHex: data.commitment_hex,
    nullifierHash: "",
  };
}
