import { renderSharedNavbar } from "./shared-navbar.js";
import { themePacks, scenarios } from "./dashboard-config.js";
import { createRuntimeStore } from "./dashboard-store.js";
import { buildRouteWithProfile, initPresenterPanel } from "./presenter-controls.js";

renderSharedNavbar({ active: "feeds", logoTriggerId: "presenterLogoTrigger", tone: "ink" });
const store = createRuntimeStore();

const el = {
  navDashboard: document.getElementById("navDashboard"),
  navFeeds: document.getElementById("navFeeds"),
  navInsight: document.getElementById("navInsight"),
  chatInput: document.getElementById("caseChatInput"),
  chatSend: document.querySelector(".floating-chat-send"),
  claimId: document.getElementById("caseDetailClaimId"),
  timestamp: document.getElementById("caseDetailTimestamp"),
  summary: document.getElementById("caseDetailSummary"),
  preScore: document.getElementById("caseDetailPreScore"),
  postScore: document.getElementById("caseDetailPostScore"),
  preTone: document.getElementById("caseDetailPreTone"),
  postTone: document.getElementById("caseDetailPostTone"),
  rows: document.getElementById("caseDetailRows"),
  backOperator: document.getElementById("caseBackOperator"),
  contactInfo: document.getElementById("caseContactInfo"),
  requestClarification: document.getElementById("caseRequestClarification"),
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

function getQuery() {
  const params = new URLSearchParams(window.location.search);
  const runtime = store.getState();
  return {
    themeId: runtime.currentThemeId,
    scenarioId: runtime.currentScenarioId,
    claimId: params.get("claim") || "CLAIM-128390",
    operatorName: params.get("operator") || "James Smith",
  };
}

function buildOperatorRoute(claimId, operatorName) {
  const url = new URL(buildRouteWithProfile("./operator.html", store.getState()));
  url.searchParams.set("claim", claimId);
  url.searchParams.set("operator", operatorName);
  url.searchParams.set("view", "expanded");
  return url.toString();
}

function toSeed(value) {
  let seed = 0;
  for (const char of String(value)) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }
  return seed || 1;
}

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

