import { NextRequest, NextResponse } from "next/server";
import { getUsdcBalance } from "@/lib/stellar";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  try {
    const usdc = await getUsdcBalance(address);
    return NextResponse.json({ usdc });
  } catch (e) {
    console.error("balance fetch error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
