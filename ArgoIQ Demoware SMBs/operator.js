import { renderSharedNavbar } from "./shared-navbar.js";
import { themePacks } from "./dashboard-config.js";
import { createRuntimeStore } from "./dashboard-store.js";
import { buildRouteWithProfile, initPresenterPanel } from "./presenter-controls.js";

renderSharedNavbar({ active: "feeds", logoTriggerId: "presenterLogoTrigger", tone: "ink" });
const store = createRuntimeStore();

const el = {
  navDashboard: document.getElementById("navDashboard"),
  navFeeds: document.getElementById("navFeeds"),
  navInsight: document.getElementById("navInsight"),
  chatSend: document.querySelector(".floating-chat-send"),
  chatInput: document.getElementById("operatorChatInput"),
  centerRow: document.getElementById("operatorCenterRow"),
  toggleLogs: document.getElementById("operatorToggleLogs"),
  contactInfo: document.getElementById("operatorContactInfo"),
  operatorName: document.getElementById("operatorName"),
  operatorAvatar: document.getElementById("operatorAvatar"),
  roleBadge: document.getElementById("operatorRoleBadge"),
  specialization: document.getElementById("operatorSpecialization"),
  statusText: document.getElementById("operatorStatusText"),
  statusTimer: document.getElementById("operatorStatusTimer"),
  metricActive: document.getElementById("operatorMetricActive"),
  metricCompleted: document.getElementById("operatorMetricCompleted"),
  workflowLabel: document.getElementById("operatorWorkflowLabel"),
  kpiAccuracy: document.getElementById("operatorKpiAccuracy"),
  kpiAccuracyDelta: document.getElementById("operatorKpiAccuracyDelta"),
  kpiCycle: document.getElementById("operatorKpiCycle"),
  kpiCasesToday: document.getElementById("operatorKpiCasesToday"),
  tableRows: document.getElementById("operatorLogsTableRows"),
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

const operatorByName = new Map(
  OPERATOR_DIRECTORY.map((entry) => [entry.name.toLowerCase(), entry]),
);

const OPERATOR_THEME_COPY = {
  healthcare: {
    role: "Claims QA Operator",
    specialization: "Healthcare claims · High-risk review",
    reasonLabel: "Confident Score:",
    reasons: [
      "Policy mismatch vs payer rules",
      "Low coding confidence",
      "Missing supporting documentation",
      "Potential duplicate submission",
      "Diagnosis-procedure inconsistency",
    ],
  },
  smb: {
    role: "Operations Specialist",
    specialization: "Back-office workflows · Exception review",
    reasonLabel: "Confident Score:",
    reasons: [
      "Scheduling conflict detected",
      "Low task confidence",
      "Missing verification detail",
      "Duplicate customer record",
      "Billing profile inconsistency",
    ],
  },
  future: {
    role: "Policy Supervisor",
    specialization: "Autonomous signals · Escalation oversight",
    reasonLabel: "Confident Score:",
    reasons: [
      "Policy guardrail conflict",
      "Execution confidence dropped",
      "Cross-agent inconsistency",
      "Potential duplicate run",
      "Trace validation failed",
    ],
  },
};

function getMaxVisibleOperatorRows() {
  if (window.innerHeight <= 820) return 8;
  if (window.innerHeight <= 920) return 9;
  if (window.innerHeight <= 1020) return 11;
  return 15;
}

let allRows = [];
let rows = [];
let visibleRowCount = 0;
let selectedClaimId = "";
let operatorStatusElapsedSeconds = 3;
let renderedThemeId = "";
let selectedOperatorName = "Sarah Jones";
let initialExpandedView = false;

function buildCaseRoute(claimId) {
  const url = new URL(buildRouteWithProfile("./case-detail.html", store.getState()));
  url.searchParams.set("claim", claimId);
  url.searchParams.set("operator", selectedOperatorName);
  return url.toString();
}

function setText(node, value) {
  if (!node) return;
  node.textContent = value;
}

function formatShortTimer(seconds) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function getOperatorAvatar(name) {
  const found = operatorByName.get((name || "").toLowerCase());
  if (!found) return "./Assets:ProfilePicture/Frame 1000002699.jpg";
  return `./Assets:ProfilePicture/${found.avatar}`;
}

function applyProfile(runtime) {
  const theme = themePacks[runtime.currentThemeId] || themePacks.smb;
  const themeCopy = OPERATOR_THEME_COPY[runtime.currentThemeId] || OPERATOR_THEME_COPY.smb;
  setText(el.navDashboard, theme.nav.dashboard);
  setText(el.navFeeds, theme.nav.feeds);
  setText(el.navInsight, theme.nav.insight);
  if (el.chatInput) el.chatInput.placeholder = theme.conversation.placeholder;
  setText(el.roleBadge, themeCopy.role);
  setText(el.specialization, themeCopy.specialization);
  setText(el.workflowLabel, themeCopy.specialization);
  if (renderedThemeId !== runtime.currentThemeId) {
    renderRowsForTheme(theme, themeCopy);
    renderOperatorTable();
    renderedThemeId = runtime.currentThemeId;
  }
}

function getStatusMarkup(type) {
  if (type === "in_progress") {
    return `<span class="logs-status is-running">In progress</span>`;
  }
  if (type === "queue") {
    return `<span class="logs-status is-queue">Queue</span>`;
  }
  return `<span class="logs-status is-completed">Completed</span>`;
}

function renderOperatorTable() {
  if (!el.tableRows) return;
  const rowMarkup = rows
    .map((row) => {
      const isClickable = row.status === "completed";
      const route = isClickable ? buildCaseRoute(row.id) : "";
      const timerPill = Number.isFinite(row.runtimeSeconds)
        ? `<span class="logs-runtime-pill">${formatShortTimer(row.runtimeSeconds)}</span>`
        : "";
      const runtimeLabel = row.status === "queue"
        ? `<span>${row.runtimeLabel}<span class="loading-dots" aria-label="loading" role="status"></span></span>`
        : row.runtimeLabel
          ? `<span>${row.runtimeLabel}</span>`
          : "";
      return `
        <div class="operator-logs-row ${isClickable ? "is-clickable" : ""}" ${isClickable ? `data-case-route="${route}"` : ""}>
          <div class="logs-col">
            ${isClickable
              ? `<button class="logs-row-link-btn" type="button" data-case-route="${route}">${row.id}</button>`
              : row.id}
          </div>
          <div class="logs-col">${getStatusMarkup(row.status)}</div>
          <div class="logs-col logs-col-stage"><span class="operator-flag-reason">${row.reason}</span></div>
          <div class="logs-col logs-col-confidence">
            <span>${row.reasonLabel}</span>
            <span class="logs-confidence is-${row.confidenceTone}">${row.confidence}%</span>
          </div>
          <div class="logs-col operator-runtime-col">
            ${runtimeLabel}
            ${timerPill}
          </div>
        </div>
      `;
    })
    .join("");
  el.tableRows.innerHTML = rowMarkup;
  el.tableRows.querySelectorAll(".logs-row-link-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const route = btn.getAttribute("data-case-route");
      if (route) window.location.href = route;
    });
  });
  el.tableRows.querySelectorAll(".operator-logs-row.is-clickable").forEach((rowEl) => {
    rowEl.addEventListener("click", () => {
      const route = rowEl.getAttribute("data-case-route");
      if (route) window.location.href = route;
    });
  });
}

