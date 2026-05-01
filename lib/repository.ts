import { initialMatches } from "@/lib/mock-data";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { MatchItem, Message, RitualType } from "@/lib/types";

type MatchRecord = {
  id: string;
  phase: string;
  group_name: string | null;
  bracket_round: string | null;
  bracket_column: string | null;
  stage: string;
  status: "live" | "upcoming" | "finished";
  table_name: string;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  detail: string;
  scheduled_label: string;
  note: string;
  fortune: number;
  source_name: string | null;
  source_url: string | null;
  updated_at: string;
};

type MessageRecord = {
  id: string;
  match_id: string;
  user_id: string;
  user_name: string;
  ritual_label: string;
  body: string;
  likes_count: number;
  is_repay: boolean;
  created_at: string;
};

let memoryMatches: MatchItem[] = JSON.parse(JSON.stringify(initialMatches));

function cloneMatches() {
  return JSON.parse(JSON.stringify(memoryMatches)) as MatchItem[];
}

function getMemoryMatch(matchId: string) {
  return memoryMatches.find((match) => match.id === matchId) ?? null;
}

function scoreSnapshot(match: MatchItem) {
  return `${match.teamA} ${match.scoreA}:${match.scoreB} ${match.teamB}`;
}

function formatRelative(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  return `${minutes} 分钟前`;
}

function mapSupabaseMatch(match: MatchRecord, messages: MessageRecord[]): MatchItem {
  return {
    id: match.id,
    phase: match.phase as MatchItem["phase"],
    group: match.group_name ?? undefined,
    bracketRound: match.bracket_round ?? undefined,
    bracketColumn: match.bracket_column ?? undefined,
    stage: match.stage,
    status: match.status,
    table: match.table_name,
    teamA: match.team_a,
    teamB: match.team_b,
    scoreA: match.score_a,
    scoreB: match.score_b,
    detail: match.detail,
    time: match.scheduled_label,
    note: match.note,
    blessings: { incense: 0, mokugyo: 0, beads: 0 },
    // "togetherNow" is treated as realtime online count in the UI, so we don't persist it.
    // We'll fill it from Supabase Realtime Presence on the client.
    togetherNow: 0,
    fortune: match.fortune,
    sourceName: match.source_name ?? undefined,
    sourceUrl: match.source_url ?? undefined,
    updatedAt: match.updated_at,
    messages: messages.map((message) => ({
      id: message.id,
      ritual: message.ritual_label,
      user: message.user_name,
      text: message.body,
      time: formatRelative(message.created_at),
      likes: message.likes_count,
      liked: false
    })),
    userSession: { blessings: 0, lastMessage: "", snapshotScore: "", repaid: false }
  };
}

export async function listMatches(): Promise<MatchItem[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return cloneMatches();
  }

  const [{ data: matchRows, error: matchError }, { data: messageRows, error: messageError }] = await Promise.all([
    supabase.from("matches").select("*").order("created_at", { ascending: true }),
    supabase.from("messages").select("*").order("created_at", { ascending: false })
  ]);

  if (matchError || messageError || !matchRows || !messageRows) {
    return cloneMatches();
  }

  const baseMatches = matchRows.map((match) =>
    mapSupabaseMatch(
      match as MatchRecord,
      (messageRows as MessageRecord[]).filter((message) => message.match_id === match.id)
    )
  );

  // Compute real blessing totals from the blessings table.
  // We intentionally do it in JS to avoid relying on PostgREST aggregates being enabled.
  const { data: blessingRows } = await supabase
    .from("blessings")
    .select("match_id, ritual_type")
    .order("created_at", { ascending: false })
    .limit(20000);

  if (!blessingRows) {
    return baseMatches;
  }

  const totals = new Map<string, { incense: number; mokugyo: number; beads: number }>();
  for (const row of blessingRows as Array<{ match_id: string; ritual_type: RitualType }>) {
    const cur = totals.get(row.match_id) ?? { incense: 0, mokugyo: 0, beads: 0 };
    if (row.ritual_type === "incense") cur.incense += 1;
    if (row.ritual_type === "mokugyo") cur.mokugyo += 1;
    if (row.ritual_type === "beads") cur.beads += 1;
    totals.set(row.match_id, cur);
  }

  return baseMatches.map((match) => ({
    ...match,
    blessings: totals.get(match.id) ?? { incense: 0, mokugyo: 0, beads: 0 }
  }));
}

export async function getMatch(matchId: string): Promise<MatchItem | null> {
  const matches = await listMatches();
  return matches.find((match) => match.id === matchId) ?? null;
}

