import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

function startOfDayForOffset(offsetHours: number) {
  const now = new Date();
  const shifted = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  const startShiftedUtc = Date.UTC(y, m, d, 0, 0, 0, 0);
  return new Date(startShiftedUtc - offsetHours * 60 * 60 * 1000);
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      timezone: "Asia/Shanghai",
      total: 0,
      today: 0,
      last7Days: []
    });
  }

  // Report "today" in Asia/Shanghai time to match the product's primary audience.
  const tzOffsetHours = 8;
  const todayStart = startOfDayForOffset(tzOffsetHours);
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [{ count: total }, { count: today }, { data: rows, error: rowsErr }] = await Promise.all([
    supabase.from("pageviews").select("*", { count: "exact", head: true }),
    supabase.from("pageviews").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    supabase
      .from("pageviews")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true })
      .limit(50000)
  ]);

  if (rowsErr || !rows) {
    return NextResponse.json({
      timezone: "Asia/Shanghai",
      total: total ?? 0,
      today: today ?? 0,
      last7Days: []
    });
  }

  const dayCounts = new Map<string, number>();
  for (const row of rows as Array<{ created_at: string }>) {
    // Convert to Shanghai "date" bucket.
    const t = new Date(row.created_at).getTime() + tzOffsetHours * 60 * 60 * 1000;
    const d = new Date(t);
    const key = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  const last7Days: Array<{ day: string; count: number }> = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const t = day.getTime() + tzOffsetHours * 60 * 60 * 1000;
    const d = new Date(t);
    const key = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    last7Days.push({ day: key, count: dayCounts.get(key) ?? 0 });
  }

  return NextResponse.json({
    timezone: "Asia/Shanghai",
    total: total ?? 0,
    today: today ?? 0,
    last7Days
  });
}

