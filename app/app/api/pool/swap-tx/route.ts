import { NextRequest, NextResponse } from "next/server";
import { buildSwapXlmForUsdc } from "@/lib/stellar";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.address || body?.usdcNeeded === undefined) {
    return NextResponse.json({ error: "address and usdcNeeded required" }, { status: 400 });
  }
  try {
    const xdr = await buildSwapXlmForUsdc(body.address, Number(body.usdcNeeded));
    return NextResponse.json({ xdr }); 
  } catch (e) {
    console.error("swap-tx error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
