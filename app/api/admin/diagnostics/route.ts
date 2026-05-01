import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = getSupabaseServerClient();
  let canSelectMatches: boolean | null = null;
  let canSelectBlessings: boolean | null = null;

  if (supabase) {
    const { error: selectErr } = await supabase.from("matches").select("id").limit(1);
    canSelectMatches = !selectErr;

    const { error: blessingsErr } = await supabase.from("blessings").select("id").limit(1);
    canSelectBlessings = !blessingsErr;
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: Boolean(url),
    hasAnonKey: Boolean(anon),
    hasServiceRoleKey: Boolean(serviceRole),
    serverClientReady: Boolean(supabase),
    canSelectMatches,
    canSelectBlessings
  });
}