function syncVisibleOperatorRows() {
  visibleRowCount = getMaxVisibleOperatorRows();
  rows = allRows.slice(0, visibleRowCount);
}

function renderRowsForTheme(theme, themeCopy) {
  const prefix = (theme?.entityNaming?.idPrefixes?.[0] || "CLAIM").toUpperCase();
  const reasons = themeCopy?.reasons?.length ? themeCopy.reasons : OPERATOR_THEME_COPY.smb.reasons;
  const reasonLabel = themeCopy?.reasonLabel || "Confident Score:";
  const baseRows = [
    { offset: 0, status: "in_progress", confidence: 76, confidenceTone: "warning", runtimeLabel: "", runtimeSeconds: 3 },
    { offset: 1, status: "queue", confidence: 49, confidenceTone: "risk", runtimeLabel: "Pending", runtimeSeconds: null },
    { offset: 2, status: "completed", confidence: 69, confidenceTone: "warning", runtimeLabel: "4m 10s", runtimeSeconds: null },
    { offset: 3, status: "completed", confidence: 48, confidenceTone: "risk", runtimeLabel: "5m 00s", runtimeSeconds: null },
    { offset: 4, status: "completed", confidence: 67, confidenceTone: "warning", runtimeLabel: "10m 15s", runtimeSeconds: null },
    { offset: 5, status: "completed", confidence: 53, confidenceTone: "warning", runtimeLabel: "7m 30s", runtimeSeconds: null },
    { offset: 6, status: "completed", confidence: 62, confidenceTone: "warning", runtimeLabel: "4m 45s", runtimeSeconds: null },
    { offset: 7, status: "completed", confidence: 79, confidenceTone: "warning", runtimeLabel: "12m 20s", runtimeSeconds: null },
    { offset: 8, status: "completed", confidence: 76, confidenceTone: "warning", runtimeLabel: "6m 00s", runtimeSeconds: null },
    { offset: 9, status: "completed", confidence: 61, confidenceTone: "warning", runtimeLabel: "8m 35s", runtimeSeconds: null },
    { offset: 10, status: "completed", confidence: 77, confidenceTone: "warning", runtimeLabel: "9m 10s", runtimeSeconds: null },
    { offset: 11, status: "completed", confidence: 73, confidenceTone: "warning", runtimeLabel: "3m 25s", runtimeSeconds: null },
    { offset: 12, status: "completed", confidence: 49, confidenceTone: "risk", runtimeLabel: "11m 50s", runtimeSeconds: null },
    { offset: 13, status: "completed", confidence: 60, confidenceTone: "warning", runtimeLabel: "5m 55s", runtimeSeconds: null },
    { offset: 14, status: "completed", confidence: 48, confidenceTone: "risk", runtimeLabel: "2m 40s", runtimeSeconds: null },
  ];

  allRows = baseRows.map((row, index) => ({
    id: `${prefix}-${128390 + row.offset}`,
    status: row.status,
    confidence: row.confidence,
    confidenceTone: row.confidenceTone,
    runtimeLabel: row.runtimeLabel,
    runtimeSeconds: row.runtimeSeconds,
    reason: reasons[index % reasons.length],
    reasonLabel,
  }));
  if (selectedClaimId && allRows[0]) allRows[0].id = selectedClaimId;
  syncVisibleOperatorRows();
}

