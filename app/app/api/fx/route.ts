import { NextRequest, NextResponse } from "next/server";
import { toUsdc, getDisplayRates } from "@/lib/fx";
import { SUPPORTED_CURRENCIES, SupportedCurrency } from "@/lib/constants";
import { DENOMINATION_USDC } from "@/lib/constants";

export async function GET() {
  try {
    const rates = await getDisplayRates();
    return NextResponse.json(rates);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.amount || !body?.currency) {
    return NextResponse.json({ error: "amount and currency required" }, { status: 400 });
  }
  if (!SUPPORTED_CURRENCIES.includes(body.currency)) {
    return NextResponse.json({ error: `currency must be one of ${SUPPORTED_CURRENCIES.join(", ")}` }, { status: 400 });
  }

  try {
    const usdcAmount = await toUsdc(Number(body.amount), body.currency as SupportedCurrency);
    const noteCount = Math.ceil(usdcAmount / DENOMINATION_USDC);
    return NextResponse.json({ usdcAmount, noteCount, denomination: DENOMINATION_USDC });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
