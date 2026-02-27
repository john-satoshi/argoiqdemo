import { renderSharedNavbar } from "./shared-navbar.js";
import { themePacks, scenarios } from "./dashboard-config.js";
import { createRuntimeStore } from "./dashboard-store.js";
import { buildRouteWithProfile, initPresenterPanel } from "./presenter-controls.js";

renderSharedNavbar({ active: "feeds", logoTriggerId: "presenterLogoTrigger" });
const store = createRuntimeStore();

const el = {
  navDashboard: document.getElementById("navDashboard"),
  navFeeds: document.getElementById("navFeeds"),
  navInsight: document.getElementById("navInsight"),
  chatInput: document.getElementById("logsChatInput"),
  chatSend: document.querySelector(".floating-chat-send"),
  title: document.getElementById("logsWorkflowTitle"),
  tag: document.getElementById("logsWorkflowTag"),
  description: document.getElementById("logsWorkflowDescription"),
  labelActive: document.getElementById("logsLabelActive"),
  labelCompleted: document.getElementById("logsLabelCompleted"),
  labelEta: document.getElementById("logsLabelEta"),
  labelOperators: document.getElementById("logsLabelOperators"),
  metricActive: document.getElementById("logsMetricActive"),
  metricCompleted: document.getElementById("logsMetricCompleted"),
  metricEta: document.getElementById("logsMetricEta"),
  metricOperators: document.getElementById("logsMetricOperators"),
  operatorAvatars: document.getElementById("logsOperatorAvatars"),
  kpiAccuracy: document.getElementById("logsKpiAccuracy"),
  kpiAccuracyDelta: document.getElementById("logsKpiAccuracyDelta"),
  kpiCycle: document.getElementById("logsKpiCycle"),
  kpiCycleDelta: document.getElementById("logsKpiCycleDelta"),
  kpiCost: document.getElementById("logsKpiCost"),
  kpiCases24h: document.getElementById("logsKpiCases24h"),
  tabAll: document.getElementById("logsTabAll"),
  tabFlagged: document.getElementById("logsTabFlagged"),
  tableRows: document.getElementById("logsTableRows"),
  presenterPanel: document.getElementById("presenterPanel"),
  presenterTheme: document.getElementById("presenterTheme"),
  presenterScenario: document.getElementById("presenterScenario"),
  presenterSpeed: document.getElementById("presenterSpeed"),
  presenterReset: document.getElementById("presenterReset"),
  presenterFreeze: document.getElementById("presenterFreeze"),
  presenterShare: document.getElementById("presenterShare"),
  presenterClose: document.getElementById("presenterClose"),
  presenterLogoTrigger: document.getElementById("presenterLogoTrigger"),
};
const logsOperatorAvatarUrls = el.operatorAvatars
  ? Array.from(el.operatorAvatars.querySelectorAll(".workflow-avatar"))
      .map((avatar) => avatar.style.backgroundImage)
      .filter((value) => typeof value === "string" && value.trim().length > 0)
  : [];

const FEED_THEME_OVERRIDES = {
  healthcare: { badge: "Healthcare" },
  smb: { badge: "Ops" },
  future: { badge: "Supervisor" },
};

const OPERATOR_DIRECTORY = [
  { name: "James Smith", avatar: "Frame 1000002674.jpg" },
  { name: "Noah Wilson", avatar: "Frame 1000002696.jpg" },
  { name: "Adam Smith", avatar: "Frame 1000002697.jpg" },
  { name: "Aria Kim", avatar: "Frame 1000002698.jpg" },
  { name: "Sarah Jones", avatar: "Frame 1000002699.jpg" },
  { name: "Olivia Green", avatar: "Frame 1000002700.jpg" },
  { name: "Sophia Lee", avatar: "Frame 1000002701.jpg" },
  { name: "Ava Martinez", avatar: "Frame 1000002702.jpg" },
];

function getMaxVisibleLogRows() {
  if (window.innerHeight <= 820) return 8;
  if (window.innerHeight <= 920) return 9;
  if (window.innerHeight <= 1020) return 10;
  return 12;
}

