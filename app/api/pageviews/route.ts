import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

type Body = {
  path?: string;
  referrer?: string;
  userAgent?: string;
  anonId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;

  const path = (body.path ?? "").trim();
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const anonId = (body.anonId ?? "").trim();
  if (!anonId) {
    return NextResponse.json({ error: "anonId is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 200 });
  }

  const { error } = await supabase.from("pageviews").insert({
    anon_id: anonId,
    path,
    referrer: body.referrer ?? null,
    user_agent: body.userAgent ?? null
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "failed_to_record" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

