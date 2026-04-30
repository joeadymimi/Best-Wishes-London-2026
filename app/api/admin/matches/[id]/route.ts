import { NextResponse } from "next/server";
import { updateMatchAdmin } from "@/lib/repository";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const body = (await request.json()) as {
    status?: "live" | "upcoming" | "finished";
    scoreA?: number;
    scoreB?: number;
    detail?: string;
    time?: string;
    note?: string;
    sourceName?: string;
    sourceUrl?: string;
  };

  const match = await updateMatchAdmin(id, body);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ match });
}
