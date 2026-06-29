import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.input) {
    return NextResponse.json({ error: "input required" }, { status: 400 });
  }

  try {
    const snarkjs = await import("snarkjs");
    const wasmPath = path.join(process.cwd(), "public", "zk", "main.wasm");
    const zkeyPath = path.join(process.cwd(), "public", "zk", "main_final.zkey");

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      body.input,
      wasmPath,
      zkeyPath
    );
    return NextResponse.json({ proof, publicSignals });
  } catch (e) {
    console.error("Server proof generation error:", e);
    return NextResponse.json(
      { error: `Proof generation failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
