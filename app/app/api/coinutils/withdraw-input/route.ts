import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import path from "path";

const execFileAsync = promisify(execFile);

function coinutilsBin(): string {
  return path.join(process.cwd(), "bin", "stellar-coinutils");
}

async function getAssocFilePath(): Promise<string | null> {
  const envFile = process.env.ASSOCIATION_FILE;
  if (envFile) return envFile;

  const { connectDB } = await import("@/lib/mongodb");
  const AssociationSet = (await import("@/models/AssociationSet")).default;
  await connectDB();
  const doc = await AssociationSet.findOne({ scope: "zloak_ngn" });
  if (!doc || doc.labels.length === 0) return null;

  const tmpPath = join(tmpdir(), `assoc_${randomBytes(8).toString("hex")}.json`);
  await writeFile(
    tmpPath,
    JSON.stringify({ labels: doc.labels, scope: doc.scope, root: doc.root })
  );
  return tmpPath;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.coin || !Array.isArray(body.commitments)) {
    return NextResponse.json({ error: "coin and commitments array required" }, { status: 400 });
  }

  const bin = coinutilsBin();
  const id = randomBytes(8).toString("hex");
  const coinFile = join(tmpdir(), `coin_${id}.json`);
  const stateFile = join(tmpdir(), `state_${id}.json`);
  const outFile = join(tmpdir(), `withdrawal_${id}.json`);
  let tmpAssocFile: string | null = null;

  try {
    const assocPath = await getAssocFilePath();
    if (!assocPath) {
      return NextResponse.json({ error: "Association set not initialised" }, { status: 500 });
    }
    if (assocPath !== process.env.ASSOCIATION_FILE) {
      tmpAssocFile = assocPath;
    }

    await writeFile(
      coinFile,
      JSON.stringify({ coin: body.coin, commitment_hex: body.commitmentHex })
    );
    await writeFile(
      stateFile,
      JSON.stringify({ commitments: body.commitments, scope: "zloak_ngn" })
    );

    await execFileAsync(bin, ["withdraw", coinFile, stateFile, assocPath, "--output", outFile]);
    const raw = await readFile(outFile, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    console.error("coinutils withdraw error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await Promise.all([
      unlink(coinFile).catch(() => {}),
      unlink(stateFile).catch(() => {}),
      unlink(outFile).catch(() => {}),
      tmpAssocFile ? unlink(tmpAssocFile).catch(() => {}) : Promise.resolve(),
    ]);
  }
}
