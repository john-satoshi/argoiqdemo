import { renderSharedNavbar } from "./shared-navbar.js";
import { themePacks, scenarios } from "./dashboard-config.js";
import { createRuntimeStore } from "./dashboard-store.js";
import { buildRouteWithProfile, initPresenterPanel } from "./presenter-controls.js";

renderSharedNavbar({ active: "feeds", logoTriggerId: "presenterLogoTrigger" });
const store = createRuntimeStore();

const navDashboard = document.getElementById("navDashboard");
const navFeeds = document.getElementById("navFeeds");
const navInsight = document.getElementById("navInsight");
const chatSend = document.querySelector(".floating-chat-send");
const chatInput = document.getElementById("feedsChatInput");
const workflowAnimation = document.getElementById("feedWorkflowAnimation");
const feedLiveTitle = document.getElementById("feedLiveTitle");
const feedLiveBadgeA = document.getElementById("feedLiveBadgeA");
const feedLiveBadgeB = document.getElementById("feedLiveBadgeB");
const feedWorkflowDescription = document.getElementById("feedWorkflowDescription");
const feedLabelActive = document.getElementById("feedLabelActive");
const feedLabelCompleted = document.getElementById("feedLabelCompleted");
const feedLabelEta = document.getElementById("feedLabelEta");
const feedLabelOperators = document.getElementById("feedLabelOperators");
const metricActive = document.getElementById("feedMetricActive");
const metricCompleted = document.getElementById("feedMetricCompleted");
const metricEta = document.getElementById("feedMetricEta");
const metricOperators = document.getElementById("feedMetricOperators");
const feedOperatorAvatars = document.getElementById("feedOperatorAvatars");
const feedCenterRow = document.getElementById("feedCenterRow");
const feedToggleLiveActivity = document.getElementById("feedToggleLiveActivity");
const kpiAccuracy = document.getElementById("feedKpiAccuracy");
const kpiAccuracyDelta = document.getElementById("feedKpiAccuracyDelta");
const kpiCycle = document.getElementById("feedKpiCycle");
const kpiCycleDelta = document.getElementById("feedKpiCycleDelta");
const kpiCost = document.getElementById("feedKpiCost");
const kpiCases24h = document.getElementById("feedKpiCases24h");
const processingEntityBadge = document.getElementById("processingEntityBadge");
const processingCloseLiveActivity = document.getElementById("processingCloseLiveActivity");
const feedViewAllLogs = document.getElementById("feedViewAllLogs");
const processingViewLog = document.getElementById("processingViewLog");
const presenter = {
  panel: document.getElementById("presenterPanel"),
  close: document.getElementById("presenterClose"),
  theme: document.getElementById("presenterTheme"),
  scenario: document.getElementById("presenterScenario"),
  speed: document.getElementById("presenterSpeed"),
  reset: document.getElementById("presenterReset"),
  freeze: document.getElementById("presenterFreeze"),
  share: document.getElementById("presenterShare"),
  logoTrigger: document.getElementById("presenterLogoTrigger"),
};
const feedOperatorAvatarUrls = feedOperatorAvatars
  ? Array.from(feedOperatorAvatars.querySelectorAll(".workflow-avatar"))
      .map((avatar) => avatar.style.backgroundImage)
      .filter((value) => typeof value === "string" && value.trim().length > 0)
  : [];

const presenterPanel = initPresenterPanel(
  {
    panel: presenter.panel,
    closeButton: presenter.close,
    themeSelect: presenter.theme,
    scenarioSelect: presenter.scenario,
    speedSelect: presenter.speed,
    resetButton: presenter.reset,
    freezeButton: presenter.freeze,
    shareButton: presenter.share,
    logoTrigger: presenter.logoTrigger,
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

navDashboard?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./dashboard.html", store.getState());
});

navFeeds?.addEventListener("click", () => {
  // Already on Feeds.
});

navInsight?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./insight.html", store.getState());
});

feedViewAllLogs?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./logs.html", store.getState());
});

processingViewLog?.addEventListener("click", () => {
  window.location.href = buildRouteWithProfile("./logs.html", store.getState());
});

feedToggleLiveActivity?.addEventListener("click", () => {
  setLiveActivityExpanded(!isLiveActivityExpanded);
});

processingCloseLiveActivity?.addEventListener("click", () => {
  setLiveActivityExpanded(false);
});


chatSend?.addEventListener("click", () => {
  // Chat stays non-interactive in this flow.
});

chatInput?.addEventListener("keydown", (event) => {
  event.preventDefault();
});

let currentThemeId = "smb";
let currentScenarioId = "mixed";
let isLiveActivityExpanded = false;

