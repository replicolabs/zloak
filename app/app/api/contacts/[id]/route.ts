import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.wallet || !body?.name || !body?.stellarAddress) {
    return NextResponse.json({ error: "wallet, name and stellarAddress required" }, { status: 400 });
  }

  await connectDB();
  try {
    const updated = await Contact.findOneAndUpdate(
      { _id: id, ownerWallet: body.wallet },
      { name: body.name.trim(), stellarAddress: body.stellarAddress.trim() },
      { new: true, runValidators: true }
    );
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json({ error: `A contact named "${body.name}" already exists` }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  await connectDB();
  const deleted = await Contact.findOneAndDelete({ _id: id, ownerWallet: wallet });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
