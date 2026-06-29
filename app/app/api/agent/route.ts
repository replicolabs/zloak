import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { toUsdc } from "@/lib/fx";
import { DENOMINATION_USDC, SupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ParsedIntent {
  recipientName: string | null;   
  recipientAddress: string | null; 
  amount: number;
  currency: SupportedCurrency;
}

const SYSTEM_PROMPT = `You are a payment intent parser for Zloak, a private remittance service.
Extract payment intent from the user message and return ONLY valid JSON.

Supported currencies: USD ($), GBP (£), NGN (₦, naira, NGN).

If the recipient looks like a Stellar address (starts with G, 56 chars), set recipientName to null and recipientAddress to the address.
If the recipient is a name or nickname, set recipientAddress to null and recipientName to the name (lowercase).

Always return this exact JSON shape:
{
  "recipientName": string | null,
  "recipientAddress": string | null,
  "amount": number,
  "currency": "USD" | "GBP" | "NGN"
}

Examples:
"send $50 to mama" → {"recipientName":"mama","recipientAddress":null,"amount":50,"currency":"USD"}
"transfer ₦20000 to john" → {"recipientName":"john","recipientAddress":null,"amount":20000,"currency":"NGN"}
"send £100 to GABC...XYZ" → {"recipientName":null,"recipientAddress":"GABC...XYZ","amount":100,"currency":"GBP"}`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.message || !body?.senderWallet) {
    return NextResponse.json({ error: "message and senderWallet required" }, { status: 400 });
  }

  let parsed: ParsedIntent;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: body.message }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    parsed = JSON.parse(jsonMatch[0]) as ParsedIntent;
  } catch (e) {
    return NextResponse.json({ error: `Could not parse instruction: ${(e as Error).message}` }, { status: 422 });
  }

  if (!SUPPORTED_CURRENCIES.includes(parsed.currency)) {
    return NextResponse.json({ error: "Unsupported currency in instruction" }, { status: 422 });
  }

  let resolvedAddress: string | null = parsed.recipientAddress;
  let resolvedName: string | null = parsed.recipientName;

  if (parsed.recipientName && !parsed.recipientAddress) {
    await connectDB();
    const contact = await Contact.findOne({
      ownerWallet: body.senderWallet,
      name: { $regex: new RegExp(`^${parsed.recipientName}$`, "i") },
    }).lean();

    if (!contact) {
      return NextResponse.json({
        error: `No contact named "${parsed.recipientName}" in your address book`,
        recipientName: parsed.recipientName,
        notFound: true,
      }, { status: 404 });
    }
    resolvedAddress = contact.stellarAddress;
    resolvedName = contact.name;
  }

  if (!resolvedAddress) {
    return NextResponse.json({ error: "Could not resolve recipient address" }, { status: 422 });
  }

  const usdcAmount = await toUsdc(parsed.amount, parsed.currency);
  const noteCount = Math.ceil(usdcAmount / DENOMINATION_USDC);

  return NextResponse.json({
    recipientAddress: resolvedAddress,
    recipientName: resolvedName,
    originalAmount: parsed.amount,
    originalCurrency: parsed.currency,
    usdcAmount,
    noteCount,
    denomination: DENOMINATION_USDC,
    transferPlan: `Send ${noteCount} note${noteCount > 1 ? "s" : ""} of ${DENOMINATION_USDC} USDC each to ${resolvedName ?? resolvedAddress} (total: ${usdcAmount} USDC)`,
  });
}
