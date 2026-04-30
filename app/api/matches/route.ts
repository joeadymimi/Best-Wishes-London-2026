import { NextResponse } from "next/server";
import { listMatches } from "@/lib/repository";

export async function GET() {
  const matches = await listMatches();
  return NextResponse.json({ matches });
}
