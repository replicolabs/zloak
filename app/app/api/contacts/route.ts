import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  await connectDB();
  const contacts = await Contact.find({ ownerWallet: wallet }).sort({ name: 1 }).lean();
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.wallet || !body?.name || !body?.stellarAddress) {
    return NextResponse.json({ error: "wallet, name and stellarAddress required" }, { status: 400 });
  }

  await connectDB();
  try {
    const contact = await Contact.create({
      ownerWallet: body.wallet,
      name: body.name.trim(),
      stellarAddress: body.stellarAddress.trim(),
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json({ error: `A contact named "${body.name}" already exists` }, { status: 409 });
    }
    throw err;
  }
}
