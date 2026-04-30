import { NextResponse } from "next/server";
import { toggleMessageLike } from "@/lib/repository";

type RouteProps = {
  params: Promise<{ messageId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { messageId } = await params;
  const body = (await request.json()) as { matchId?: string };

  if (!body.matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  const match = await toggleMessageLike(body.matchId, messageId);

  if (!match) {
    return NextResponse.json({ error: "Match or message not found" }, { status: 404 });
  }

  return NextResponse.json({ match });
}
