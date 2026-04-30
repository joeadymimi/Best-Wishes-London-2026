const matches = [
  {
    id: "m1",
    phase: "group",
    group: "A 组",
    stage: "小组赛",
    status: "live",
    table: "Table 1",
    teamA: "中国",
    teamB: "日本",
    scoreA: 2,
    scoreB: 1,
    detail: "第 4 盘进行中",
    time: "进行中",
    note: "关键场，实时比分位",
    blessings: { incense: 128, mokugyo: 76, beads: 45 },
    togetherNow: 128,
    fortune: 76,
    messages: [
      { id: "m1-1", ritual: "烧香", user: "球迷 A", text: "愿关键分稳住，拿下最后两盘。", time: "1 分钟前", likes: 34, liked: false },
      { id: "m1-2", ritual: "木鱼", user: "球迷 B", text: "别急，节奏在自己手里。", time: "3 分钟前", likes: 21, liked: false },
      { id: "m1-3", ritual: "盘串", user: "球迷 F", text: "今天这场真的需要一点气运加持。", time: "9 分钟前", likes: 18, liked: false }
    ],
    userSession: { blessings: 0, lastMessage: "", snapshotScore: "", repaid: false }
  },
  {
    id: "m2",
    phase: "group",
    group: "B 组",
    stage: "小组赛",
    status: "upcoming",
    table: "Table 2",
    teamA: "韩国",
    teamB: "德国",
    scoreA: 0,
    scoreB: 0,
    detail: "预计 18:30 开始",
    time: "18:30",
    note: "待开赛",
    blessings: { incense: 34, mokugyo: 19, beads: 12 },
    togetherNow: 63,
    fortune: 48,
    messages: [
      { id: "m2-1", ritual: "盘串", user: "球迷 C", text: "希望今晚是一场高质量对攻。", time: "8 分钟前", likes: 12, liked: false }
    ],
    userSession: { blessings: 0, lastMessage: "", snapshotScore: "", repaid: false }
  },
  {
    id: "m3",
    phase: "knockout",
    bracketRound: "1/8 决赛",
    bracketColumn: "1/8 决赛",
    stage: "1/8 决赛",
    status: "finished",
    table: "Table 1",
    teamA: "法国",
    teamB: "中国台北",
    scoreA: 3,
    scoreB: 2,
    detail: "已结束",
    time: "16:10",
    note: "五盘大战",
    blessings: { incense: 56, mokugyo: 23, beads: 18 },
    togetherNow: 41,
    fortune: 89,
    messages: [
      { id: "m3-1", ritual: "烧香", user: "球迷 D", text: "这场真的太胶着了，双方都值得尊重。", time: "12 分钟前", likes: 29, liked: false },
      { id: "m3-2", ritual: "木鱼", user: "球迷 H", text: "这就是淘汰赛该有的张力。", time: "18 分钟前", likes: 17, liked: false }
    ],
    userSession: { blessings: 0, lastMessage: "", snapshotScore: "", repaid: false }
  },
  {
    id: "m4",
    phase: "group",
    group: "A 组",
    stage: "小组赛",
    status: "live",
    table: "Table 3",
    teamA: "瑞典",
    teamB: "巴西",
    scoreA: 1,
    scoreB: 1,
    detail: "第 3 盘进行中",
    time: "进行中",
    note: "胶着",
    blessings: { incense: 22, mokugyo: 14, beads: 9 },
    togetherNow: 52,
    fortune: 39,
    messages: [
      { id: "m4-1", ritual: "木鱼", user: "球迷 E", text: "这场节奏很快，愿别失误太多。", time: "5 分钟前", likes: 8, liked: false }
    ],
    userSession: { blessings: 0, lastMessage: "", snapshotScore: "", repaid: false }
  }
];

const groupStandings = [
  { name: "A 组", subtitle: "前二晋级淘汰赛", qualified: ["中国", "瑞典"] },
  { name: "B 组", subtitle: "前二晋级淘汰赛", qualified: ["韩国", "德国"] },
  { name: "C 组", subtitle: "前二晋级淘汰赛", qualified: ["法国", "中国台北"] },
  { name: "D 组", subtitle: "前二晋级淘汰赛", qualified: ["日本", "巴西"] }
];