const state = {
  currentTab: "all",
  fullRows: [],
  fullFlaggedRows: [],
  rows: [],
  flaggedRows: [],
  visibleRowCount: 0,
  operatorAssignmentById: {},
  live: {
    active: 27,
    completed: 143,
    etaSeconds: 60,
    accuracyPct: 98.6,
    accuracyDeltaPct: 0.4,
    avgCycleSeconds: 102,
    cycleDeltaSeconds: 18,
    costSaved: 14320,
    cases24h: 286,
  },
  metricDue: {},
};

function isFrozen() {
  return store.getState().frozen;
}

function buildOperatorRoute(claimId) {
  const url = new URL(buildRouteWithProfile("./operator.html", store.getState()));
  url.searchParams.set("operator", "James Smith");
  url.searchParams.set("claim", claimId);
  return url.toString();
}

function setText(node, value) {
  if (!node) return;
  node.textContent = value;
}

function syncOperatorAvatars(container, avatarUrls, count) {
  if (!container) return;
  const limit = Math.max(0, Math.min(count, avatarUrls.length));
  container.innerHTML = "";
  for (const backgroundImage of avatarUrls.slice(0, limit)) {
    const avatar = document.createElement("span");
    avatar.className = "workflow-avatar";
    avatar.style.backgroundImage = backgroundImage;
    container.appendChild(avatar);
  }
}

function formatEta(seconds) {
  if (seconds >= 60) return `${Math.ceil(seconds / 60)}m`;
  return `${seconds}s`;
}

