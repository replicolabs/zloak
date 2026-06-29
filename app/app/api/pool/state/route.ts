import { NextResponse } from "next/server";
import { getPoolState } from "@/lib/pool";

export async function GET() {
  try {
    const state = await getPoolState();
    return NextResponse.json(state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : "";
    console.error("pool state error:", msg, stack);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