function setExpanded(expanded) {
  if (!el.centerRow || !el.toggleLogs) return;
  el.centerRow.classList.toggle("is-single-card", !expanded);
  el.centerRow.classList.toggle("is-expanded", expanded);
  el.toggleLogs.textContent = expanded ? "Hide operator log" : "View operator log";
}

function initializeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const operatorName = params.get("operator") || "Sarah Jones";
  const claim = params.get("claim") || "CLAIM-128390";
  initialExpandedView = params.get("view") === "expanded";
  selectedClaimId = claim;
  selectedOperatorName = operatorName;

  setText(el.operatorName, operatorName);
  setText(el.statusText, `In review · ${claim}`);
  setText(el.statusTimer, formatShortTimer(operatorStatusElapsedSeconds));
  if (el.operatorAvatar) {
    el.operatorAvatar.style.backgroundImage = `url('${getOperatorAvatar(operatorName)}')`;
  }

}

function tickOperatorTimers() {
  if (store.getState().frozen) return;
  operatorStatusElapsedSeconds += 1;
  setText(el.statusTimer, formatShortTimer(operatorStatusElapsedSeconds));
  rows.forEach((row) => {
    if (row.status === "in_progress" && Number.isFinite(row.runtimeSeconds)) {
      row.runtimeSeconds += 1;
    }
  });
  renderOperatorTable();
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
    onThemeChange: (value) => store.setTheme(value),
    onScenarioChange: (value) => store.setScenario(value),
    onSpeedChange: (value) => store.setSpeed(value),
    onReset: () => store.resetRun(),
    onToggleFreeze: () => store.setFrozen(!store.getState().frozen),
    getShareLink: () => window.location.href,
    copiedDurationMs: 900,
  },
);

el.navDashboard?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./dashboard.html", store.getState());
});

el.navFeeds?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./feeds.html", store.getState());
});

el.navInsight?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./insight.html", store.getState());
});

el.toggleLogs?.addEventListener("click", () => {
  const nextExpanded = el.centerRow?.classList.contains("is-single-card");
  setExpanded(Boolean(nextExpanded));
});

el.contactInfo?.addEventListener("click", () => {
  // Contact action remains non-interactive in prototype mode.
});

el.chatSend?.addEventListener("click", () => {
  // Chat remains non-interactive in prototype mode.
});

el.chatInput?.addEventListener("keydown", (event) => {
  event.preventDefault();
});

window.addEventListener("resize", () => {
  const nextVisibleRowCount = getMaxVisibleOperatorRows();
  if (nextVisibleRowCount === visibleRowCount) return;
  syncVisibleOperatorRows();
  renderOperatorTable();
});

initializeFromQuery();
setExpanded(initialExpandedView);
applyProfile(store.getState());
presenterPanel.sync(store.getState());
window.setInterval(tickOperatorTimers, 1000);

store.subscribe((nextState) => {
  applyProfile(nextState);
  presenterPanel.sync(nextState);
});