const knockoutRounds = [
  { title: "1/8 决赛", items: ["A1 vs D2", "B1 vs C2", "C1 vs B2", "D1 vs A2"] },
  { title: "1/4 决赛", items: ["胜者 1 vs 胜者 2", "胜者 3 vs 胜者 4"] },
  { title: "半决赛 / 决赛", items: ["两场 1/4 决赛胜者进入半决赛", "半决赛胜者争冠"] }
];

const statusMap = {
  live: { label: "LIVE", className: "status-live" },
  upcoming: { label: "即将开始", className: "status-upcoming" },
  finished: { label: "已结束", className: "status-finished" }
};

const ritualLabelMap = { incense: "烧香", mokugyo: "木鱼", beads: "盘串" };

const homeView = document.querySelector("#homeView");
const detailView = document.querySelector("#detailView");
const groupStageBoard = document.querySelector("#groupStageBoard");
const knockoutBoard = document.querySelector("#knockoutBoard");
const totalBlessingCount = document.querySelector("#totalBlessingCount");

const backBtn = document.querySelector("#backBtn");
const detailStage = document.querySelector("#detailStage");
const detailTitle = document.querySelector("#detailTitle");
const detailMeta = document.querySelector("#detailMeta");
const detailStatus = document.querySelector("#detailStatus");
const detailTable = document.querySelector("#detailTable");
const teamAName = document.querySelector("#teamAName");
const teamAScore = document.querySelector("#teamAScore");
const teamBName = document.querySelector("#teamBName");
const teamBScore = document.querySelector("#teamBScore");
const detailNote = document.querySelector("#detailNote");
const detailBlessingCount = document.querySelector("#detailBlessingCount");
const fortuneValue = document.querySelector("#fortuneValue");
const fortuneFill = document.querySelector("#fortuneFill");
const fortuneText = document.querySelector("#fortuneText");
const togetherCount = document.querySelector("#togetherCount");
const togetherText = document.querySelector("#togetherText");
const comboValue = document.querySelector("#comboValue");
const comboText = document.querySelector("#comboText");

const ritualTabs = Array.from(document.querySelectorAll(".ritual-tab"));
const ritualPanels = {
  incense: document.querySelector("#incensePanel"),
  mokugyo: document.querySelector("#mokugyoPanel"),
  beads: document.querySelector("#beadsPanel")
};

const comboBursts = {
  incense: document.querySelector("#comboBurst"),
  mokugyo: document.querySelector("#mokugyoBurst"),
  beads: document.querySelector("#beadsBurst")
};

const ember = document.querySelector("#ember");
const smoke = document.querySelector("#smoke");
const igniteBtn = document.querySelector("#igniteBtn");
const mokugyoBtn = document.querySelector("#mokugyoBtn");
const mokugyoActionBtn = document.querySelector("#mokugyoActionBtn");
const beadsActionBtn = document.querySelector("#beadsActionBtn");
const wishInput = document.querySelector("#wishInput");
const submitWishBtn = document.querySelector("#submitWishBtn");
const repayWishBtn = document.querySelector("#repayWishBtn");
const wishEcho = document.querySelector("#wishEcho");
const messagesList = document.querySelector("#messagesList");
const floatingWall = document.querySelector("#floatingWall");

const memorialPanel = document.querySelector("#memorialPanel");
const memorialTitle = document.querySelector("#memorialTitle");
const memorialBlessings = document.querySelector("#memorialBlessings");
const memorialMessage = document.querySelector("#memorialMessage");
const memorialScore = document.querySelector("#memorialScore");
const memorialRepay = document.querySelector("#memorialRepay");

const beadsTouchArea = document.querySelector("#beadsTouchArea");
const beadsRing = document.querySelector("#beadsRing");

let selectedMatchId = null;
let activeRitual = "incense";
let incenseLit = false;
let rotation = 0;
let dragState = null;
let inertiaVelocity = 0;
let inertiaFrame = null;
let comboCount = 0;
let comboTimer = null;

function getMatchById(matchId) {
  return matches.find((match) => match.id === matchId) || null;
}

function getTotalForMatch(match) {
  return match.blessings.incense + match.blessings.mokugyo + match.blessings.beads;
}

