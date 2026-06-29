import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import path from "path";
import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  Keypair,
  Horizon,
  Networks,
  BASE_FEE,
  xdr,
  Address,
} from "@stellar/stellar-sdk";

const execFileAsync = promisify(execFile);

const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC ?? "https://soroban-testnet.stellar.org";
const HORIZON_URL_ENV =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_CONTRACT_ID ?? "";
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY ?? "";
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS ?? "";

function coinutilsBin(): string {
  return path.join(process.cwd(), "bin", "stellar-coinutils");
}

interface AssocData {
  labels: string[];
  scope: string;
  root: string | null;
}

async function readAssocSet(): Promise<AssocData> {
  const file = process.env.ASSOCIATION_FILE;
  if (file) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      return { labels: [], scope: "zloak_ngn", root: null };
    }
  }
  const { connectDB } = await import("@/lib/mongodb");
  const AssociationSet = (await import("@/models/AssociationSet")).default;
  await connectDB();
  const doc = await AssociationSet.findOne({ scope: "zloak_ngn" });
  if (!doc) return { labels: [], scope: "zloak_ngn", root: null };
  return { labels: doc.labels, scope: doc.scope, root: doc.root ?? null };
}

async function writeAssocSet(data: AssocData): Promise<void> {
  const file = process.env.ASSOCIATION_FILE;
  if (file) {
    await writeFile(file, JSON.stringify(data, null, 2));
    return;
  }
  const { connectDB } = await import("@/lib/mongodb");
  const AssociationSet = (await import("@/models/AssociationSet")).default;
  await connectDB();
  await AssociationSet.findOneAndUpdate(
    { scope: "zloak_ngn" },
    { ...data, updatedAt: new Date() },
    { upsert: true }
  );
}

async function updateAssociationRootOnChain(rootHex: string): Promise<void> {
  const soroban = new SorobanRpc.Server(SOROBAN_RPC_URL);
  const horizon = new Horizon.Server(HORIZON_URL_ENV);
  const keypair = Keypair.fromSecret(ADMIN_SECRET);
  const contract = new Contract(CONTRACT_ID);
  const account = await horizon.loadAccount(ADMIN_ADDRESS);

  const tx = new TransactionBuilder(account, {
    fee: String(Number(BASE_FEE) * 10),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "set_association_root",
        new Address(ADMIN_ADDRESS).toScVal(),
        xdr.ScVal.scvBytes(Buffer.from(rootHex, "hex"))
      )
    )
    .setTimeout(30)
    .build();

  const sim = await soroban.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`set_association_root simulation failed: ${sim.error}`);
  }
  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  prepared.sign(keypair);
  const result = await soroban.sendTransaction(prepared);
  if (result.status === "ERROR") {
    throw new Error(`set_association_root tx failed: ${JSON.stringify(result.errorResult)}`);
  }

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await soroban.getTransaction(result.hash);
    if (status.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return;
    if (status.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("set_association_root failed onchain");
    }
  }
  throw new Error("set_association_root confirmation timed out");
}

export async function POST() {
  const bin = coinutilsBin();
  const outFile = join(tmpdir(), `coin_${randomBytes(8).toString("hex")}.json`);
  const assocFile = join(tmpdir(), `assoc_${randomBytes(8).toString("hex")}.json`);

  try {
    await execFileAsync(bin, ["generate", "zloak_ngn", "--output", outFile]);
    const raw = await readFile(outFile, "utf8");
    const data = JSON.parse(raw);
    const label: string = data.coin.label;

    let assoc = await readAssocSet();

    if (!assoc.labels.includes(label)) {
      if (assoc.labels.length >= 4) assoc.labels = [];

      await writeFile(assocFile, JSON.stringify(assoc));

      await execFileAsync(bin, ["update-association", assocFile, label]);

      assoc = JSON.parse(await readFile(assocFile, "utf8"));

      await writeAssocSet(assoc);

      const rootHex = BigInt(assoc.root!).toString(16).padStart(64, "0");
      await updateAssociationRootOnChain(rootHex);
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("coinutils generate error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await Promise.all([unlink(outFile).catch(() => {}), unlink(assocFile).catch(() => {})]);
  }
}