function formatCycle(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatMoney(value) {
  return `$${value.toLocaleString("en-US")}`;
}

function formatShortTimer(seconds) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickOperatorForRow(row) {
  const existing = state.operatorAssignmentById[row.id];
  if (existing) return existing;
  const seed = Array.from(String(row.id || ""))
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const person = OPERATOR_DIRECTORY[seed % OPERATOR_DIRECTORY.length];
  const assigned = {
    name: person.name,
    avatar: `./Assets:ProfilePicture/${person.avatar}`,
  };
  state.operatorAssignmentById[row.id] = assigned;
  return assigned;
}

function pulse(node) {
  if (!node) return;
  node.classList.remove("metric-updated");
  window.requestAnimationFrame(() => node.classList.add("metric-updated"));
}

function getStagesForTheme(themeId) {
  if (themeId === "healthcare") {
    return ["Input normalization", "Validation", "Record verification", "Evaluation pass"];
  }
  if (themeId === "future") {
    return ["Signal intake", "Policy validation", "Record verification", "Evaluation pass"];
  }
  return ["Input normalization", "Validation", "Record verification", "Evaluation pass"];
}

function buildRows(theme, scenario) {
  const stages = getStagesForTheme(theme.id);
  const prefix = theme.entityNaming.idPrefixes?.[0] || "ITEM";
  const runningCount = scenario.mode === "flagged" ? 6 : scenario.mode === "mixed" ? 5 : 4;
  const totalCount = 15;
  const rows = [];
  let idBase = 128394;

  for (let i = 0; i < totalCount; i += 1) {
    const id = `${prefix}-${idBase - i}`;
    if (i < runningCount) {
      rows.push({
        id,
        status: "in_progress",
        stage: pick(stages),
        progress: Math.round(randBetween(12, 86)),
        confidence: null,
        confidenceTone: "neutral",
        demoConfidenceTarget: null,
        demoConfidenceStartAt: Math.round(randBetween(4, 9)),
        operatorAssignDelaySeconds: Math.round(randBetween(3, 6)),
        operatorAssignAtElapsed: null,
        operator: null,
        runtimeSeconds: Math.round(randBetween(1, 3)),
        elapsedSeconds: 0,
        flagged: true,
      });
      continue;
    }

    const confidence = Math.round(randBetween(92, 99));
    const operatorAssigned = confidence < 95 || Math.random() > 0.62;
    rows.push({
      id,
      status: "completed",
      stage: pick(stages),
      progress: 100,
      confidence,
      confidenceTone: "good",
      operator: operatorAssigned
        ? (() => {
            const person = pick(OPERATOR_DIRECTORY);
            return {
              name: person.name,
              avatar: `./Assets:ProfilePicture/${person.avatar}`,
            };
          })()
        : null,
      runtimeSeconds: Math.round(randBetween(70, 320)),
      flagged: confidence < 95,
    });
  }

  // During demo playback, let two running items evolve into warning/risk confidence states.
  const runningRows = rows.filter((row) => row.status === "in_progress");
  if (runningRows[0]) {
    runningRows[0].demoConfidenceTarget = { tone: "warning", value: 81 };
  }
  if (runningRows[1]) {
    runningRows[1].demoConfidenceTarget = { tone: "risk", value: 62 };
  }

  return rows;
}

function toneFromConfidence(confidence) {
  if (confidence < 50) return "risk";
  if (confidence < 85) return "warning";
  return "good";
}

function buildFlaggedRows(theme) {
  const stages = getStagesForTheme(theme.id);
  const prefix = theme.entityNaming.idPrefixes?.[0] || "ITEM";
  const stageSequence = [
    stages[0] || "Input normalization",
    stages[0] || "Input normalization",
    stages[0] || "Input normalization",
    stages[1] || "Validation",
    stages[2] || "Record verification",
    stages[1] || "Validation",
    stages[3] || "Evaluation pass",
    stages[2] || "Record verification",
    stages[3] || "Evaluation pass",
    stages[1] || "Validation",
    stages[0] || "Input normalization",
    stages[2] || "Record verification",
    stages[3] || "Evaluation pass",
    stages[1] || "Validation",
    stages[0] || "Input normalization",
  ];
  const confidenceValues = [69, 48, 67, 53, 62, 79, 76, 61, 77, 73, 49, 60, 48];
  const runtimeValues = [250, 300, 615, 450, 285, 740, 360, 515, 550, 205, 710, 355, 160];
  const rows = [];

  // Top two flagged items keep running, then transition to warning/risk.
  for (let i = 0; i < 2; i += 1) {
    const id = `${prefix}-${128390 - i}`;
    rows.push({
      id,
      status: "in_progress",
      stage: stageSequence[i],
      progress: i === 0 ? 58 : 46,
      confidence: null,
      confidenceTone: "neutral",
      demoConfidenceTarget: i === 0 ? { tone: "warning", value: 69 } : { tone: "risk", value: 48 },
      demoConfidenceStartAt: 5 + i,
      operatorAssignDelaySeconds: i === 0 ? 4 : 6,
      operatorAssignAtElapsed: null,
      operator: null,
      runtimeSeconds: 1 + i * 2,
      elapsedSeconds: 0,
      flagged: true,
    });
  }

  for (let i = 0; i < confidenceValues.length; i += 1) {
    const confidence = confidenceValues[i];
    const id = `${prefix}-${128388 - i}`;
    const row = {
      id,
      status: "completed",
      stage: stageSequence[i + 2] || (stages[0] || "Input normalization"),
      progress: 100,
      confidence,
      confidenceTone: toneFromConfidence(confidence),
      operator: null,
      runtimeSeconds: runtimeValues[i] || Math.round(randBetween(180, 700)),
      flagged: true,
    };
    row.operator = pickOperatorForRow(row);
    rows.push(row);
  }

  return rows;
}

function renderLiveMetrics() {
  setText(el.metricActive, String(state.live.active));
  setText(el.metricCompleted, String(state.live.completed));
  setText(el.metricEta, formatEta(state.live.etaSeconds));
  setText(el.kpiAccuracy, `${state.live.accuracyPct.toFixed(1)}%`);
  setText(el.kpiAccuracyDelta, `${state.live.accuracyDeltaPct >= 0 ? "+" : ""}${state.live.accuracyDeltaPct.toFixed(1)}%`);
  setText(el.kpiCycle, formatCycle(state.live.avgCycleSeconds));
  setText(el.kpiCycleDelta, `${Math.max(1, state.live.cycleDeltaSeconds)}s`);
  setText(el.kpiCost, formatMoney(state.live.costSaved));
  setText(el.kpiCases24h, String(state.live.cases24h));
}

function renderRows() {
  if (!el.tableRows) return;
  const rows = state.currentTab === "flagged" ? state.flaggedRows : state.rows;
  el.tableRows.innerHTML = rows
    .map((row, rowIndex) => {
      const statusClass = row.status === "in_progress" ? "is-running" : "is-completed";
      const statusText = row.status === "in_progress" ? "In progress" : "Completed";
      const isOperatorLaunchRow = rowIndex < 2;
      const rowRoute = isOperatorLaunchRow ? buildOperatorRoute(row.id) : "";
      const idCell = isOperatorLaunchRow
        ? `<button class="logs-row-link-btn" type="button" data-operator-route="${rowRoute}">${row.id}</button>`
        : row.id;
      const progressCell =
        row.status === "in_progress"
          ? `<div class="logs-progress"><span class="logs-progress-track" style="width:${row.progress}%"></span></div>`
          : `<div class="logs-progress logs-progress--empty"></div>`;
      const confidenceText = row.confidence == null ? "...%" : `${row.confidence}%`;
      const confidenceClass = `is-${row.confidenceTone || (row.confidence == null ? "neutral" : "good")}`;
      const operatorCell = row.operator
        ? `<div class="logs-operator"><span class="logs-operator-avatar" style="background-image:url('${encodeURI(row.operator.avatar)}')"></span><span>${row.operator.name}</span></div>`
        : `<div class="logs-operator logs-operator--empty"></div>`;
      const runtimeCell =
        row.status === "in_progress"
          ? `<div class="logs-runtime"><span class="logs-runtime-pill">${formatShortTimer(row.runtimeSeconds)}</span></div>`
          : `<div class="logs-runtime"><span>${formatDuration(row.runtimeSeconds)}</span></div>`;

      return `
        <article class="logs-row ${isOperatorLaunchRow ? "is-clickable" : ""}" ${isOperatorLaunchRow ? `data-operator-route="${rowRoute}"` : ""}>
          <div class="logs-col logs-col-id">${idCell}</div>
          <div class="logs-col logs-col-status"><span class="logs-status ${statusClass}">${statusText}</span></div>
          <div class="logs-col logs-col-stage">${row.stage}</div>
          <div class="logs-col logs-col-progress">${progressCell}</div>
          <div class="logs-col logs-col-confidence"><span>Confident score:</span><span class="logs-confidence ${confidenceClass}">${confidenceText}</span></div>
          <div class="logs-col logs-col-operator">${operatorCell}</div>
          <div class="logs-col logs-col-runtime">${runtimeCell}</div>
        </article>
      `;
    })
    .join("");

  el.tableRows.querySelectorAll(".logs-row-link-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const route = btn.getAttribute("data-operator-route");
      if (route) window.location.href = route;
    });
  });

  el.tableRows.querySelectorAll(".logs-row.is-clickable").forEach((rowEl) => {
    rowEl.addEventListener("click", () => {
      const route = rowEl.getAttribute("data-operator-route");
      if (route) window.location.href = route;
    });
  });
}

