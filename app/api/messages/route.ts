import { NextResponse } from "next/server";
import { addMessage } from "@/lib/repository";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    matchId?: string;
    ritualLabel?: string;
    text?: string;
    isRepay?: boolean;
  };

  if (!body.matchId || !body.ritualLabel || !body.text) {
    return NextResponse.json({ error: "matchId, ritualLabel and text are required" }, { status: 400 });
  }

  const match = await addMessage(body.matchId, {
    ritualLabel: body.ritualLabel,
    text: body.text,
    isRepay: body.isRepay
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ match });
}
