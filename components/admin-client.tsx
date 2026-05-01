"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MatchItem } from "@/lib/types";

type EditableMatch = {
  status: MatchItem["status"];
  scoreA: number;
  scoreB: number;
  detail: string;
  time: string;
  note: string;
  sourceName: string;
  sourceUrl: string;
};

export function AdminClient() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<EditableMatch | null>(null);
  const [feedback, setFeedback] = useState("正在加载比赛数据...");
  const [analytics, setAnalytics] = useState<{
    timezone: string;
    total: number;
    today: number;
    last7Days: Array<{ day: string; count: number }>;
  } | null>(null);
  const [diagnostics, setDiagnostics] = useState<{
    nodeEnv: string;
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
    serverClientReady: boolean;
    canSelectMatches: boolean | null;
    canSelectBlessings: boolean | null;
  } | null>(null);

  useEffect(() => {
    async function loadMatches() {
      const response = await fetch("/api/matches", { cache: "no-store" });
      const data = (await response.json()) as { matches?: MatchItem[] };
      const nextMatches = data.matches ?? [];
      setMatches(nextMatches);
      if (nextMatches[0]) {
        setSelectedId(nextMatches[0].id);
      }
      setFeedback(nextMatches.length ? "选择一场比赛后即可更新比分和来源。" : "当前没有比赛数据。");
    }

    void loadMatches();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const data = (await response.json()) as {
        timezone?: string;
        total?: number;
        today?: number;
        last7Days?: Array<{ day: string; count: number }>;
      };
      setAnalytics({
        timezone: data.timezone ?? "Asia/Shanghai",
        total: data.total ?? 0,
        today: data.today ?? 0,
        last7Days: data.last7Days ?? []
      });
    }
    void loadAnalytics();
  }, []);

  useEffect(() => {
    async function loadDiagnostics() {
      const response = await fetch("/api/admin/diagnostics", { cache: "no-store" });
      const data = (await response.json()) as {
        nodeEnv?: string;
        hasSupabaseUrl?: boolean;
        hasAnonKey?: boolean;
        hasServiceRoleKey?: boolean;
        serverClientReady?: boolean;
        canSelectMatches?: boolean | null;
        canSelectBlessings?: boolean | null;
      };
      setDiagnostics({
        nodeEnv: data.nodeEnv ?? "",
        hasSupabaseUrl: Boolean(data.hasSupabaseUrl),
        hasAnonKey: Boolean(data.hasAnonKey),
        hasServiceRoleKey: Boolean(data.hasServiceRoleKey),
        serverClientReady: Boolean(data.serverClientReady),
        canSelectMatches: data.canSelectMatches ?? null,
        canSelectBlessings: data.canSelectBlessings ?? null
      });
    }
    void loadDiagnostics();
  }, []);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedId) ?? null,
    [matches, selectedId]
  );

  useEffect(() => {
    if (!selectedMatch) {
      setForm(null);
      return;
    }

    setForm({
      status: selectedMatch.status,
      scoreA: selectedMatch.scoreA,
      scoreB: selectedMatch.scoreB,
      detail: selectedMatch.detail,
      time: selectedMatch.time,
      note: selectedMatch.note,
      sourceName: "草莓牛奶特别甜",
      sourceUrl: ""
    });
  }, [selectedMatch]);

  async function handleSave() {
    if (!selectedMatch || !form) {
      return;
    }

    setFeedback("正在保存更新...");

    const response = await fetch(`/api/admin/matches/${selectedMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = (await response.json()) as { match?: MatchItem; error?: string };

    if (!response.ok || !data.match) {
      setFeedback(data.error ?? "保存失败，请稍后重试。");
      return;
    }

    setMatches((current) =>
      current.map((match) => (match.id === selectedMatch.id ? data.match! : match))
    );
    setFeedback(`已更新 ${data.match.teamA} vs ${data.match.teamB}。`);
  }

  return (
    <main className="app-shell">
      <section className="panel admin-panel">
        <p className="eyebrow">Admin Console</p>
        <h1>比赛管理</h1>
        <p className="hero-text">
          这版后台先聚焦测试上线最关键的能力：更新比分、比赛状态、备注和来源链接。
        </p>
        <div className="admin-actions">
          <Link href="/" className="back-btn">
            返回前台首页
          </Link>
          <span className="series-score">{feedback}</span>
        </div>
      </section>

      <section className="panel admin-panel">
        <p className="eyebrow">Analytics</p>
        <h2>访问量</h2>
        <p className="hero-text">统计口径：每次打开页面（30 分钟内同一路径去重）。时区：{analytics?.timezone ?? "Asia/Shanghai"}。</p>
        <div className="admin-actions">
          <span className="series-score">总访问量：{analytics?.total ?? 0}</span>
          <span className="series-score">今日访问量：{analytics?.today ?? 0}</span>
        </div>
        {diagnostics ? (
          <div className="admin-actions">
            <span className="series-score">
              数据源：Supabase {diagnostics.serverClientReady ? "已连接" : "未连接"}（URL {diagnostics.hasSupabaseUrl ? "OK" : "缺失"}，Anon {diagnostics.hasAnonKey ? "OK" : "缺失"}，Service Role {diagnostics.hasServiceRoleKey ? "OK" : "缺失"}）
            </span>
          </div>
        ) : null}
        {analytics?.last7Days?.length ? (
          <div className="admin-actions">
            <span className="series-score">
              近 7 天：{analytics.last7Days.map((d) => `${d.day} ${d.count}`).join(" · ")}
            </span>
          </div>
        ) : null}
      </section>

      <section className="panel admin-grid">
        <div className="admin-list">
          <div className="panel-head">
            <div>
              <p className="kicker">Matches</p>
              <h2>比赛列表</h2>
            </div>
          </div>
          <div className="admin-match-list">
            {matches.map((match) => (
              <button
                key={match.id}
                type="button"
                className={`admin-match-item ${selectedId === match.id ? "active" : ""}`}
                onClick={() => setSelectedId(match.id)}
              >
                <strong>{match.teamA} vs {match.teamB}</strong>
                <span>{match.stage} · {match.time}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-editor">
          <div className="panel-head">
            <div>
              <p className="kicker">Editor</p>
              <h2>更新内容</h2>
            </div>
          </div>

          {form && selectedMatch ? (
            <div className="admin-form">
              <label>
                <span>比赛状态</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, status: event.target.value as MatchItem["status"] } : current)
                  }
                >
                  <option value="upcoming">即将开始</option>
                  <option value="live">进行中</option>
                  <option value="finished">已结束</option>
                </select>
              </label>
              <label>
                <span>{selectedMatch.teamA} 比分</span>
                <input
                  type="number"
                  value={form.scoreA}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, scoreA: Number(event.target.value) } : current)
                  }
                />
              </label>
              <label>
                <span>{selectedMatch.teamB} 比分</span>
                <input
                  type="number"
                  value={form.scoreB}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, scoreB: Number(event.target.value) } : current)
                  }
                />
              </label>
              <label>
                <span>当前说明</span>
                <input
                  value={form.detail}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, detail: event.target.value } : current)
                  }
                />
              </label>
              <label>
                <span>时间标签</span>
                <input
                  value={form.time}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, time: event.target.value } : current)
                  }
                />
              </label>
              <label>
                <span>备注</span>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, note: event.target.value } : current)
                  }
                />
              </label>
              <label>
                <span>来源名称</span>
                <input
                  value={form.sourceName}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, sourceName: event.target.value } : current)
                  }
                />
              </label>
              <label>
                <span>来源链接</span>
                <input
                  value={form.sourceUrl}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, sourceUrl: event.target.value } : current)
                  }
                />
              </label>
              <button type="button" className="action-btn" onClick={handleSave}>
                保存比赛更新
              </button>
            </div>
          ) : (
            <p className="hero-text">请选择一场比赛开始编辑。</p>
          )}
        </div>
      </section>
    </main>
  );
}