function syncVisibleRows() {
  const nextVisibleRowCount = getMaxVisibleLogRows();
  state.visibleRowCount = nextVisibleRowCount;
  state.flaggedRows = state.fullFlaggedRows.slice(0, nextVisibleRowCount);
  state.rows = state.fullRows.slice(0, nextVisibleRowCount);
}

function applyTheme(runtime) {
  const theme = themePacks[runtime.currentThemeId] || themePacks.smb;
  const scenario = scenarios[runtime.currentScenarioId] || scenarios.mixed;
  const module = theme.modules[scenario.primaryModuleKey] || theme.modules.primary;
  const copy = FEED_THEME_OVERRIDES[theme.id] || FEED_THEME_OVERRIDES.smb;

  setText(el.navDashboard, theme.nav.dashboard);
  setText(el.navFeeds, theme.nav.feeds);
  setText(el.navInsight, theme.nav.insight);
  setText(el.title, module.title);
  setText(el.tag, copy.badge);
  setText(el.description, module.description);
  setText(el.labelActive, theme.kpiLabels.activeCases);
  setText(el.labelCompleted, theme.kpiLabels.completedToday);
  setText(el.labelEta, theme.kpiLabels.nextReviewEta);
  setText(el.labelOperators, theme.kpiLabels.operatorsAvailable);
  setText(el.metricOperators, String(scenario.metrics.operatorsAvailable));
  syncOperatorAvatars(el.operatorAvatars, logsOperatorAvatarUrls, scenario.metrics.operatorsAvailable);
  if (el.chatInput) el.chatInput.placeholder = theme.conversation.placeholder;

  state.live.active = scenario.metrics.activeCases;
  state.live.completed = scenario.metrics.completedToday;
  state.live.etaSeconds = scenario.metrics.nextReviewEtaSeconds;

  state.fullFlaggedRows = buildFlaggedRows(theme);
  const sharedTopRows = state.fullFlaggedRows.slice(0, 2);
  const sharedTopIds = new Set(sharedTopRows.map((row) => row.id));
  const allRows = buildRows(theme, scenario).filter((row) => !sharedTopIds.has(row.id));
  state.fullRows = [...sharedTopRows, ...allRows];
  syncVisibleRows();
  renderLiveMetrics();
  renderRows();
}