function getAllBlessingsTotal() {
  return matches.reduce((sum, match) => sum + getTotalForMatch(match), 0);
}

function getScoreSnapshot(match) {
  return `${match.teamA} ${match.scoreA}:${match.scoreB} ${match.teamB}`;
}

function getTopMessages(match) {
  return [...match.messages].sort((a, b) => b.likes - a.likes).slice(0, 3);
}

function getOpenLabel(match) {
  return match.status === "upcoming" ? "未开赛，已开放祈福" : "本场已开放祈福";
}

function createMatchCard(match) {
  const article = document.createElement("article");
  const statusInfo = statusMap[match.status];

  article.className = "match-card";
  article.innerHTML = `
    <div class="match-top">
      <span class="stage-badge">${match.stage}</span>
      <span class="status-badge ${statusInfo.className}">${statusInfo.label}</span>
    </div>
    <div class="match-teams">
      <div class="team-row">
        <strong>${match.teamA}</strong>
        <span>${match.scoreA}</span>
      </div>
      <div class="team-row">
        <strong>${match.teamB}</strong>
        <span>${match.scoreB}</span>
      </div>
    </div>
    <p class="match-meta">${match.table} · ${match.time} · ${match.note}</p>
    <div class="match-footer">
      <div class="match-footer-left">
        <span class="blessing-chip">实时祈福 ${getTotalForMatch(match)}</span>
        <span class="data-chip">气运 ${match.fortune}</span>
        <span class="data-chip">${match.togetherNow} 人一起上香</span>
        <span class="blessing-chip open-chip">${getOpenLabel(match)}</span>
      </div>
      <button class="bless-btn" type="button" data-match-id="${match.id}">在线烧香</button>
    </div>
  `;

  return article;
}

function renderGroupBoard() {
  groupStageBoard.innerHTML = "";
  const groupGrid = document.createElement("div");
  groupGrid.className = "group-grid";

  groupStandings.forEach((groupInfo) => {
    const groupCard = document.createElement("section");
    groupCard.className = "group-card";
    groupCard.innerHTML = `
      <div class="group-card-header">
        <div>
          <h3>${groupInfo.name}</h3>
          <p class="group-subtitle">${groupInfo.subtitle}</p>
        </div>
        <span class="series-score">小组分区</span>
      </div>
    `;

    const matchesWrap = document.createElement("div");
    matchesWrap.className = "group-matches";

    matches
      .filter((match) => match.phase === "group" && match.group === groupInfo.name)
      .forEach((match) => matchesWrap.appendChild(createMatchCard(match)));

    const qualify = document.createElement("div");
    qualify.className = "group-qualify";
    qualify.innerHTML = "<p>当前晋级席位</p>";

    const qualifyList = document.createElement("div");
    qualifyList.className = "group-qualify-list";
    groupInfo.qualified.forEach((team) => {
      const chip = document.createElement("span");
      chip.className = "qualify-chip";
      chip.textContent = team;
      qualifyList.appendChild(chip);
    });

    qualify.appendChild(qualifyList);
    groupCard.append(matchesWrap, qualify);
    groupGrid.appendChild(groupCard);
  });

  groupStageBoard.appendChild(groupGrid);
}

function renderKnockoutBoard() {
  knockoutBoard.innerHTML = "";

  const header = document.createElement("div");
  header.className = "knockout-header";
  header.innerHTML = `
    <div>
      <h3>晋级路线</h3>
      <p class="knockout-subtitle">小组前二进入淘汰赛，逐轮决出冠军</p>
    </div>
    <span class="series-score">Knockout</span>
  `;

  const path = document.createElement("div");
  path.className = "knockout-path";

  knockoutRounds.forEach((round) => {
    const column = document.createElement("div");
    column.className = "path-column";

    const title = document.createElement("span");
    title.className = "path-column-title";
    title.textContent = round.title;
    column.appendChild(title);

    round.items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "path-match";
      card.innerHTML = `<p>晋级对阵位</p><strong>${item}</strong>`;
      column.appendChild(card);
    });

    if (round.title === "1/8 决赛") {
      matches
        .filter((match) => match.phase === "knockout")
        .forEach((match) => column.appendChild(createMatchCard(match)));
    }

    path.appendChild(column);
  });

  knockoutBoard.append(header, path);
}

