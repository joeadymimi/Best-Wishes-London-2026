"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { initialMatches } from "@/lib/mock-data";
import { playBeadsRelease, playBeadsTick, playIncenseIgnite, playMokugyoKnock, primeSfx } from "@/lib/sfx";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { MatchItem, Message, RitualType } from "@/lib/types";

const statusMap = {
  live: { label: "LIVE", className: "status-live" },
  upcoming: { label: "即将开始", className: "status-upcoming" },
  finished: { label: "已结束", className: "status-finished" }
} as const;

const ritualLabelMap: Record<RitualType, string> = {
  incense: "烧香",
  mokugyo: "木鱼",
  beads: "盘串"
};

type AppClientProps = {
  mode: "home" | "detail";
  initialMatchId?: string;
};

const LAST_MATCH_KEY = "london-2026-last-match";

function isChinaSpotlightMatch(match: MatchItem) {
  return match.teamA === "中国男团" || match.teamA === "中国女团";
}

export function AppClient({ mode, initialMatchId }: AppClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [matches, setMatches] = useState<MatchItem[]>(initialMatches);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(initialMatchId ?? null);
  const [activeRitual, setActiveRitual] = useState<RitualType>("incense");
  const [incenseLit, setIncenseLit] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboText, setComboText] = useState("轻触开始，连击会为气运值加成。");
  const [wishInput, setWishInput] = useState("");
  const [wishEcho, setWishEcho] = useState("可以边祈福边留言，大家会一起看到。");
  const comboTimerRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const dragStateRef = useRef<{ lastX: number; lastTime: number } | null>(null);
  const beadsTickStrengthRef = useRef(0);
  const burstRefs = {
    incense: useRef<HTMLDivElement>(null),
    mokugyo: useRef<HTMLDivElement>(null),
    beads: useRef<HTMLDivElement>(null)
  };
  const mokugyoRef = useRef<HTMLButtonElement>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const presenceRef = useRef<{
    channelName: string;
    cleanup: () => void;
  } | null>(null);

  function getOrCreateAnonId() {
    const key = "tt2026-anon-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(key, id);
    return id;
  }

  async function refreshMatches() {
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      const data = (await response.json()) as { matches?: MatchItem[] };
      if (data.matches?.length) {
        setMatches(data.matches);
      }
    } catch {
      // Keep the last known state to avoid jarring UI resets.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      await refreshMatches();
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    let interval: number | null = null;

    function start() {
      if (interval) return;
      // “Real-time enough” without being too aggressive.
      interval = window.setInterval(() => {
        void refreshMatches();
      }, 8000);
    }

    function stop() {
      if (interval) {
        window.clearInterval(interval);
        interval = null;
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshMatches();
        start();
      } else {
        stop();
      }
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      window.localStorage.setItem(LAST_MATCH_KEY, selectedMatchId);
    }
  }, [selectedMatchId]);

  // Realtime online count (presence) for the currently opened match detail page.
  useEffect(() => {
    if (mode !== "detail" || !selectedMatchId) {
      setOnlineCount(0);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setOnlineCount(0);
      return;
    }

    const anonId = getOrCreateAnonId();
    const channelName = `presence:match:${selectedMatchId}`;

    // Cleanup previous channel if any.
    if (presenceRef.current?.channelName !== channelName) {
      presenceRef.current?.cleanup();
      presenceRef.current = null;
    }

    if (presenceRef.current) {
      return;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: anonId }
      }
    });

    const updateCount = () => {
      const state = channel.presenceState();
      const keys = Object.keys(state ?? {});
      setOnlineCount(keys.length);
    };

    channel.on("presence", { event: "sync" }, updateCount);
    channel.on("presence", { event: "join" }, updateCount);
    channel.on("presence", { event: "leave" }, updateCount);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // We can attach minimal metadata; key uniqueness is what matters for counting.
        void channel.track({ t: Date.now() });
      }
    });

    const cleanup = () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
      setOnlineCount(0);
    };

    presenceRef.current = { channelName, cleanup };
    return cleanup;
  }, [mode, selectedMatchId]);

  useEffect(() => {
    if (mode === "home" && pathname === "/") {
      const lastMatch = window.localStorage.getItem(LAST_MATCH_KEY);
      if (lastMatch && !selectedMatchId) {
        setWishEcho("你上次看过一场比赛，后面可以给首页加“继续上次那场比赛”入口。");
      }
    }
  }, [mode, pathname, selectedMatchId]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  useEffect(() => {
    if (!selectedMatch) {
      setWishEcho("可以边祈福边留言，大家会一起看到。");
      return;
    }

    setWishEcho(
      `你正在为 ${selectedMatch.teamA} vs ${selectedMatch.teamB} 使用${ritualLabelMap[activeRitual]}祈福，也可以顺手留一句话。`
    );
  }, [activeRitual, selectedMatch]);

  const totalBlessingCount = useMemo(
    () =>
      matches.reduce(
        (sum, match) => sum + match.blessings.incense + match.blessings.mokugyo + match.blessings.beads,
        0
      ),
    [matches]
  );

  const chinaSpotlightMatches = useMemo(
    () => matches.filter(isChinaSpotlightMatch),
    [matches]
  );

  const lastMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  function formatUpdatedAt(value?: string) {
    if (!value) {
      return "刚刚更新";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  }

  function updateMatch(matchId: string, updater: (match: MatchItem) => MatchItem) {
    setMatches((current) => current.map((match) => (match.id === matchId ? updater(match) : match)));
  }

  function openMatch(matchId: string) {
    setSelectedMatchId(matchId);
    setIncenseLit(false);
    setWishInput("");
    resetCombo();
    router.push(`/match/${matchId}`);
  }

  function getTotalForMatch(match: MatchItem) {
    return match.blessings.incense + match.blessings.mokugyo + match.blessings.beads;
  }

  function getOpenLabel(match: MatchItem) {
    return match.status === "upcoming" ? "未开赛，已开放祈福" : "本场已开放祈福";
  }

  function getScoreSnapshot(match: MatchItem) {
    return `${match.teamA} ${match.scoreA}:${match.scoreB} ${match.teamB}`;
  }

  function getTopMessages(match: MatchItem) {
    return [...match.messages].sort((a, b) => b.likes - a.likes).slice(0, 3);
  }

  function triggerBurst(ritual: RitualType, text: string) {
    const node = burstRefs[ritual].current;
    if (!node) {
      return;
    }

    node.textContent = text;
    node.classList.remove("hidden", "show");
    void node.offsetWidth;
    node.classList.add("show");
    window.setTimeout(() => node.classList.add("hidden"), 900);
  }

  function resetCombo() {
    if (comboTimerRef.current) {
      window.clearTimeout(comboTimerRef.current);
    }
    setComboCount(0);
    setComboText("轻触开始，连击会为气运值加成。");
  }

  function registerCombo(ritual: RitualType) {
    if (comboTimerRef.current) {
      window.clearTimeout(comboTimerRef.current);
    }

    setComboCount((current) => {
      const next = current + 1;
      const text =
        next >= 5
          ? "连击很稳，这波会明显抬升比赛专属气运值。"
          : next >= 3
            ? "节奏起来了，继续祈福会有连击加成。"
            : "手感已热起来，再接几下会更有氛围。";

      setComboText(text);
      triggerBurst(ritual, next > 1 ? `${next} 连击，气运上扬` : `${ritualLabelMap[ritual]}起势`);
      return next;
    });

    comboTimerRef.current = window.setTimeout(() => {
      resetCombo();
    }, 2600);
  }

  async function addBlessing(ritual: RitualType) {
    if (!selectedMatch) {
      return;
    }

    // Best-effort: unlock audio on first user gesture (mobile autoplay restrictions).
    void primeSfx();

    const comboPreview = comboCount + 1;
    const fortuneBoost = comboPreview >= 5 ? 6 : comboPreview >= 3 ? 4 : 2;
    registerCombo(ritual);

    const optimistic = matches.map((match) =>
      match.id === selectedMatch.id
        ? {
            ...match,
            blessings: {
              ...match.blessings,
              [ritual]: match.blessings[ritual] + 1
            },
            fortune: Math.min(100, match.fortune + fortuneBoost),
            userSession: {
              ...match.userSession,
              blessings: match.userSession.blessings + 1,
              snapshotScore: getScoreSnapshot(match)
            }
          }
        : match
    );

    setMatches(optimistic);

    try {
      const response = await fetch("/api/blessings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatch.id, ritual })
      });

      const data = (await response.json()) as { match?: MatchItem };
      if (data.match) {
        updateMatch(selectedMatch.id, () => data.match as MatchItem);
      }
    } catch {
      setMatches(optimistic);
    }
  }

  function addBlessingWithSfx(ritual: RitualType) {
    void primeSfx();
    if (ritual === "beads") {
      playBeadsRelease();
    }
    addBlessing(ritual);
  }

  async function addMessage(modeType: "wish" | "repay") {
    if (!selectedMatch) {
      return;
    }

    const finalText =
      wishInput.trim() || (modeType === "repay" ? "谢谢这场比赛带来的起伏和热血，我来还愿了。" : "");

    if (!finalText) {
      setWishEcho("先写一句祈福留言，再发布会更有感觉。");
      return;
    }

    const ritualName = modeType === "repay" ? "还愿" : ritualLabelMap[activeRitual];
    const newMessage: Message = {
      id: `${selectedMatch.id}-${Date.now()}`,
      ritual: ritualName,
      user: "我",
      text: finalText,
      time: "刚刚",
      likes: modeType === "repay" ? 6 : 1,
      liked: false
    };

    const optimistic = matches.map((match) =>
      match.id === selectedMatch.id
        ? {
            ...match,
            messages: [newMessage, ...match.messages],
            fortune: Math.min(100, match.fortune + (modeType === "repay" ? 5 : 0)),
            userSession: {
              ...match.userSession,
              lastMessage: finalText,
              snapshotScore: getScoreSnapshot(match),
              repaid: modeType === "repay" ? true : match.userSession.repaid
            }
          }
        : match
    );

    setMatches(optimistic);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          ritualLabel: ritualName,
          text: finalText,
          isRepay: modeType === "repay"
        })
      });

      const data = (await response.json()) as { match?: MatchItem };
      if (data.match) {
        updateMatch(selectedMatch.id, () => data.match as MatchItem);
      }
    } catch {
      setMatches(optimistic);
    }

    setWishInput("");
  }

  async function likeMessage(messageId: string) {
    if (!selectedMatch) {
      return;
    }

    const optimistic = matches.map((match) =>
      match.id === selectedMatch.id
        ? {
            ...match,
            messages: match.messages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    liked: !message.liked,
                    likes: message.likes + (message.liked ? -1 : 1)
                  }
                : message
            )
          }
        : match
    );

    setMatches(optimistic);

    try {
      const response = await fetch(`/api/messages/${messageId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatch.id })
      });

      const data = (await response.json()) as { match?: MatchItem };
      if (data.match) {
        updateMatch(selectedMatch.id, () => data.match as MatchItem);
      }
    } catch {
      setMatches(optimistic);
    }
  }

  function triggerMokugyo() {
    void primeSfx();
    playMokugyoKnock(1);

    const node = mokugyoRef.current;
    if (node) {
      node.classList.remove("hit");
      void node.offsetWidth;
      node.classList.add("hit");
    }

    addBlessing("mokugyo");
  }

  function stopInertia() {
    if (inertiaFrameRef.current) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }

  function startInertia() {
    let velocity = 3;
    stopInertia();

    const step = () => {
      velocity *= 0.95;
      if (Math.abs(velocity) < 0.08) {
        inertiaFrameRef.current = null;
        return;
      }
      setRotation((current) => current + velocity);
      inertiaFrameRef.current = window.requestAnimationFrame(step);
    };

    inertiaFrameRef.current = window.requestAnimationFrame(step);
  }

  function handleDragStart(clientX: number) {
    void primeSfx();
    stopInertia();
    dragStateRef.current = { lastX: clientX, lastTime: Date.now() };
    beadsTickStrengthRef.current = 0;
  }

  function handleDragMove(clientX: number) {
    if (!dragStateRef.current) {
      return;
    }

    const deltaX = clientX - dragStateRef.current.lastX;
    setRotation((current) => current + deltaX * 0.7);

    const dt = Math.max(12, Date.now() - dragStateRef.current.lastTime);
    const speed = Math.abs(deltaX) / dt; // px/ms
    const strength = Math.min(1, speed * 2.6);
    // Gentle smoothing so it doesn't "chatter" when finger jitters.
    beadsTickStrengthRef.current = beadsTickStrengthRef.current * 0.6 + strength * 0.4;
    if (Math.abs(deltaX) > 1.2) {
      playBeadsTick(beadsTickStrengthRef.current);
    }

    dragStateRef.current = {
      lastX: clientX,
      lastTime: Date.now()
    };
  }

  function handleDragEnd() {
    if (!dragStateRef.current) {
      return;
    }
    dragStateRef.current = null;
    playBeadsRelease();
    addBlessing("beads");
    startInertia();
  }

  const homeContent = (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">赛事追踪</p>
          <h1>伦敦 2026 世锦赛</h1>
          <p className="hero-text">
            关注中国队重点对阵，实时查看比分并参与应援。
          </p>
          <div className="hero-meta">
            <span>赛事：ITTF World Team Table Tennis Championships Finals</span>
            <span>日期：2026 年 4 月 28 日 - 5 月 10 日</span>
            <span>地点：London</span>
          </div>
        </div>
      </header>

      <main className="layout single-column">
        <section className="panel china-spotlight-panel">
          <div className="panel-head">
            <div>
              <p className="kicker">China Focus</p>
              <h2>中国队专区</h2>
            </div>
            <span className="series-score">重点场次</span>
          </div>
          <div className="china-spotlight-grid">
            {chinaSpotlightMatches.map((match) => (
              <article key={match.id} className="china-spotlight-card">
                <div className="china-spotlight-head">
                  <span className="stage-badge">{match.group}</span>
                  <span className="series-score">{match.time}</span>
                </div>
                <h3>{match.teamA} vs {match.teamB}</h3>
                <p>{match.table} · {match.detail}</p>
                <div className="match-footer">
                  <div className="match-footer-left">
                    <span className="blessing-chip">实时祈福 {getTotalForMatch(match)}</span>
                    <span className="data-chip">气运 {match.fortune}</span>
                  </div>
                  <button className="bless-btn" type="button" onClick={() => openMatch(match.id)}>
                    进入应援
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );

  if (mode === "home") {
    return homeContent;
  }

  if (!selectedMatch) {
    return (
      <main className="app-shell">
        <section className="panel admin-panel">
          <p className="eyebrow">Match Not Found</p>
          <h1>这场比赛暂时不存在</h1>
          <div className="admin-actions">
            <Link href="/" className="back-btn">返回首页</Link>
          </div>
        </section>
      </main>
    );
  }

  const statusInfo = statusMap[selectedMatch.status];
  const topMessages = getTopMessages(selectedMatch);

  return (
    <div className="detail-shell">
      <header className="detail-header">
        <button
          className="back-btn"
          type="button"
          onClick={() => router.push("/")}
        >
          返回比赛列表
        </button>
        <div className="detail-head-copy">
          <p className="eyebrow">{selectedMatch.stage}</p>
          <h2>{selectedMatch.teamA} vs {selectedMatch.teamB}</h2>
          <p className="detail-meta">{selectedMatch.time} · {selectedMatch.detail}</p>
        </div>
      </header>

      <main className="detail-layout">
        <section className="panel score-panel">
          <div className="score-top">
            <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>
            <span className="series-score">{selectedMatch.table}</span>
          </div>
          <div className="score-board">
            <div className="score-team">
              <p>{selectedMatch.teamA}</p>
              <strong>{selectedMatch.scoreA}</strong>
            </div>
            <div className="score-divider">:</div>
            <div className="score-team">
              <p>{selectedMatch.teamB}</p>
              <strong>{selectedMatch.scoreB}</strong>
            </div>
          </div>
          <p className="detail-note">
            {selectedMatch.status === "upcoming"
              ? `${selectedMatch.note} · 比赛虽未开始，但已确定对阵，现已提前开放祈福。`
              : selectedMatch.status === "finished"
                ? `${selectedMatch.note} · 比赛已结束，可以赛后还愿并查看纪念卡。`
                : `${selectedMatch.note} · 本场当前开放全部祈福方式。`}
          </p>
          <div className="meta-strip">
            <span className="series-score">数据更新于 {formatUpdatedAt(selectedMatch.updatedAt)}</span>
            <span className="series-score">
              来源：{selectedMatch.sourceName ?? "待补充"}
            </span>
            {selectedMatch.sourceUrl ? (
              <a className="back-btn" href={selectedMatch.sourceUrl} target="_blank" rel="noreferrer">
                查看原始来源
              </a>
            ) : null}
          </div>

          <div className="live-metrics">
            <article className="metric-card">
              <p>比赛专属气运值</p>
              <strong>{selectedMatch.fortune}</strong>
              <div className="fortune-bar">
                <span style={{ width: `${Math.min(selectedMatch.fortune, 100)}%` }}></span>
              </div>
              <span className="metric-foot">本场气运值已被推到 {selectedMatch.fortune}，连击会有额外加成。</span>
            </article>
            <article className="metric-card">
              <p>一起上香</p>
              <strong>{onlineCount}</strong>
              <span className="metric-foot">此刻在线应援人数（打开本场页面即计入）。</span>
            </article>
          </div>
        </section>

        <section className="panel ritual-panel">
          <div className="panel-head">
            <div>
              <p className="kicker">Blessing Actions</p>
              <h2>祈福方式</h2>
            </div>
            <span className="series-score">本场祈福 {getTotalForMatch(selectedMatch)}</span>
          </div>

          <div className="ritual-tabs">
            {(["incense", "mokugyo", "beads"] as RitualType[]).map((ritual) => (
              <button
                key={ritual}
                className={`ritual-tab ${activeRitual === ritual ? "active" : ""}`}
                type="button"
                onClick={() => setActiveRitual(ritual)}
              >
                {ritualLabelMap[ritual]}
              </button>
            ))}
          </div>

          <div className="combo-panel">
            <div>
              <p className="combo-label">祈福动作连击</p>
              <strong>{comboCount} 连击</strong>
            </div>
            <span className="series-score">{comboText}</span>
          </div>

          {activeRitual === "incense" && (
            <div className="ritual-mode">
              <div className="incense-stage" aria-live="polite">
                <div ref={burstRefs.incense} className="combo-burst hidden"></div>
                <div className="altar-glow"></div>
                <div className="incense-stick">
                  <div className={`ember ${incenseLit ? "lit" : ""}`}></div>
                  <div className={`smoke ${incenseLit ? "" : "hidden"}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="ash-bowl"></div>
              </div>
              <button
                className="action-btn"
                type="button"
                onClick={() => {
                  void primeSfx();
                  const next = !incenseLit;
                  setIncenseLit(next);
                  if (next) {
                    playIncenseIgnite();
                    addBlessing("incense");
                  }
                }}
              >
                {incenseLit ? "收起香火" : "为本场烧香"}
              </button>
            </div>
          )}

          {activeRitual === "mokugyo" && (
            <div className="ritual-mode">
              <div className="mokugyo-stage">
                <div ref={burstRefs.mokugyo} className="combo-burst hidden"></div>
                <button ref={mokugyoRef} className="mokugyo" aria-label="敲木鱼" type="button" onClick={triggerMokugyo}>
                  <span className="mokugyo-top"></span>
                  <span className="mokugyo-hole"></span>
                  <span className="mallet"></span>
                </button>
              </div>
              <button className="action-btn secondary" type="button" onClick={triggerMokugyo}>
                为本场敲一下木鱼
              </button>
            </div>
          )}

          {activeRitual === "beads" && (
            <div className="ritual-mode">
              <div className="beads-stage app-stage">
                <div ref={burstRefs.beads} className="combo-burst hidden"></div>
                <div className="phone-shell">
                  <div className="phone-notch"></div>
                  <div
                    className="beads-touch-area"
                    onMouseDown={(event) => handleDragStart(event.clientX)}
                    onMouseMove={(event) => {
                      if ((event.buttons & 1) === 1) {
                        handleDragMove(event.clientX);
                      }
                    }}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
                    onTouchMove={(event) => handleDragMove(event.touches[0].clientX)}
                    onTouchEnd={handleDragEnd}
                  >
                    <div className="touch-hint">
                      <span className="touch-dot"></span>
                      <p>左右滑动手串，也可以点按钮记一次盘串祈福</p>
                    </div>
                    <div className="beads-ring" style={{ transform: `rotate(${rotation}deg)` }}>
                      {Array.from({ length: 18 }).map((_, index) => {
                        const angle = (Math.PI * 2 * index) / 18;
                        const x = Math.cos(angle) * 92;
                        const y = Math.sin(angle) * 92;
                        return (
                          <button
                            key={index}
                            type="button"
                            className="bead"
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                            aria-label={`第 ${index + 1} 颗珠`}
                            onClick={() => addBlessingWithSfx("beads")}
                          ></button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <button className="action-btn secondary" type="button" onClick={() => addBlessingWithSfx("beads")}>
                记一次盘串祈福
              </button>
            </div>
          )}
        </section>

        <section className="panel messages-panel">
          <div className="panel-head">
            <div>
              <p className="kicker">Community Wishes</p>
              <h2>大家的祈福留言</h2>
            </div>
          </div>

          <section className="floating-wall-panel">
            <div className="floating-head">
              <div>
                <p className="kicker">Top Wishes</p>
                <h3>留言漂浮墙</h3>
              </div>
              <span className="series-score">点赞靠前自动上墙</span>
            </div>
            <div className="floating-wall">
              {topMessages.map((message, index) => (
                <div
                  key={message.id}
                  className="floating-pill"
                  style={{ top: `${24 + index * 42}px`, animationDuration: `${12 + index * 2}s` }}
                >
                  <strong>{message.user}</strong>
                  <span>{message.text}</span>
                  <span>❤️ {message.likes}</span>
                </div>
              ))}
            </div>
          </section>

          <label className="wish-box" htmlFor="wishInput">
            <span>写一条想留在这场比赛里的话</span>
            <textarea
              id="wishInput"
              rows={4}
              placeholder="例如：愿关键分稳住，拿下这场。"
              value={wishInput}
              onChange={(event) => setWishInput(event.target.value)}
            ></textarea>
          </label>
          <div className="message-actions">
            <button className="action-btn" type="button" onClick={() => addMessage("wish")}>
              发布祈福留言
            </button>
            <button
              className={`back-btn ${selectedMatch.status === "finished" ? "" : "hidden"}`}
              type="button"
              onClick={() => addMessage("repay")}
            >
              赛后还愿
            </button>
          </div>
          <p className="wish-echo">{wishEcho}</p>

          <div className="messages-list">
            {[...selectedMatch.messages]
              .sort((a, b) => b.likes - a.likes)
              .map((message) => (
                <article key={message.id} className="message-card">
                  <div className="message-meta">
                    <span className="stage-badge">{message.ritual}</span>
                    <strong>{message.user}</strong>
                    <span>{message.time}</span>
                  </div>
                  <p>{message.text}</p>
                  <div className="message-tools">
                    <span className="series-score">点赞 {message.likes}</span>
                    <button
                      className={`like-btn ${message.liked ? "active" : ""}`}
                      type="button"
                      onClick={() => likeMessage(message.id)}
                    >
                      {message.liked ? "已点赞" : "点赞"}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className={`panel memorial-panel ${selectedMatch.status === "finished" ? "" : "hidden"}`}>
          <div className="panel-head">
            <div>
              <p className="kicker">Highlight Card</p>
              <h2>名场面纪念卡</h2>
            </div>
            <span className="series-score">赛后自动生成</span>
          </div>
          <div className="memorial-card">
            <p className="memorial-title">
              {selectedMatch.teamA} vs {selectedMatch.teamB} 的这场名局，已经自动生成你的赛后纪念卡。
            </p>
            <div className="memorial-grid">
              <div>
                <span>参与祈福</span>
                <strong>{selectedMatch.userSession.blessings} 次</strong>
              </div>
              <div>
                <span>留下的话</span>
                <strong>{selectedMatch.userSession.lastMessage || "你还没有留下专属的话"}</strong>
              </div>
              <div>
                <span>当时比分</span>
                <strong>{selectedMatch.userSession.snapshotScore || getScoreSnapshot(selectedMatch)}</strong>
              </div>
              <div>
                <span>是否还愿</span>
                <strong>{selectedMatch.userSession.repaid ? "已还愿" : "还未还愿"}</strong>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

function MatchCard({
  match,
  openMatch,
  getTotalForMatch,
  getOpenLabel
}: {
  match: MatchItem;
  openMatch: (matchId: string) => void;
  getTotalForMatch: (match: MatchItem) => number;
  getOpenLabel: (match: MatchItem) => string;
}) {
  const statusInfo = statusMap[match.status];

  return (
    <article className="match-card">
      <div className="match-top">
        <span className="stage-badge">{match.stage}</span>
        <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>
      </div>
      <div className="match-teams">
        <div className="team-row">
          <strong>{match.teamA}</strong>
          <span>{match.scoreA}</span>
        </div>
        <div className="team-row">
          <strong>{match.teamB}</strong>
          <span>{match.scoreB}</span>
        </div>
      </div>
      <p className="match-meta">{match.table} · {match.time} · {match.note}</p>
      <div className="match-footer">
        <div className="match-footer-left">
          <span className="blessing-chip">实时祈福 {getTotalForMatch(match)}</span>
          <span className="data-chip">气运 {match.fortune}</span>
          <span className="data-chip">实时祈福 {getTotalForMatch(match)}</span>
          <span className="blessing-chip open-chip">{getOpenLabel(match)}</span>
        </div>
        <button className="bless-btn" type="button" onClick={() => openMatch(match.id)}>
          进入应援
        </button>
      </div>
    </article>
  );
}