export async function addBlessing(matchId: string, ritual: RitualType) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const match = await getMatch(matchId);
    if (!match) {
      return null;
    }

    const { error: blessingError } = await supabase.from("blessings").insert({
      match_id: matchId,
      user_id: "guest-user",
      ritual_type: ritual
    });

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        fortune: Math.min(100, match.fortune + 3),
        updated_at: new Date().toISOString()
      })
      .eq("id", matchId);

    if (!blessingError && !updateError) {
      return getMatch(matchId);
    }
  }

  const match = getMemoryMatch(matchId);
  if (!match) {
    return null;
  }

  match.blessings[ritual] += 1;
  match.fortune = Math.min(100, match.fortune + 3);
  match.updatedAt = new Date().toISOString();
  match.userSession.blessings += 1;
  match.userSession.snapshotScore = scoreSnapshot(match);

  return JSON.parse(JSON.stringify(match)) as MatchItem;
}

export async function addMessage(
  matchId: string,
  payload: { ritualLabel: string; text: string; isRepay?: boolean }
) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      user_id: "guest-user",
      user_name: "我",
      ritual_label: payload.ritualLabel,
      body: payload.text,
      likes_count: payload.isRepay ? 6 : 1,
      is_repay: Boolean(payload.isRepay)
    });

    if (!error) {
      if (payload.isRepay) {
        const match = await getMatch(matchId);
        if (match) {
          await supabase
            .from("matches")
            .update({
              fortune: Math.min(100, match.fortune + 5),
              updated_at: new Date().toISOString()
            })
            .eq("id", matchId);
        }
      }
      return getMatch(matchId);
    }
  }

  const match = getMemoryMatch(matchId);
  if (!match) {
    return null;
  }

  const newMessage: Message = {
    id: `${matchId}-${Date.now()}`,
    ritual: payload.ritualLabel,
    user: "我",
    text: payload.text,
    time: "刚刚",
    likes: payload.isRepay ? 6 : 1,
    liked: false
  };

  match.messages.unshift(newMessage);
  match.userSession.lastMessage = payload.text;
  match.userSession.snapshotScore = scoreSnapshot(match);
  if (payload.isRepay) {
    match.userSession.repaid = true;
    match.fortune = Math.min(100, match.fortune + 5);
  }
  match.updatedAt = new Date().toISOString();

  return JSON.parse(JSON.stringify(match)) as MatchItem;
}

export async function toggleMessageLike(matchId: string, messageId: string) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const match = await getMatch(matchId);
    const message = match?.messages.find((item) => item.id === messageId);

    if (match && message) {
      const nextLikes = message.liked ? Math.max(0, message.likes - 1) : message.likes + 1;
      const { error } = await supabase
        .from("messages")
        .update({ likes_count: nextLikes })
        .eq("id", messageId);

      if (!error) {
        return getMatch(matchId);
      }
    }
  }

  const match = getMemoryMatch(matchId);
  if (!match) {
    return null;
  }

  const message = match.messages.find((item) => item.id === messageId);
  if (!message) {
    return null;
  }

  message.liked = !message.liked;
  message.likes += message.liked ? 1 : -1;
  match.updatedAt = new Date().toISOString();

  return JSON.parse(JSON.stringify(match)) as MatchItem;
}

export async function updateMatchAdmin(
  matchId: string,
  payload: Partial<{
    status: MatchItem["status"];
    scoreA: number;
    scoreB: number;
    detail: string;
    time: string;
    note: string;
    sourceName: string;
    sourceUrl: string;
  }>
) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const updatePayload = {
      status: payload.status,
      score_a: payload.scoreA,
      score_b: payload.scoreB,
      detail: payload.detail,
      scheduled_label: payload.time,
      note: payload.note,
      source_name: payload.sourceName,
      source_url: payload.sourceUrl,
      updated_at: new Date().toISOString()
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([, value]) => value !== undefined)
    );

    const { error } = await supabase.from("matches").update(cleanedPayload).eq("id", matchId);
    if (!error) {
      return getMatch(matchId);
    }
  }

  const match = getMemoryMatch(matchId);
  if (!match) {
    return null;
  }

  if (payload.status) {
    match.status = payload.status;
  }
  if (typeof payload.scoreA === "number") {
    match.scoreA = payload.scoreA;
  }
  if (typeof payload.scoreB === "number") {
    match.scoreB = payload.scoreB;
  }
  if (typeof payload.detail === "string") {
    match.detail = payload.detail;
  }
  if (typeof payload.time === "string") {
    match.time = payload.time;
  }
  if (typeof payload.note === "string") {
    match.note = payload.note;
  }
  if (typeof payload.sourceName === "string") {
    match.sourceName = payload.sourceName;
  }
  if (typeof payload.sourceUrl === "string") {
    match.sourceUrl = payload.sourceUrl;
  }
  match.updatedAt = new Date().toISOString();

  return JSON.parse(JSON.stringify(match)) as MatchItem;
}