function renderTotals() {
  totalBlessingCount.textContent = String(getAllBlessingsTotal());
}

function renderFloatingWall(match) {
  floatingWall.innerHTML = "";

  getTopMessages(match).forEach((message, index) => {
    const pill = document.createElement("div");
    pill.className = "floating-pill";
    pill.style.top = `${24 + index * 42}px`;
    pill.style.animationDuration = `${12 + index * 2}s`;
    pill.innerHTML = `<strong>${message.user}</strong><span>${message.text}</span><span>❤️ ${message.likes}</span>`;
    floatingWall.appendChild(pill);
  });
}

function renderMessages(match) {
  messagesList.innerHTML = "";

  [...match.messages]
    .sort((a, b) => b.likes - a.likes)
    .forEach((message) => {
      const item = document.createElement("article");
      item.className = "message-card";
      item.innerHTML = `
        <div class="message-meta">
          <span class="stage-badge">${message.ritual}</span>
          <strong>${message.user}</strong>
          <span>${message.time}</span>
        </div>
        <p>${message.text}</p>
        <div class="message-tools">
          <span class="series-score">点赞 ${message.likes}</span>
          <button class="like-btn ${message.liked ? "active" : ""}" type="button" data-message-id="${message.id}">
            ${message.liked ? "已点赞" : "点赞"}
          </button>
        </div>
      `;
      messagesList.appendChild(item);
    });

  renderFloatingWall(match);
}

function renderMemorial(match) {
  if (match.status !== "finished") {
    memorialPanel.classList.add("hidden");
    return;
  }

  memorialPanel.classList.remove("hidden");
  memorialTitle.textContent = `${match.teamA} vs ${match.teamB} 的这场名局，已经自动生成你的赛后纪念卡。`;
  memorialBlessings.textContent = `${match.userSession.blessings} 次`;
  memorialMessage.textContent = match.userSession.lastMessage || "你还没有留下专属的话";
  memorialScore.textContent = match.userSession.snapshotScore || getScoreSnapshot(match);
  memorialRepay.textContent = match.userSession.repaid ? "已还愿" : "还未还愿";
}

function renderDetail(match) {
  const statusInfo = statusMap[match.status];

  detailStage.textContent = match.stage;
  detailTitle.textContent = `${match.teamA} vs ${match.teamB}`;
  detailMeta.textContent = `${match.time} · ${match.detail}`;
  detailStatus.textContent = statusInfo.label;
  detailStatus.className = `status-badge ${statusInfo.className}`;
  detailTable.textContent = match.table;
  teamAName.textContent = match.teamA;
  teamAScore.textContent = String(match.scoreA);
  teamBName.textContent = match.teamB;
  teamBScore.textContent = String(match.scoreB);
  detailNote.textContent =
    match.status === "upcoming"
      ? `${match.note} · 比赛虽未开始，但已确定对阵，现已提前开放祈福。`
      : match.status === "finished"
        ? `${match.note} · 比赛已结束，可以赛后还愿并查看纪念卡。`
        : `${match.note} · 本场当前开放全部祈福方式。`;
  detailBlessingCount.textContent = `本场祈福 ${getTotalForMatch(match)}`;
  fortuneValue.textContent = String(match.fortune);
  fortuneFill.style.width = `${Math.min(match.fortune, 100)}%`;
  fortuneText.textContent = `本场气运值已被推到 ${match.fortune}，连击会有额外加成。`;
  togetherCount.textContent = String(match.togetherNow);
  togetherText.textContent = `此刻有 ${match.togetherNow} 人正在为这场比赛祈福。`;
  repayWishBtn.classList.toggle("hidden", match.status !== "finished");
  renderMessages(match);
  renderMemorial(match);
  updateWishHint();
}

function resetCombo() {
  comboCount = 0;
  comboValue.textContent = "0 连击";
  comboText.textContent = "轻触开始，连击会为气运值加成。";
}

