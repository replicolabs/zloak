import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transfer from "@/models/Transfer";
import { SupportedCurrency } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

  await connectDB();
  const transfers = await Transfer.find({ senderWallet: wallet, archived: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const required = ["senderWallet", "recipientAddress", "originalAmount", "originalCurrency", "usdcAmount", "noteCount"];
  for (const f of required) {
    if (body?.[f] === undefined) return NextResponse.json({ error: `${f} required` }, { status: 400 });
  }

  await connectDB();
  const transfer = await Transfer.create({
    senderWallet: body.senderWallet,
    recipientAddress: body.recipientAddress,
    recipientName: body.recipientName ?? null,
    originalAmount: body.originalAmount,
    originalCurrency: body.originalCurrency as SupportedCurrency,
    usdcAmount: body.usdcAmount,
    noteCount: body.noteCount,
    status: "pending",
  });
  return NextResponse.json(transfer, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await connectDB();
  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.depositTxHash) update.$push = { depositTxHashes: body.depositTxHash };
  if (body.withdrawTxHash) update.$push = { ...(update.$push as object), withdrawTxHashes: body.withdrawTxHash };
  if (body.errorMessage !== undefined) update.errorMessage = body.errorMessage;

  const updated = await Transfer.findByIdAndUpdate(body.id, update, { new: true });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