function syncTabs() {
  const allActive = state.currentTab === "all";
  el.tabAll?.classList.toggle("is-active", allActive);
  el.tabFlagged?.classList.toggle("is-active", !allActive);
  el.tabAll?.setAttribute("aria-selected", allActive ? "true" : "false");
  el.tabFlagged?.setAttribute("aria-selected", !allActive ? "true" : "false");
}

const presenterPanel = initPresenterPanel(
  {
    panel: el.presenterPanel,
    closeButton: el.presenterClose,
    themeSelect: el.presenterTheme,
    scenarioSelect: el.presenterScenario,
    speedSelect: el.presenterSpeed,
    resetButton: el.presenterReset,
    freezeButton: el.presenterFreeze,
    shareButton: el.presenterShare,
    logoTrigger: el.presenterLogoTrigger,
  },
  {
    onThemeChange: (value) => {
      store.setTheme(value);
      store.resetRun();
    },
    onScenarioChange: (value) => {
      store.setScenario(value);
      store.resetRun();
    },
    onSpeedChange: (value) => store.setSpeed(value),
    onReset: () => store.resetRun(),
    onToggleFreeze: () => store.setFrozen(!store.getState().frozen),
    getShareLink: () => store.copyShareableLink(),
  },
);

function initDue() {
  const now = performance.now();
  state.metricDue = {
    active: now + randBetween(1200, 2600),
    completed: now + randBetween(1800, 3400),
    eta: now + randBetween(1500, 2500),
    accuracy: now + randBetween(2400, 4400),
    cycle: now + randBetween(2200, 4200),
    cost: now + randBetween(3000, 5200),
    cases24h: now + randBetween(2800, 5000),
  };
}

function tickMetrics() {
  if (isFrozen()) return;
  const now = performance.now();

  if (now >= state.metricDue.active) {
    state.live.active = Math.max(1, state.live.active + (Math.random() > 0.42 ? 1 : 0));
    setText(el.metricActive, String(state.live.active));
    pulse(el.metricActive);
    state.metricDue.active = now + randBetween(1200, 2600);
  }
  if (now >= state.metricDue.completed) {
    state.live.completed += Math.random() > 0.2 ? 1 : 2;
    setText(el.metricCompleted, String(state.live.completed));
    pulse(el.metricCompleted);
    state.metricDue.completed = now + randBetween(1800, 3400);
  }
  if (now >= state.metricDue.eta) {
    state.live.etaSeconds -= 6;
    if (state.live.etaSeconds <= 12) state.live.etaSeconds = 60;
    setText(el.metricEta, formatEta(state.live.etaSeconds));
    pulse(el.metricEta);
    state.metricDue.eta = now + randBetween(1500, 2500);
  }
  if (now >= state.metricDue.accuracy) {
    state.live.accuracyPct = Math.min(99.4, Math.max(96.8, state.live.accuracyPct + (Math.random() > 0.55 ? 0.1 : -0.1)));
    state.live.accuracyDeltaPct = Math.min(
      1.6,
      Math.max(-0.8, state.live.accuracyDeltaPct + (Math.random() > 0.5 ? 0.1 : -0.1)),
    );
    setText(el.kpiAccuracy, `${state.live.accuracyPct.toFixed(1)}%`);
    setText(el.kpiAccuracyDelta, `${state.live.accuracyDeltaPct >= 0 ? "+" : ""}${state.live.accuracyDeltaPct.toFixed(1)}%`);
    pulse(el.kpiAccuracy);
    pulse(el.kpiAccuracyDelta);
    state.metricDue.accuracy = now + randBetween(2400, 4400);
  }
  if (now >= state.metricDue.cycle) {
    state.live.avgCycleSeconds = Math.min(220, Math.max(72, state.live.avgCycleSeconds + (Math.random() > 0.55 ? 2 : -1)));
    state.live.cycleDeltaSeconds = Math.min(48, Math.max(6, state.live.cycleDeltaSeconds + (Math.random() > 0.5 ? 1 : -1)));
    setText(el.kpiCycle, formatCycle(state.live.avgCycleSeconds));
    setText(el.kpiCycleDelta, `${Math.max(1, state.live.cycleDeltaSeconds)}s`);
    pulse(el.kpiCycle);
    pulse(el.kpiCycleDelta);
    state.metricDue.cycle = now + randBetween(2200, 4200);
  }
  if (now >= state.metricDue.cost) {
    state.live.costSaved += Math.floor(randBetween(80, 240));
    setText(el.kpiCost, formatMoney(state.live.costSaved));
    pulse(el.kpiCost);
    state.metricDue.cost = now + randBetween(3000, 5200);
  }
  if (now >= state.metricDue.cases24h) {
    state.live.cases24h += Math.floor(randBetween(1, 4));
    setText(el.kpiCases24h, String(state.live.cases24h));
    pulse(el.kpiCases24h);
    state.metricDue.cases24h = now + randBetween(2800, 5000);
  }
}

