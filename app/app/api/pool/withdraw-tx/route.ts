import { NextRequest, NextResponse } from "next/server";
import { buildWithdrawTx } from "@/lib/pool";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.senderAddress || !body?.recipientAddress || !body?.proofHex || !body?.pubSignalsHex) {
    return NextResponse.json({ error: "senderAddress, recipientAddress, proofHex and pubSignalsHex required" }, { status: 400 });
  }
  try {
    const xdr = await buildWithdrawTx(body.senderAddress, body.recipientAddress, body.proofHex, body.pubSignalsHex);
    return NextResponse.json({ xdr });
  } catch (e) {
    console.error("withdraw-tx error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