function openDetail(matchId) {
  selectedMatchId = matchId;
  const match = getMatchById(matchId);

  if (!match) {
    return;
  }

  homeView.classList.add("hidden");
  detailView.classList.remove("hidden");
  incenseLit = false;
  ember.classList.remove("lit");
  smoke.classList.add("hidden");
  wishInput.value = "";
  resetCombo();
  renderDetail(match);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeDetail() {
  selectedMatchId = null;
  homeView.classList.remove("hidden");
  detailView.classList.add("hidden");
  resetCombo();
}

function setActiveRitual(ritual) {
  activeRitual = ritual;
  ritualTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.ritual === ritual);
  });
  Object.entries(ritualPanels).forEach(([key, panel]) => {
    panel.classList.toggle("hidden", key !== ritual);
  });
  updateWishHint();
}

function updateWishHint() {
  const match = getMatchById(selectedMatchId);

  if (!match) {
    wishEcho.textContent = "可以边祈福边留言，大家会一起看到。";
    return;
  }

  const ritualName = ritualLabelMap[activeRitual];
  wishEcho.textContent = `你正在为 ${match.teamA} vs ${match.teamB} 使用${ritualName}祈福，也可以顺手留一句话。`;
}

function triggerBurst(ritual, combo) {
  const burst = comboBursts[ritual];

  if (!burst) {
    return;
  }

  burst.textContent = combo > 1 ? `${combo} 连击，气运上扬` : `${ritualLabelMap[ritual]}起势`;
  burst.classList.remove("hidden", "show");
  void burst.offsetWidth;
  burst.classList.add("show");
  window.setTimeout(() => burst.classList.add("hidden"), 900);
}

function registerCombo(ritual) {
  if (comboTimer) {
    window.clearTimeout(comboTimer);
  }

  comboCount += 1;
  comboValue.textContent = `${comboCount} 连击`;
  comboText.textContent =
    comboCount >= 5
      ? "连击很稳，这波会明显抬升比赛专属气运值。"
      : comboCount >= 3
        ? "节奏起来了，继续祈福会有连击加成。"
        : "手感已热起来，再接几下会更有氛围。";

  triggerBurst(ritual, comboCount);

  comboTimer = window.setTimeout(() => {
    resetCombo();
  }, 2600);

  return comboCount;
}

function addBlessing(ritual) {
  const match = getMatchById(selectedMatchId);

  if (!match) {
    return;
  }

  const combo = registerCombo(ritual);
  const fortuneBoost = combo >= 5 ? 6 : combo >= 3 ? 4 : 2;

  match.blessings[ritual] += 1;
  match.togetherNow += 1;
  match.fortune = Math.min(100, match.fortune + fortuneBoost);
  match.userSession.blessings += 1;
  match.userSession.snapshotScore = getScoreSnapshot(match);

  renderGroupBoard();
  renderKnockoutBoard();
  renderTotals();
  renderDetail(match);
}

function addMessage(mode = "wish") {
  const match = getMatchById(selectedMatchId);
  const text = wishInput.value.trim();

  if (!match) {
    return;
  }

  if (!text && mode !== "repay") {
    wishEcho.textContent = "先写一句祈福留言，再发布会更有感觉。";
    return;
  }

  const finalText = text || "谢谢这场比赛带来的起伏和热血，我来还愿了。";
  const ritualName = mode === "repay" ? "还愿" : ritualLabelMap[activeRitual];

  match.messages.unshift({
    id: `${match.id}-${Date.now()}`,
    ritual: ritualName,
    user: "我",
    text: finalText,
    time: "刚刚",
    likes: mode === "repay" ? 6 : 1,
    liked: false
  });

  match.userSession.lastMessage = finalText;
  match.userSession.snapshotScore = getScoreSnapshot(match);

  if (mode === "repay") {
    match.userSession.repaid = true;
    match.fortune = Math.min(100, match.fortune + 5);
  }

  wishInput.value = "";
  renderDetail(match);
}

function likeMessage(messageId) {
  const match = getMatchById(selectedMatchId);

  if (!match) {
    return;
  }

  const message = match.messages.find((item) => item.id === messageId);

  if (!message) {
    return;
  }

  message.liked = !message.liked;
  message.likes += message.liked ? 1 : -1;
  renderDetail(match);
}

