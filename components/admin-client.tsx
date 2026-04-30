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
