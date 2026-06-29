import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import path from "path";

const execFileAsync = promisify(execFile);

function circom2sorobanBin(): string {
  return path.join(process.cwd(), "bin", "stellar-circom2soroban");
}

function extractHex(output: string, label: string): string {
  const lines = output.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(label)) {
      const hex = lines[i + 1]?.trim();
      if (hex && /^[0-9a-f]+$/.test(hex)) return hex;
    }
  }
  throw new Error(`Could not extract ${label} from circom2soroban output`);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.proof || !Array.isArray(body.publicSignals)) {
    return NextResponse.json({ error: "proof and publicSignals required" }, { status: 400 });
  }

  const bin = circom2sorobanBin();

  const id = randomBytes(8).toString("hex");
  const proofFile = join(tmpdir(), `proof_${id}.json`);
  const publicFile = join(tmpdir(), `public_${id}.json`);

  try {
    const proofJson = {
      pi_a: body.proof.pi_a,
      pi_b: body.proof.pi_b,
      pi_c: body.proof.pi_c,
      protocol: body.proof.protocol ?? "groth16",
      curve: body.proof.curve ?? "bls12-381",
    };

    await writeFile(proofFile, JSON.stringify(proofJson));
    await writeFile(publicFile, JSON.stringify(body.publicSignals));

    const [proofOut, publicOut] = await Promise.all([
      execFileAsync(bin, ["proof", proofFile]).then((r) => r.stdout),
      execFileAsync(bin, ["public", publicFile]).then((r) => r.stdout),
    ]);

    const proofHex = extractHex(proofOut, "Proof Hex encoding:");
    const pubSignalsHex = extractHex(publicOut, "Public signals Hex encoding:");

    return NextResponse.json({ proofHex, pubSignalsHex });
  } catch (e) {
    console.error("circom2soroban encode error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await Promise.all([
      unlink(proofFile).catch(() => {}),
      unlink(publicFile).catch(() => {}),
    ]);
  }
}