function buildBeads() {
  const total = 18;
  const radius = 92;

  for (let index = 0; index < total; index += 1) {
    const bead = document.createElement("button");
    const angle = (Math.PI * 2 * index) / total;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    bead.className = "bead";
    bead.type = "button";
    bead.style.transform = `translate(${x}px, ${y}px)`;
    bead.setAttribute("aria-label", `第 ${index + 1} 颗珠`);

    bead.addEventListener("click", () => {
      addBlessing("beads");
      bead.classList.add("active");
      window.setTimeout(() => bead.classList.remove("active"), 360);
    });

    beadsRing.appendChild(bead);
  }
}

function applyRingRotation(angle) {
  rotation = angle;
  beadsRing.style.transform = `rotate(${rotation}deg)`;
}

function stopInertia() {
  if (inertiaFrame) {
    window.cancelAnimationFrame(inertiaFrame);
    inertiaFrame = null;
  }
}

function startInertia() {
  stopInertia();

  const step = () => {
    inertiaVelocity *= 0.95;
    if (Math.abs(inertiaVelocity) < 0.08) {
      inertiaFrame = null;
      return;
    }
    applyRingRotation(rotation + inertiaVelocity);
    inertiaFrame = window.requestAnimationFrame(step);
  };

  inertiaFrame = window.requestAnimationFrame(step);
}

function getClientX(event) {
  if ("touches" in event && event.touches.length > 0) {
    return event.touches[0].clientX;
  }

  if ("changedTouches" in event && event.changedTouches.length > 0) {
    return event.changedTouches[0].clientX;
  }

  return event.clientX;
}

function handleDragStart(event) {
  stopInertia();
  dragState = { lastX: getClientX(event), lastTime: Date.now() };
}

function handleDragMove(event) {
  if (!dragState) {
    return;
  }

  const currentX = getClientX(event);
  const deltaX = currentX - dragState.lastX;
  const now = Date.now();
  const deltaTime = Math.max(now - dragState.lastTime, 16);

  applyRingRotation(rotation + deltaX * 0.7);
  inertiaVelocity = (deltaX / deltaTime) * 18;
  dragState.lastX = currentX;
  dragState.lastTime = now;
}

function handleDragEnd() {
  if (!dragState) {
    return;
  }

  dragState = null;
  addBlessing("beads");
  startInertia();
}

document.body.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const matchButton = target.closest("[data-match-id]");
  if (matchButton) {
    const matchId = matchButton.getAttribute("data-match-id");
    if (matchId) {
      openDetail(matchId);
    }
    return;
  }

  const likeButton = target.closest("[data-message-id]");
  if (likeButton) {
    const messageId = likeButton.getAttribute("data-message-id");
    if (messageId) {
      likeMessage(messageId);
    }
  }
});

backBtn.addEventListener("click", closeDetail);

ritualTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const ritual = tab.dataset.ritual;
    if (ritual) {
      setActiveRitual(ritual);
    }
  });
});

igniteBtn.addEventListener("click", () => {
  incenseLit = !incenseLit;
  ember.classList.toggle("lit", incenseLit);
  smoke.classList.toggle("hidden", !incenseLit);
  igniteBtn.textContent = incenseLit ? "收起香火" : "为本场烧香";
  if (incenseLit) {
    addBlessing("incense");
  }
});

function triggerMokugyo() {
  mokugyoBtn.classList.remove("hit");
  void mokugyoBtn.offsetWidth;
  mokugyoBtn.classList.add("hit");
  addBlessing("mokugyo");
}

mokugyoBtn.addEventListener("click", triggerMokugyo);
mokugyoActionBtn.addEventListener("click", triggerMokugyo);
beadsActionBtn.addEventListener("click", () => addBlessing("beads"));
submitWishBtn.addEventListener("click", () => addMessage("wish"));
repayWishBtn.addEventListener("click", () => addMessage("repay"));

beadsTouchArea.addEventListener("mousedown", handleDragStart);
window.addEventListener("mousemove", handleDragMove);
window.addEventListener("mouseup", handleDragEnd);
beadsTouchArea.addEventListener("touchstart", handleDragStart, { passive: true });
beadsTouchArea.addEventListener("touchmove", handleDragMove, { passive: true });
beadsTouchArea.addEventListener("touchend", handleDragEnd);
beadsTouchArea.addEventListener("touchcancel", handleDragEnd);

buildBeads();
applyRingRotation(0);
renderGroupBoard();
renderKnockoutBoard();
renderTotals();
setActiveRitual("incense");
