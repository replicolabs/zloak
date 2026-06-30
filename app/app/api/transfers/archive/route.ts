import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transfer from "@/models/Transfer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const wallet = body?.wallet;
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  await connectDB();
  const result = await Transfer.updateMany(
    { senderWallet: wallet, status: { $in: ["failed", "pending"] } },
    { $set: { archived: true } }
  );
  return NextResponse.json({ archived: result.modifiedCount });
}