function formatTimestamp(baseOffsetSeconds) {
  const at = new Date(Date.now() - baseOffsetSeconds * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`;
}

function confidenceTone(value) {
  if (value < 50) return "risk";
  if (value < 85) return "warning";
  return "good";
}

function avatarFor(name) {
  const found = OPERATOR_DIRECTORY.find((entry) => entry.name.toLowerCase() === String(name).toLowerCase());
  if (!found) return "./Assets:ProfilePicture/Frame 1000002674.jpg";
  return `./Assets:ProfilePicture/${found.avatar}`;
}

function createCaseModel() {
  const query = getQuery();
  const theme = themePacks[query.themeId] || themePacks.smb;
  const scenario = scenarios[query.scenarioId] || scenarios.mixed;
  const module = theme.modules[scenario.primaryModuleKey] || theme.modules.primary;
  const rng = seeded(toSeed(`${query.claimId}:${query.operatorName}:${query.themeId}`));

  const preScore = Math.max(58, Math.min(84, Math.round(62 + rng() * 22)));
  const postScore = Math.max(94, Math.min(99, Math.round(95 + rng() * 4)));

  const inputStep = pick(rng, theme.workflowPhases.inputPhaseSteps);
  const evalStep = pick(rng, theme.workflowPhases.evaluationChecks);
  const outputStep = pick(rng, theme.workflowPhases.outputPhaseSteps);
  const inputStep2 = pick(rng, theme.workflowPhases.inputPhaseSteps);
  const evalStep2 = pick(rng, theme.workflowPhases.evaluationChecks);
  const terminalPhase = "Pipeline resume";
  const riskSignal = theme.conversation.riskSignal;
  const entity = theme.entityNaming.singular;

  const summary = `${entity} confidence dipped during ${evalStep.toLowerCase()} because ${riskSignal} signals conflicted; ${query.operatorName} reviewed and normalized the case for downstream processing.`;

  const timelineRows = [
    {
      actor: "System",
      actorType: "system",
      phase: "Intake",
      details: `${entity} packet accepted and routed to ${inputStep.toLowerCase()}.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "ArgoIQ",
      actorType: "argo",
      phase: inputStep,
      details: `Core fields normalized and prepared for ${evalStep.toLowerCase()}.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: query.operatorName,
      actorType: "human",
      phase: theme.roleTitles.primaryOperator,
      details: `${query.operatorName} reviewed pre-check anomalies before policy scoring.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "ArgoIQ",
      actorType: "argo",
      phase: evalStep,
      details: `Initial confidence scored at ${preScore}% and compared to threshold.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "System",
      actorType: "system",
      phase: "Escalation",
      details: `${entity} flagged due to ${riskSignal} during ${evalStep.toLowerCase()}.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "ArgoIQ",
      actorType: "argo",
      phase: inputStep2,
      details: `Supplemental context assembled to support manual clarification.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: query.operatorName,
      actorType: "human",
      phase: "Clarification",
      details: `${query.operatorName} requested supporting details to resolve mismatch signals.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "System",
      actorType: "system",
      phase: "Update intake",
      details: `Requested documentation received and attached to the active ${entity.toLowerCase()}.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "ArgoIQ",
      actorType: "argo",
      phase: evalStep2,
      details: `Confidence re-scored at ${postScore}% after updates and secondary checks.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: query.operatorName,
      actorType: "human",
      phase: "Resolution review",
      details: `${query.operatorName} confirmed corrected fields and approved release.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "ArgoIQ",
      actorType: "argo",
      phase: outputStep,
      details: `${entity} advanced through ${outputStep.toLowerCase()} with validated output package.`,
      status: "completed",
      badge: "Completed",
    },
    {
      actor: "System",
      actorType: "system",
      phase: terminalPhase,
      details: `${module.name} flow closed as ${theme.statusVocabulary.validated.toLowerCase()} and returned to queue.`,
      status: "completed",
      badge: "Completed",
    },
  ];

  return {
    ...query,
    theme,
    summary,
    preScore,
    postScore,
    timestamp: formatTimestamp(20 + Math.round(rng() * 120)),
    rows: timelineRows,
  };
}

function statusMarkup(kind, label) {
  if (kind === "running") return `<span class="logs-status is-running">${label}</span>`;
  if (kind === "queue") return `<span class="logs-status is-queue">${label}</span>`;
  return `<span class="logs-status is-completed">${label}</span>`;
}

function renderRows(model) {
  if (!el.rows) return;
  const base = Date.now() - 10 * 60000;
  el.rows.innerHTML = model.rows
    .map((row, index) => {
      const timestamp = formatTimestamp(Math.max(3, Math.round((Date.now() - (base + index * 62000)) / 1000)));
      const actorCell = row.actorType === "human"
        ? `<span class="logs-operator"><span class="logs-operator-avatar" style="background-image:url('${encodeURI(avatarFor(row.actor))}')"></span><span>${row.actor}</span></span>`
        : row.actorType === "argo"
          ? `<span class="workflow-pill case-actor-pill">${row.actor}</span>`
          : `<span class="case-system-label">${row.actor}</span>`;
      return `
        <article class="case-detail-row">
          <div class="logs-col case-col-time">${timestamp.slice(11)}</div>
          <div class="logs-col case-col-actor">${actorCell}</div>
          <div class="logs-col case-col-phase"><span class="operator-flag-reason">${row.phase}</span></div>
          <div class="logs-col case-col-detail"><span class="operator-flag-reason">${row.details}</span></div>
          <div class="logs-col case-col-state">${statusMarkup(row.status, row.badge)}</div>
        </article>
      `;
    })
    .join("");
}

function applyThemeText(model) {
  el.navDashboard.textContent = model.theme.nav.dashboard;
  el.navFeeds.textContent = model.theme.nav.feeds;
  el.navInsight.textContent = model.theme.nav.insight;
  if (el.chatInput) el.chatInput.placeholder = model.theme.conversation.placeholder;
}

function render() {
  const model = createCaseModel();
  applyThemeText(model);

  if (el.claimId) el.claimId.textContent = model.claimId;
  if (el.timestamp) el.timestamp.textContent = model.timestamp;
  if (el.summary) el.summary.textContent = model.summary;
  if (el.preScore) el.preScore.textContent = `${model.preScore}%`;
  if (el.postScore) el.postScore.textContent = `${model.postScore}%`;

  if (el.preTone) {
    el.preTone.classList.remove("is-warning", "is-risk", "is-good");
    el.preTone.classList.add(`is-${confidenceTone(model.preScore)}`);
  }
  if (el.postTone) {
    el.postTone.classList.remove("is-warning", "is-risk", "is-good");
    el.postTone.classList.add(`is-${confidenceTone(model.postScore)}`);
  }

  renderRows(model);
  if (el.backOperator) {
    el.backOperator.onclick = () => {
      window.location.href = buildOperatorRoute(model.claimId, model.operatorName);
    };
  }
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

el.chatSend?.addEventListener("click", () => {
  // Prototype mode.
});

el.contactInfo?.addEventListener("click", () => {
  // Prototype mode.
});

el.requestClarification?.addEventListener("click", () => {
  // Prototype mode.
});

el.chatInput?.addEventListener("keydown", (event) => {
  event.preventDefault();
});

render();
presenterPanel.sync(store.getState());

store.subscribe(() => {
  render();
  presenterPanel.sync(store.getState());
});
