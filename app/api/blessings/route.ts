import { NextResponse } from "next/server";
import { addBlessing } from "@/lib/repository";

export async function POST(request: Request) {
  const body = (await request.json()) as { matchId?: string; ritual?: "incense" | "mokugyo" | "beads" };

  if (!body.matchId || !body.ritual) {
    return NextResponse.json({ error: "matchId and ritual are required" }, { status: 400 });
  }

  const match = await addBlessing(body.matchId, body.ritual);

  if (!match) {
    return NextResponse.json({ error: "Failed to record blessing" }, { status: 500 });
  }

  return NextResponse.json({ match });
}
