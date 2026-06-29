import { NextRequest, NextResponse } from "next/server";
import { submitTransaction } from "@/lib/stellar";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.signedXdr) {
    return NextResponse.json({ error: "signedXdr required" }, { status: 400 });
  }
  try {
    const hash = await submitTransaction(body.signedXdr);
    return NextResponse.json({ hash });
  } catch (e) {
    console.error("submit tx error:", e);
    // horizon 400 errors have a response object with extras
    const msg = (e as Error).message ?? String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