function setLiveActivityExpanded(expanded) {
  isLiveActivityExpanded = expanded;
  feedCenterRow?.classList.toggle("is-single-card", !expanded);
  if (feedToggleLiveActivity) {
    feedToggleLiveActivity.textContent = expanded ? "Hide live activity" : "View live activity";
    feedToggleLiveActivity.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
}

const FEED_THEME_OVERRIDES = {
  healthcare: {
    badgeA: "Healthcare",
    badgeB: "HIPAA-safe",
  },
  smb: {
    badgeA: "Ops",
    badgeB: "Queue-safe",
  },
  future: {
    badgeA: "Supervisor",
    badgeB: "Policy-safe",
  },
};

const live = {
  active: 27,
  completed: 143,
  etaSeconds: 60,
  accuracyPct: 98.6,
  accuracyDeltaPct: 0.4,
  avgCycleSeconds: 102,
  cycleDeltaSeconds: 18,
  costSaved: 14320,
  cases24h: 286,
};

const isFrozen = () => store.getState().frozen;

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

function applyFeedProfile(runtime) {
  const theme = themePacks[runtime.currentThemeId] || themePacks.smb;
  const scenario = scenarios[runtime.currentScenarioId] || scenarios.mixed;
  const module = theme.modules[scenario.primaryModuleKey] || theme.modules.primary;
  const copy = FEED_THEME_OVERRIDES[theme.id] || FEED_THEME_OVERRIDES.smb;

  currentThemeId = theme.id;
  currentScenarioId = scenario.id;

  setText(navDashboard, theme.nav.dashboard);
  setText(navFeeds, theme.nav.feeds);
  setText(navInsight, theme.nav.insight);

  setText(feedLiveTitle, module.name);
  setText(feedLiveBadgeA, copy.badgeA);
  setText(feedLiveBadgeB, copy.badgeB);
  setText(feedWorkflowDescription, module.description);
  setText(feedLabelActive, theme.kpiLabels.activeCases);
  setText(feedLabelCompleted, theme.kpiLabels.completedToday);
  setText(feedLabelEta, theme.kpiLabels.nextReviewEta);
  setText(feedLabelOperators, theme.kpiLabels.operatorsAvailable);
  setText(processingEntityBadge, theme.entityNaming.singular);
  if (chatInput) chatInput.placeholder = theme.conversation.placeholder;

  live.active = scenario.metrics.activeCases;
  live.completed = scenario.metrics.completedToday;
  live.etaSeconds = scenario.metrics.nextReviewEtaSeconds;
  if (metricOperators) metricOperators.textContent = String(scenario.metrics.operatorsAvailable);
  syncOperatorAvatars(feedOperatorAvatars, feedOperatorAvatarUrls, scenario.metrics.operatorsAvailable);
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
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

function pulse(node) {
  if (!node) return;
  node.classList.remove("metric-updated");
  window.requestAnimationFrame(() => node.classList.add("metric-updated"));
}

function renderLiveMetrics() {
  if (metricActive) metricActive.textContent = String(live.active);
  if (metricCompleted) metricCompleted.textContent = String(live.completed);
  if (metricEta) metricEta.textContent = formatEta(live.etaSeconds);
  if (kpiAccuracy) kpiAccuracy.textContent = `${live.accuracyPct.toFixed(1)}%`;
  if (kpiAccuracyDelta) kpiAccuracyDelta.textContent = `${live.accuracyDeltaPct >= 0 ? "+" : ""}${live.accuracyDeltaPct.toFixed(1)}%`;
  if (kpiCycle) kpiCycle.textContent = formatCycle(live.avgCycleSeconds);
  if (kpiCycleDelta) kpiCycleDelta.textContent = `${Math.max(1, live.cycleDeltaSeconds)}s`;
  if (kpiCost) kpiCost.textContent = formatMoney(live.costSaved);
  if (kpiCases24h) kpiCases24h.textContent = String(live.cases24h);
}

const due = {
  active: performance.now() + randBetween(1200, 2600),
  completed: performance.now() + randBetween(1800, 3400),
  eta: performance.now() + randBetween(1500, 2500),
  accuracy: performance.now() + randBetween(2400, 4400),
  cycle: performance.now() + randBetween(2200, 4200),
  cost: performance.now() + randBetween(3000, 5200),
  cases24h: performance.now() + randBetween(2800, 5000),
};

function tick() {
  if (isFrozen()) return;
  const now = performance.now();

  if (now >= due.active) {
    live.active = Math.max(1, live.active + (Math.random() > 0.4 ? 1 : 0));
    if (metricActive) {
      metricActive.textContent = String(live.active);
      pulse(metricActive);
    }
    due.active = now + randBetween(1200, 2600);
  }

  if (now >= due.completed) {
    live.completed += Math.random() > 0.2 ? 1 : 2;
    if (metricCompleted) {
      metricCompleted.textContent = String(live.completed);
      pulse(metricCompleted);
    }
    due.completed = now + randBetween(1800, 3400);
  }

  if (now >= due.eta) {
    live.etaSeconds -= 6;
    if (live.etaSeconds <= 12) live.etaSeconds = 60;
    if (metricEta) {
      metricEta.textContent = formatEta(live.etaSeconds);
      pulse(metricEta);
    }
    due.eta = now + randBetween(1500, 2500);
  }

  if (now >= due.accuracy) {
    const delta = Math.random() > 0.55 ? 0.1 : -0.1;
    live.accuracyPct = Math.min(99.4, Math.max(96.8, live.accuracyPct + delta));
    live.accuracyDeltaPct = Math.min(1.6, Math.max(-0.8, live.accuracyDeltaPct + (Math.random() > 0.5 ? 0.1 : -0.1)));
    if (kpiAccuracy) {
      kpiAccuracy.textContent = `${live.accuracyPct.toFixed(1)}%`;
      pulse(kpiAccuracy);
    }
    if (kpiAccuracyDelta) {
      kpiAccuracyDelta.textContent = `${live.accuracyDeltaPct >= 0 ? "+" : ""}${live.accuracyDeltaPct.toFixed(1)}%`;
      pulse(kpiAccuracyDelta);
    }
    due.accuracy = now + randBetween(2400, 4400);
  }

  if (now >= due.cycle) {
    live.avgCycleSeconds = Math.min(220, Math.max(72, live.avgCycleSeconds + (Math.random() > 0.55 ? 2 : -1)));
    live.cycleDeltaSeconds = Math.min(48, Math.max(6, live.cycleDeltaSeconds + (Math.random() > 0.5 ? 1 : -1)));
    if (kpiCycle) {
      kpiCycle.textContent = formatCycle(live.avgCycleSeconds);
      pulse(kpiCycle);
    }
    if (kpiCycleDelta) {
      kpiCycleDelta.textContent = `${Math.max(1, live.cycleDeltaSeconds)}s`;
      pulse(kpiCycleDelta);
    }
    due.cycle = now + randBetween(2200, 4200);
  }

  if (now >= due.cost) {
    live.costSaved += Math.floor(randBetween(80, 240));
    if (kpiCost) {
      kpiCost.textContent = formatMoney(live.costSaved);
      pulse(kpiCost);
    }
    due.cost = now + randBetween(3000, 5200);
  }

  if (now >= due.cases24h) {
    live.cases24h += Math.floor(randBetween(1, 4));
    if (kpiCases24h) {
      kpiCases24h.textContent = String(live.cases24h);
      pulse(kpiCases24h);
    }
    due.cases24h = now + randBetween(2800, 5000);
  }
}

const initialState = store.getState();
presenterPanel.sync(initialState);
setLiveActivityExpanded(false);
applyFeedProfile(initialState);
renderLiveMetrics();
window.setInterval(tick, 220);

async function mountWorkflowLottie() {
  if (!workflowAnimation) return;
  try {
    const lottieModule = await import("https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/+esm");
    const lottie = lottieModule.default || lottieModule;

    lottie.loadAnimation({
      container: workflowAnimation,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "./Assets/Workflow%20Detail%20Card%20Animation.json",
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });
  } catch {
    // Keep silent fallback if CDN cannot be reached.
  }
}

mountWorkflowLottie();

function initFeedProcessingDemo() {
  const cardEl = document.getElementById("feedProcessingCard");
  const timerEl = document.getElementById("processing-card-timer");
  const titleEl = cardEl?.querySelector(".processing-card-title");
  const phaseLabelEl = document.getElementById("processing-phase-label");
  const progressEl = document.getElementById("processing-progress");
  const progressTrackEl = document.getElementById("processing-progress-track");
  const taskListEl = document.getElementById("processing-task-list");
  const visualPanelEl = document.getElementById("processing-visual-panel");
  const visualRowsEl = document.getElementById("processing-visual-rows");
  const sourcesLineEl = document.getElementById("processing-sources-line");
  const sourcesLabelEl = document.getElementById("processing-sources-label");
  const docLabelEl = document.getElementById("processing-doc-label");
  const docMetaEl = document.getElementById("processing-doc-meta");
  const docScanEl = document.getElementById("processing-doc-scan");
  const docPreviewEl = cardEl?.querySelector(".processing-doc-preview");
  const crossRefEl = document.getElementById("processing-crossref");
  const crossRefStackEl = document.getElementById("processing-crossref-stack");
  const crossRefDocLeftEl = document.getElementById("processing-crossref-doc-left");
  const crossRefDocRightEl = document.getElementById("processing-crossref-doc-right");
  const crossRefDocFrontEl = document.getElementById("processing-crossref-doc-front");
  const crossRefMetaTextEl = document.getElementById("processing-crossref-meta-text");
  const confidencePanelEl = document.getElementById("processing-confidence-panel");
  const confidenceOrbEl = document.getElementById("processing-confidence-orb");
  const confidenceValueEl = document.getElementById("processing-confidence-value");
  const completionPanelEl = document.getElementById("processing-completion-panel");
  const completionTextEl = document.getElementById("processing-completion-text");
  const operatorPanelEl = document.getElementById("processing-operator-panel");
  const operatorRadarEl = document.getElementById("processing-operator-radar");
  if (!cardEl || !timerEl || !phaseLabelEl || !progressEl || !progressTrackEl) return;

  const theme = themePacks[currentThemeId] || themePacks.smb;
  const isHealthcare = theme.id === "healthcare";
  const entitySingularLower = theme.entityNaming.singular.toLowerCase();
  const entityPluralLower = theme.entityNaming.plural.toLowerCase();
  const primaryCodeLabel = isHealthcare ? "CPT" : "firmographic";
  const secondaryCodeLabel = isHealthcare ? "ICD-10" : "contact";
  const ruleDomainLabel = isHealthcare ? "payer rules" : "routing rules";
  const caseReferenceLabel = isHealthcare ? "cases" : "records";
  const reimbursementLabel = isHealthcare ? "reimbursement" : "workflow impact";
  const consistencyEntityLabel = isHealthcare ? "code consistency" : "field consistency";
  const flowAId = isHealthcare ? "CLM-04821" : "LED-04821";
  const flowBId = isHealthcare ? "CLM-05294" : "LED-05294";
  const completionMessage = isHealthcare
    ? "Claim processed successfully"
    : "Record processed successfully";

  const flowDefs = {
    flowA: {
      claimId: flowAId,
      holdAfterMs: 1800,
      phaseSequence: ["context_enrichment_validation", "evaluation_pass", "completion"],
      phases: {
        ingestion: {
          label: "Ingestion phase",
          tasks: ["Receiving claim packet", "Verifying file integrity", "Indexing attachments"],
        },
        input_normalization: {
          label: "Input normalization",
          context: { documentCount: 3, codeTypePrimary: primaryCodeLabel, codeTypeSecondary: secondaryCodeLabel, sourcesAvailable: 3 },
          tasks: [
            "OCR running on {{documentCount}} documents",
            "Extracting {{codeTypePrimary}} codes",
            "Extracting {{codeTypeSecondary}} codes",
            "Mapping fields to schema",
            "Normalizing date formats",
            "Validating required fields",
          ],
          visual: { type: "scan", startAtPercent: 94, docs: ["Doc1", "Doc2", "Doc3"], switchMs: 900, cycles: 2 },
        },
        context_enrichment_validation: {
          label: "Context enrichment and validation",
          context: {
            historicalEntityLabel: `historical ${entityPluralLower}`,
            ruleDomain: ruleDomainLabel,
            caseReferenceLabel,
            reimbursementLabel,
          },
          tasks: ["Fetching {{historicalEntityLabel}}", "Matching {{ruleDomain}}", "Cross-referencing {{caseReferenceLabel}}", "Evaluating {{reimbursementLabel}}"],
          statusStyle: { validatedTone: "success" },
          visual: {
            type: "cross_ref",
            startAtPercent: 0,
            docs: ["Doc1", "Doc2", "Doc3"],
            switchMs: 700,
            cycles: 1,
            initialStage: 3,
            rows: [
              { task: "Fetching {{historicalEntityLabel}}", status: "validated" },
              { task: "Matching {{ruleDomain}}", status: "validated" },
              { task: "Cross-referencing {{caseReferenceLabel}}", status: "running" },
            ],
            runningMetaLabel: "Cross-referencing {{caseReferenceLabel}}",
          },
        },
        evaluation_pass: {
          label: "Evaluation pass",
          context: { consistencyEntityLabel },
          tasks: ["Checking {{consistencyEntityLabel}}"],
          visual: {
            type: "confidence",
            startAtPercent: 84,
            rows: [{ task: "Checking {{consistencyEntityLabel}}", status: "running" }],
            values: [
              { value: "--", tone: "neutral" },
              { value: "92", tone: "good" },
              { value: "95", tone: "good" },
              { value: "99", tone: "good" },
            ],
            switchMs: 520,
            holdMs: 900,
          },
        },
        completion: {
          label: "Completion",
          showProgress: false,
          showTaskList: false,
          visual: {
            type: "completion",
            startAtPercent: 0,
            holdMs: 700,
            message: completionMessage,
          },
        },
      },
    },
    flowB: {
      claimId: flowBId,
      freezeOnFinal: true,
      phaseSequence: ["ingestion", "input_normalization", "context_enrichment_validation", "evaluation_pass", "requesting_operator"],
      phases: {
        ingestion: {
          label: "Ingestion phase",
          tasks: ["Receiving claim packet", "Verifying file integrity", "Indexing attachments"],
        },
        input_normalization: {
          label: "Input normalization",
          context: { documentCount: 3, codeTypePrimary: primaryCodeLabel, codeTypeSecondary: secondaryCodeLabel, sourcesAvailable: 3 },
          tasks: [
            "OCR running on {{documentCount}} documents",
            "Extracting {{codeTypePrimary}} codes",
            "Extracting {{codeTypeSecondary}} codes",
            "Mapping fields to schema",
            "Normalizing date formats",
            "Validating required fields",
          ],
          visual: { type: "scan", startAtPercent: 94, docs: ["Doc1", "Doc2", "Doc3"], switchMs: 900, cycles: 2 },
        },
        context_enrichment_validation: {
          label: "Context enrichment and validation",
          context: {
            historicalEntityLabel: `historical ${entityPluralLower}`,
            ruleDomain: ruleDomainLabel,
            caseReferenceLabel,
            reimbursementLabel,
          },
          tasks: ["Fetching {{historicalEntityLabel}}", "Matching {{ruleDomain}}", "Cross-referencing {{caseReferenceLabel}}", "Evaluating {{reimbursementLabel}}"],
          statusStyle: { validatedTone: "success" },
          visual: {
            type: "cross_ref",
            startAtPercent: 90,
            docs: ["Doc1", "Doc2", "Doc3"],
            switchMs: 700,
            cycles: 2,
            rows: [
              { task: "Fetching {{historicalEntityLabel}}", status: "validated" },
              { task: "Matching {{ruleDomain}}", status: "validated" },
              { task: "Cross-referencing {{caseReferenceLabel}}", status: "running" },
            ],
            runningMetaLabel: "Cross-referencing {{caseReferenceLabel}}",
          },
        },
        evaluation_pass: {
          label: "Evaluation pass",
          context: { consistencyEntityLabel },
          tasks: ["Checking {{consistencyEntityLabel}}"],
          visual: {
            type: "confidence",
            startAtPercent: 84,
            rows: [{ task: "Checking {{consistencyEntityLabel}}", status: "running" }],
            values: [
              { value: "--", tone: "neutral" },
              { value: "91", tone: "good" },
              { value: "84", tone: "warning" },
              { value: "78", tone: "risk" },
            ],
            switchMs: 520,
            holdMs: 900,
          },
        },
        requesting_operator: {
          label: "Requesting operator",
          tasks: [],
          statusStyle: { validatedTone: "success" },
          visual: {
            type: "operator_radar",
            startAtPercent: 0,
            rows: [
              { task: "Matching specialists", status: "complete" },
              { task: "6 operators available", status: "complete" },
              { task: "Assigned to operator", status: "running" },
            ],
            frameDurations: [500, 700, 2500, 1300],
            operatorLoop: false,
          },
        },
      },
    },
  };

  const state = {
    flowKey: "flowA",
    elapsedSeconds: 8,
    progress: 0,
    phaseIndex: 0,
    currentTasks: ["Processing step"],
    currentPhaseConfig: null,
    visualModeActive: false,
    visualCompleted: false,
    visualDocIndex: 0,
    crossRefStage: 0,
    running: true,
    frozenFinal: false,
  };

  const processingDocSets = {
    healthcare: ["./Assets/MockDoc1.jpg", "./Assets/MockDoc2.jpg", "./Assets/MockDoc3.jpg"],
    default: ["./Assets/MockDoc4.jpg", "./Assets/MockDoc5.jpg", "./Assets/MockDoc6.jpg"],
  };

  let progressTimer = null;
  let timerInterval = null;
  let visualDocTimer = null;
  let operatorFrameTimer = null;

  const clearTimers = () => {
    if (progressTimer) window.clearTimeout(progressTimer);
    progressTimer = null;
    if (visualDocTimer) window.clearInterval(visualDocTimer);
    visualDocTimer = null;
    if (operatorFrameTimer) window.clearTimeout(operatorFrameTimer);
    operatorFrameTimer = null;
  };

  const interpolateTask = (template, context) =>
    String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(context?.[key] ?? ""));

  const getFlow = () => flowDefs[state.flowKey] || flowDefs.flowA;

  const getValidatedStatusClass = (tone) =>
    tone === "success" ? "is-validated-success" : "is-validated";

  const getThemeDocAssets = () => {
    const activeTheme = themePacks[currentThemeId] || themePacks.smb;
    return activeTheme.id === "healthcare" ? processingDocSets.healthcare : processingDocSets.default;
  };

  const getDocLabel = (src, fallback) => {
    if (!src) return fallback;
    const fileName = src.split("/").pop() || fallback;
    return fileName.replace(/\.[^.]+$/, "");
  };

  const applyProcessingDocImage = (el, src) => {
    if (!el || !src) return;
    el.style.setProperty("--processing-doc-image", `url("${src}")`);
    el.classList.add("has-mock-doc");
  };

  const renderStatusBadge = (status, validatedTone) => {
    if (status === "running") {
      return `
        <span class="processing-task-status is-running">
          <span class="processing-task-status-icon is-spinner" aria-hidden="true"></span>
          <span>Running</span>
        </span>
      `;
    }
    if (status === "complete") {
      return `
        <span class="processing-task-status is-complete">
          <span class="processing-task-status-icon is-check" aria-hidden="true"></span>
          <span>Complete</span>
        </span>
      `;
    }
    const isGreenValidated = validatedTone === "success";
    const validatedLabel = isGreenValidated ? "Complete" : "Validated";
    return `
      <span class="processing-task-status ${getValidatedStatusClass(validatedTone)}">
        <span class="processing-task-status-icon is-check" aria-hidden="true"></span>
        <span>${validatedLabel}</span>
      </span>
    `;
  };

  const getPhaseConfig = (phaseId) => {
    const flow = getFlow();
    return flow.phases?.[phaseId] || flowDefs.flowA.phases.ingestion;
  };

  const renderOperatorRows = (frame) => {
    if (!visualRowsEl) return;
    const rows =
      frame === "4"
        ? [
            { task: "Matching specialists", status: "complete" },
            { task: "6 operators available", status: "complete" },
            { task: "Assigned to operator", status: "complete" },
          ]
        : [
            { task: "Matching specialists", status: "complete" },
            { task: "6 operators available", status: "complete" },
            { task: "Assigned to operator", status: "running" },
          ];

    visualRowsEl.innerHTML = rows
      .map((row) => {
        const showLoading = row.status === "running";
        return `
          <div class="processing-task-row">
            <div class="processing-card-live-row">
              <span class="processing-card-live-text">${row.task}</span>
              ${showLoading ? '<span class="loading-dots" aria-label="loading" role="status"></span>' : ""}
            </div>
            ${renderStatusBadge(row.status, state.currentPhaseConfig?.statusStyle?.validatedTone)}
          </div>
        `;
      })
      .join("");
  };

  const renderPhase = () => {
    const flow = getFlow();
    const phaseId = flow.phaseSequence[state.phaseIndex] || "ingestion";
    const phaseConfig = getPhaseConfig(phaseId);
    const phaseContext = phaseConfig.context || {};
    state.currentPhaseConfig = phaseConfig;
    state.visualModeActive = false;
    state.visualCompleted = false;
    state.visualDocIndex = 0;
    state.crossRefStage = 0;

    clearTimers();

    if (titleEl) titleEl.textContent = flow.claimId;
    if (phaseLabelEl) phaseLabelEl.textContent = phaseConfig.label || "Processing";
    progressEl.hidden = phaseConfig.showProgress === false;
    if (taskListEl) taskListEl.hidden = phaseConfig.showTaskList === false;
    progressEl.setAttribute("aria-label", `${phaseConfig.label || "Processing"} progress`);

    state.currentTasks =
      Array.isArray(phaseConfig.tasks) && phaseConfig.tasks.length > 0
        ? phaseConfig.tasks.map((task) => interpolateTask(task, phaseContext))
        : ["Processing step"];

    if (sourcesLabelEl) {
      const count = phaseContext.sourcesAvailable;
      if (typeof count === "number") sourcesLabelEl.textContent = `${count} sources available`;
    }
    if (docMetaEl) docMetaEl.textContent = `${flow.claimId}\n${phaseConfig.label || "Processing phase"}\nSTATUS: SCANNING`;
    if (completionTextEl) {
      const completionTemplate = phaseConfig.visual?.message || "Claim processed successfully";
      completionTextEl.textContent = interpolateTask(completionTemplate, phaseContext);
    }

    cardEl.classList.remove("is-visual-mode");
    visualPanelEl.hidden = true;
    if (taskListEl && phaseConfig.showTaskList !== false) taskListEl.hidden = false;
    if (docScanEl) docScanEl.hidden = true;
    if (crossRefEl) crossRefEl.hidden = true;
    if (sourcesLineEl) sourcesLineEl.hidden = true;
    if (confidencePanelEl) confidencePanelEl.hidden = true;
    if (completionPanelEl) completionPanelEl.hidden = true;
    if (operatorPanelEl) operatorPanelEl.hidden = true;
    if (operatorRadarEl) {
      operatorRadarEl.classList.remove("is-live");
      operatorRadarEl.dataset.frame = "1";
    }
    if (crossRefStackEl) crossRefStackEl.dataset.stage = "0";
    if (confidenceOrbEl) confidenceOrbEl.classList.remove("is-active", "is-good", "is-warning", "is-risk");
    if (confidenceValueEl) confidenceValueEl.textContent = "--%";
  };

  const renderTasksByProgress = (value) => {
    if (!taskListEl || state.visualModeActive) return;
    const activeIndex = Math.min(state.currentTasks.length - 1, Math.floor((value / 100) * state.currentTasks.length));
    const visibleCount = Math.min(state.currentTasks.length, activeIndex + 1);
    const start = Math.max(0, visibleCount - 3);
    const rows = [];
    for (let i = start; i < visibleCount; i += 1) {
      const isActive = i === activeIndex;
      rows.push(`
        <div class="processing-task-row">
          <div class="processing-card-live-row">
            <span class="processing-card-live-text">${state.currentTasks[i]}</span>
            ${isActive ? '<span class="loading-dots" aria-label="loading" role="status"></span>' : ""}
          </div>
          ${renderStatusBadge(isActive ? "running" : "validated", state.currentPhaseConfig?.statusStyle?.validatedTone)}
        </div>
      `);
    }
    taskListEl.innerHTML = rows.join("");
  };

  const setProgress = (value) => {
    state.progress = value;
    progressTrackEl.style.width = `${value}%`;
    progressEl.setAttribute("aria-valuenow", String(value));
    const visualStartAt = state.currentPhaseConfig?.visual?.startAtPercent;
    if (typeof visualStartAt === "number" && value >= visualStartAt) startVisualMode();
    renderTasksByProgress(value);
  };

  const startVisualMode = () => {
    if (state.visualModeActive || !visualPanelEl) return;
    const visualConfig = state.currentPhaseConfig?.visual || {};
    const phaseContext = state.currentPhaseConfig?.context || {};
    const visualType = visualConfig.type || "scan";
    const docs = visualConfig.docs || ["Doc1", "Doc2", "Doc3"];
    const docAssets = getThemeDocAssets();
    const switchMs = visualConfig.switchMs || 900;
    const totalCycles = visualConfig.cycles || 2;
    let completedLoops = 0;

    state.visualModeActive = true;
    state.visualCompleted = false;
    cardEl.classList.add("is-visual-mode");
    visualPanelEl.hidden = false;
    if (taskListEl) taskListEl.hidden = true;
    if (docScanEl) docScanEl.hidden = visualType !== "scan";
    if (crossRefEl) crossRefEl.hidden = visualType !== "cross_ref";
    if (confidencePanelEl) confidencePanelEl.hidden = visualType !== "confidence";
    if (completionPanelEl) completionPanelEl.hidden = visualType !== "completion";
    if (operatorPanelEl) operatorPanelEl.hidden = visualType !== "operator_radar";

    if (sourcesLineEl) {
      if (typeof phaseContext.sourcesAvailable === "number" && visualType === "scan") {
        sourcesLineEl.hidden = false;
      } else {
        sourcesLineEl.hidden = true;
      }
    }

    if (visualRowsEl) {
      const visualRows = Array.isArray(visualConfig.rows) ? visualConfig.rows : [];
      visualRowsEl.innerHTML = visualRows
        .map((row) => {
          const rowTask = interpolateTask(row.task || "", phaseContext);
          const rowStatus = row.status === "running" ? "running" : "validated";
          const showLoading = rowStatus === "running";
          return `
            <div class="processing-task-row">
              <div class="processing-card-live-row">
                <span class="processing-card-live-text">${rowTask}</span>
                ${showLoading ? '<span class="loading-dots" aria-label="loading" role="status"></span>' : ""}
              </div>
              ${renderStatusBadge(rowStatus, state.currentPhaseConfig?.statusStyle?.validatedTone)}
            </div>
          `;
        })
        .join("");
    }

    if (docPreviewEl) applyProcessingDocImage(docPreviewEl, docAssets[state.visualDocIndex] || docAssets[0]);
    if (docLabelEl) docLabelEl.textContent = getDocLabel(docAssets[state.visualDocIndex], docs[state.visualDocIndex] || "Doc1");
    if (crossRefDocLeftEl) {
      applyProcessingDocImage(crossRefDocLeftEl.parentElement, docAssets[0]);
      crossRefDocLeftEl.textContent = getDocLabel(docAssets[0], docs[0] || "Doc1");
    }
    if (crossRefDocRightEl) {
      applyProcessingDocImage(crossRefDocRightEl.parentElement, docAssets[1] || docAssets[0]);
      crossRefDocRightEl.textContent = getDocLabel(docAssets[1], docs[1] || "Doc2");
    }
    if (crossRefDocFrontEl) {
      applyProcessingDocImage(crossRefDocFrontEl.parentElement, docAssets[2] || docAssets[0]);
      crossRefDocFrontEl.textContent = getDocLabel(docAssets[2], docs[2] || "Doc3");
    }
    if (visualType === "cross_ref") {
      state.crossRefStage = Number(visualConfig.initialStage ?? 0);
      if (crossRefStackEl) crossRefStackEl.dataset.stage = String(state.crossRefStage);
    }
    if (crossRefMetaTextEl) {
      const metaTemplate = visualConfig.runningMetaLabel || "Cross-referencing {{caseReferenceLabel}}";
      crossRefMetaTextEl.textContent = interpolateTask(metaTemplate, phaseContext);
    }

    if (visualType === "completion") {
      state.visualCompleted = true;
      return;
    }

    if (visualType === "confidence" && confidenceValueEl) {
      const values = visualConfig.values || [{ value: "--", tone: "neutral" }, { value: "92", tone: "good" }];
      const holdMs = visualConfig.holdMs || 900;
      let idx = 0;
      const update = () => {
        const item = values[idx];
        const raw = String(item.value ?? item);
        const tone = item.tone || "neutral";
        confidenceValueEl.textContent = `${raw}%`;
        if (confidenceOrbEl) {
          confidenceOrbEl.classList.remove("is-active", "is-good", "is-warning", "is-risk");
          if (tone === "good") confidenceOrbEl.classList.add("is-active", "is-good");
          if (tone === "warning") confidenceOrbEl.classList.add("is-active", "is-warning");
          if (tone === "risk") confidenceOrbEl.classList.add("is-active", "is-risk");
        }
      };
      update();
      visualDocTimer = window.setInterval(() => {
        if (isFrozen()) return;
        if (idx >= values.length - 1) {
          window.clearInterval(visualDocTimer);
          visualDocTimer = null;
          window.setTimeout(() => {
            state.visualCompleted = true;
          }, holdMs);
          return;
        }
        idx += 1;
        update();
      }, switchMs);
      return;
    }

    if (visualType === "operator_radar") {
      const frameDurations = visualConfig.frameDurations || [500, 700, 2500, 1300];
      const frames = ["1", "2", "3", "4"];
      const loop = visualConfig.operatorLoop !== false;
      let frameIndex = 0;
      if (operatorRadarEl) {
        operatorRadarEl.classList.remove("is-live");
        void operatorRadarEl.offsetWidth;
        operatorRadarEl.dataset.frame = frames[frameIndex];
        operatorRadarEl.classList.add("is-live");
      }
      renderOperatorRows(frames[frameIndex]);
      const advanceFrame = () => {
        if (!operatorRadarEl || operatorPanelEl?.hidden) return;
        if (isFrozen()) {
          operatorFrameTimer = window.setTimeout(advanceFrame, 120);
          return;
        }
        if (frameIndex >= frames.length - 1 && !loop) {
          state.visualCompleted = true;
          return;
        }
        frameIndex = (frameIndex + 1) % frames.length;
        operatorRadarEl.dataset.frame = frames[frameIndex];
        renderOperatorRows(frames[frameIndex]);
        operatorFrameTimer = window.setTimeout(advanceFrame, frameDurations[frameIndex] || 1000);
      };
      operatorFrameTimer = window.setTimeout(advanceFrame, frameDurations[0] || 1000);
      state.visualCompleted = loop;
      return;
    }

    visualDocTimer = window.setInterval(() => {
      if (isFrozen()) return;
      if (visualType === "scan") {
        state.visualDocIndex = (state.visualDocIndex + 1) % docs.length;
        if (docPreviewEl) applyProcessingDocImage(docPreviewEl, docAssets[state.visualDocIndex] || docAssets[0]);
        if (docLabelEl) {
          docLabelEl.textContent = getDocLabel(
            docAssets[state.visualDocIndex],
            docs[state.visualDocIndex] || "Doc1"
          );
        }
        if (state.visualDocIndex === docs.length - 1) completedLoops += 1;
      } else if (visualType === "cross_ref") {
        state.crossRefStage = (state.crossRefStage + 1) % 4;
        if (crossRefStackEl) crossRefStackEl.dataset.stage = String(state.crossRefStage);
        if (state.crossRefStage === 3) completedLoops += 1;
      }
      if (completedLoops >= totalCycles) {
        if (visualType === "cross_ref" && crossRefStackEl) crossRefStackEl.dataset.stage = "3";
        window.clearInterval(visualDocTimer);
        visualDocTimer = null;
        state.visualCompleted = true;
      }
    }, switchMs);
  };

  const formatTimer = (value) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const stop = () => {
    state.running = false;
    clearTimers();
    if (timerInterval) window.clearInterval(timerInterval);
    timerInterval = null;
  };

  const completeFlow = () => {
    const flow = getFlow();
    if (flow.freezeOnFinal) {
      state.frozenFinal = true;
      stop();
      return;
    }

    window.setTimeout(() => {
      cardEl.classList.add("is-hidden");
      window.setTimeout(() => {
        state.flowKey = "flowB";
        state.phaseIndex = 0;
        state.progress = 0;
        state.elapsedSeconds = 8;
        timerEl.textContent = formatTimer(state.elapsedSeconds);
        renderPhase();
        setProgress(0);
        cardEl.classList.remove("is-hidden");
        state.running = true;
        tickProgress();
      }, 280);
    }, flow.holdAfterMs || 2500);
  };

  const tickProgress = () => {
    if (!state.running || state.frozenFinal) return;
    if (isFrozen()) {
      progressTimer = window.setTimeout(tickProgress, 120);
      return;
    }

    if (state.progress >= 100) {
      if (state.visualModeActive && !state.visualCompleted) {
        progressTimer = window.setTimeout(tickProgress, 120);
        return;
      }

      const flow = getFlow();
      const atLast = state.phaseIndex >= flow.phaseSequence.length - 1;
      if (atLast) {
        completeFlow();
        return;
      }

      progressTimer = window.setTimeout(() => {
        state.phaseIndex += 1;
        renderPhase();
        setProgress(0);
        tickProgress();
      }, 450);
      return;
    }

    const remaining = 100 - state.progress;
    const baseStep = state.progress < 55 ? 3.6 : state.progress < 85 ? 2.8 : 1.8;
    const jitter = (Math.random() - 0.5) * 1.1;
    const step = Math.max(0.7, Math.min(4.4, baseStep + jitter));
    setProgress(Math.min(100, Math.round(state.progress + step)));

    const baseDelay = state.progress < 60 ? 46 : state.progress < 90 ? 62 : 84;
    const delayJitter = Math.floor(Math.random() * 44);
    const nearEndPause = remaining < 12 ? Math.floor(Math.random() * 80) : 0;
    progressTimer = window.setTimeout(tickProgress, baseDelay + delayJitter + nearEndPause);
  };

  timerEl.textContent = formatTimer(state.elapsedSeconds);
  timerInterval = window.setInterval(() => {
    if (state.frozenFinal || isFrozen()) return;
    state.elapsedSeconds += 1;
    timerEl.textContent = formatTimer(state.elapsedSeconds);
  }, 1000);

  renderPhase();
  setProgress(0);
  tickProgress();
}

initFeedProcessingDemo();

let previousProfile = store.getState();
store.subscribe((nextState) => {
  presenterPanel.sync(nextState);

  const hasThemeChanged = nextState.currentThemeId !== previousProfile.currentThemeId;
  const hasScenarioChanged = nextState.currentScenarioId !== previousProfile.currentScenarioId;
  const hasRunReset = nextState.runNonce !== previousProfile.runNonce;

  if (hasRunReset) {
    window.location.href = buildRouteWithProfile("./feeds.html", store.getState());
    return;
  }

  if (!hasThemeChanged && !hasScenarioChanged) {
    previousProfile = nextState;
    return;
  }

  applyFeedProfile(nextState);
  renderLiveMetrics();
  previousProfile = nextState;
});
