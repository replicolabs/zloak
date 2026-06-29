import { NextRequest, NextResponse } from "next/server";
import { buildDepositTx } from "@/lib/pool";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.address || !body?.commitmentHex) {
    return NextResponse.json({ error: "address and commitmentHex required" }, { status: 400 });
  }
  try {
    const xdr = await buildDepositTx(body.address, body.commitmentHex);
    return NextResponse.json({ xdr });
  } catch (e) {
    console.error("deposit-tx error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