function tickRows() {
  if (isFrozen()) return;
  const activeRows = state.currentTab === "flagged" ? state.flaggedRows : state.rows;
  let changed = false;
  for (const row of activeRows) {
    if (row.status !== "in_progress") continue;
    row.elapsedSeconds = (row.elapsedSeconds || 0) + 1;
    row.runtimeSeconds += 1;
    row.progress += Math.max(1, Math.round(randBetween(1, 4)));

    if (row.demoConfidenceTarget && row.elapsedSeconds >= row.demoConfidenceStartAt && row.confidence == null) {
      row.confidence = row.demoConfidenceTarget.value;
      row.confidenceTone = row.demoConfidenceTarget.tone;
      row.operatorAssignAtElapsed = row.elapsedSeconds + (row.operatorAssignDelaySeconds || 4);
      changed = true;
    }

    if (!row.operator && row.operatorAssignAtElapsed != null && row.elapsedSeconds >= row.operatorAssignAtElapsed) {
      row.operator = pickOperatorForRow(row);
      changed = true;
    }

    if (row.progress >= 97) {
      row.progress = Math.round(randBetween(8, 24));
      row.runtimeSeconds = Math.round(randBetween(1, 4));
    }
    changed = true;
  }
  if (changed) renderRows();
}

function bindUI() {
  el.navDashboard?.addEventListener("click", () => {
    window.location.href = buildRouteWithProfile("./dashboard.html", store.getState());
  });
  el.navFeeds?.addEventListener("click", () => {
    window.location.href = buildRouteWithProfile("./feeds.html", store.getState());
  });
  el.navInsight?.addEventListener("click", () => {
    window.location.href = buildRouteWithProfile("./insight.html", store.getState());
  });
  el.chatSend?.addEventListener("click", () => {});
  el.chatInput?.addEventListener("keydown", (event) => {
    event.preventDefault();
  });
  el.tabAll?.addEventListener("click", () => {
    state.currentTab = "all";
    syncTabs();
    renderRows();
  });
  el.tabFlagged?.addEventListener("click", () => {
    state.currentTab = "flagged";
    syncTabs();
    renderRows();
  });
  window.addEventListener("resize", () => {
    const nextVisibleRowCount = getMaxVisibleLogRows();
    if (nextVisibleRowCount === state.visibleRowCount) return;
    syncVisibleRows();
    renderRows();
  });
}

bindUI();
syncTabs();

const initial = store.getState();
presenterPanel.sync(initial);
applyTheme(initial);
initDue();
window.setInterval(tickMetrics, 220);
window.setInterval(tickRows, 1000);

let prev = initial;
store.subscribe((next) => {
  presenterPanel.sync(next);
  const hasThemeChanged = next.currentThemeId !== prev.currentThemeId;
  const hasScenarioChanged = next.currentScenarioId !== prev.currentScenarioId;
  const hasRunReset = next.runNonce !== prev.runNonce;

  if (hasRunReset) {
    window.location.href = buildRouteWithProfile("./logs.html", store.getState());
    return;
  }

  if (hasThemeChanged || hasScenarioChanged) {
    applyTheme(next);
    initDue();
  }
  prev = next;
});
