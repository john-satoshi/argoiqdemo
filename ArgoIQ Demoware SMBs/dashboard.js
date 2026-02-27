import { scenarios, themePacks } from "./dashboard-config.js";
import { createRuntimeStore } from "./dashboard-store.js";
import { renderSharedNavbar } from "./shared-navbar.js";
import { initPresenterPanel } from "./presenter-controls.js";

renderSharedNavbar({ active: "dashboard", logoTriggerId: "presenterLogoTrigger" });

const el = {
  navDashboard: document.getElementById("navDashboard"),
  navFeeds: document.getElementById("navFeeds"),
  navInsight: document.getElementById("navInsight"),
  moduleTitle: document.getElementById("moduleTitle"),
  moduleTag: document.getElementById("moduleTag"),
  moduleDescription: document.getElementById("moduleDescription"),
  secondaryModuleTitle: document.getElementById("secondaryModuleTitle"),
  secondaryModuleTag: document.getElementById("secondaryModuleTag"),
  secondaryModuleDescription: document.getElementById("secondaryModuleDescription"),
  tertiaryModuleTitle: document.getElementById("tertiaryModuleTitle"),
  tertiaryModuleTag: document.getElementById("tertiaryModuleTag"),
  tertiaryModuleDescription: document.getElementById("tertiaryModuleDescription"),
  labelMetricActive: document.getElementById("labelMetricActive"),
  labelMetricCompleted: document.getElementById("labelMetricCompleted"),
  labelMetricCycle: document.getElementById("labelMetricCycle"),
  labelMetricEta: document.getElementById("labelMetricEta"),
  labelMetricOperators: document.getElementById("labelMetricOperators"),
  metricFetching: document.getElementById("metric-fetching"),
  metricCompleted: document.getElementById("metric-completed"),
  metricCycleTime: document.getElementById("metric-cycle-time"),
  metricEta: document.getElementById("metric-eta"),
  metricOperators: document.getElementById("metric-operators"),
  secondaryMetricFetching: document.getElementById("secondaryMetricFetching"),
  secondaryMetricCompleted: document.getElementById("secondaryMetricCompleted"),
  secondaryMetricCycleTime: document.getElementById("secondaryMetricCycleTime"),
  secondaryMetricEta: document.getElementById("secondaryMetricEta"),
  secondaryMetricOperators: document.getElementById("secondaryMetricOperators"),
  tertiaryMetricFetching: document.getElementById("tertiaryMetricFetching"),
  tertiaryMetricCompleted: document.getElementById("tertiaryMetricCompleted"),
  tertiaryMetricCycleTime: document.getElementById("tertiaryMetricCycleTime"),
  tertiaryMetricEta: document.getElementById("tertiaryMetricEta"),
  tertiaryMetricOperators: document.getElementById("tertiaryMetricOperators"),
  liveEventLabel: document.getElementById("liveEventLabel"),
  liveEventValue: document.getElementById("liveEventValue"),
  secondaryLiveEventValue: document.getElementById("secondaryLiveEventValue"),
  tertiaryLiveEventValue: document.getElementById("tertiaryLiveEventValue"),
  workflowCta: document.getElementById("workflowCta"),
  statusDot: document.querySelector(".status-dot"),
  primaryAvatars: Array.from(document.querySelectorAll(".workflow-card--primary .workflow-avatars .workflow-avatar")),
  allAvatars: Array.from(document.querySelectorAll(".workflow-avatars .workflow-avatar")),
  presenterPanel: document.getElementById("presenterPanel"),
  presenterTheme: document.getElementById("presenterTheme"),
  presenterScenario: document.getElementById("presenterScenario"),
  presenterSpeed: document.getElementById("presenterSpeed"),
  presenterReset: document.getElementById("presenterReset"),
  presenterFreeze: document.getElementById("presenterFreeze"),
  presenterShare: document.getElementById("presenterShare"),
  presenterClose: document.getElementById("presenterClose"),
  presenterLogoTrigger: document.getElementById("presenterLogoTrigger"),
  chatFocusOverlay: document.getElementById("chatFocusOverlay"),
  chatTranscript: document.getElementById("chatTranscript"),
  floatingChatInput: document.getElementById("floatingChatInput"),
  floatingChatSend: document.querySelector(".floating-chat-send"),
  primaryCardArticle: document.querySelector(".workflow-card--primary"),
  secondaryCardArticle: document.querySelector(".workflow-card--secondary"),
  tertiaryCardArticle: document.querySelector(".workflow-card--tertiary"),
};

const store = createRuntimeStore();
const FEEDS_ROUTE = "./feeds.html";
const INSIGHT_ROUTE = "./insight.html";
const OPERATOR_POOL_TOTAL = 16;
const SECONDARY_CARD_OPERATORS = 4;
const TERTIARY_CARD_OPERATORS = 3;
const PRIMARY_CARD_MIN_OPERATORS = 3;
const PRIMARY_CARD_MAX_OPERATORS =
  Math.min(
    OPERATOR_POOL_TOTAL - SECONDARY_CARD_OPERATORS - TERTIARY_CARD_OPERATORS,
    el.primaryAvatars.length,
  );

const AVATAR_IMAGE_FILES = [
  "Frame 1000002674.jpg",
  "Frame 1000002696.jpg",
  "Frame 1000002697.jpg",
  "Frame 1000002698.jpg",
  "Frame 1000002699.jpg",
  "Frame 1000002700.jpg",
  "Frame 1000002701.jpg",
  "Frame 1000002702.jpg",
  "Frame 1000002703.jpg",
  "Frame 1000002704.jpg",
  "Frame 1000002705.jpg",
  "Frame 1000002706.jpg",
  "Frame 1000002707.jpg",
  "Frame 1000002708.jpg",
  "Frame 1000002709.jpg",
  "Frame 1000002710.jpg",
];

const simulator = {
  intervalId: null,
  due: null,
  rng: null,
  state: null,
  secondaryDue: null,
  tertiaryDue: null,
  secondaryState: null,
  tertiaryState: null,
};

const DASHBOARD_SUPPORT_MODULES = {
  healthcare: {
    secondary: {
      title: "Clinical QA & Denial Prevention",
      tag: "Clinical",
      description:
        "Reviews clinical documentation quality, flags denial risks, and routes edge cases to specialists before payer submission.",
    },
    tertiary: {
      title: "Provider Intake & Credentialing",
      tag: "Provider Ops",
      description:
        "Validates provider onboarding packets, compliance attestations, and network eligibility before activation.",
    },
  },
  smb: {
    secondary: {
      title: "Support QA & AI Oversight",
      tag: "CX",
      description:
        "Monitors AI-generated support replies, flags risky or off-brand responses, and routes edge cases for human review before sending.",
    },
    tertiary: {
      title: "Vendor & Marketplace Ops",
      tag: "Marketplace",
      description:
        "Validates vendor submissions, listing updates, and compliance checks before activation to protect quality and conversion.",
    },
  },
  future: {
    secondary: {
      title: "Agent QA & Policy Guardrails",
      tag: "Governance",
      description:
        "Audits agent outputs against policy constraints, catches drift, and routes high-risk runs to human supervision.",
    },
    tertiary: {
      title: "Partner & Network Orchestration",
      tag: "Ecosystem",
      description:
        "Monitors partner workflows, onboarding checks, and cross-system readiness before autonomous deployment.",
    },
  },
};

const chat = {
  stepIndex: 0,
  isBusy: false,
  runToken: 0,
};

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randBetween(rng, min, max) {
  return min + rng() * (max - min);
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)] || list[0];
}

function formatCycleTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function formatEta(seconds) {
  if (seconds >= 60) return `${Math.ceil(seconds / 60)}m`;
  return `${seconds}s`;
}

function pulseValue(node) {
  if (!node) return;
  node.classList.remove("metric-updated");
  window.requestAnimationFrame(() => node.classList.add("metric-updated"));
}

function setText(node, value) {
  if (!node) return;
  node.textContent = value;
}

function renderOperatorAvatars(count) {
  el.primaryAvatars.forEach((node, index) => {
    node.style.display = index < count ? "grid" : "none";
  });
}

function applyAvatarPhotos() {
  if (!el.allAvatars.length) return;
  const avatarBase = "./Assets:ProfilePicture/";

  el.allAvatars.forEach((node, index) => {
    const file = AVATAR_IMAGE_FILES[index % AVATAR_IMAGE_FILES.length];
    const src = `${avatarBase}${encodeURIComponent(file)}`;

    node.style.backgroundImage = `url("${src}")`;
    node.style.backgroundSize = "cover";
    node.style.backgroundPosition = "center";
    node.style.backgroundRepeat = "no-repeat";
    node.textContent = "";
    node.setAttribute("aria-hidden", "true");
  });
}

function buildEntityId(theme, rng) {
  const prefix = pick(rng, theme.entityNaming.idPrefixes);
  const n = Math.floor(randBetween(rng, 1000, 99999));
  return `${prefix}-${n}`;
}

function buildLiveEvent(theme, scenario, rng) {
  const template = pick(rng, theme.liveEventTemplates);
  const status =
    scenario.mode === "flagged"
      ? theme.statusVocabulary.flagged
      : scenario.mode === "auto"
        ? theme.statusVocabulary.autoApproved
        : rng() > 0.6
          ? theme.statusVocabulary.flagged
          : theme.statusVocabulary.validated;

  const payload = {
    entity: theme.entityNaming.singular,
    id: buildEntityId(theme, rng),
    status,
    operatorRole:
      scenario.mode === "flagged" || (scenario.mode === "mixed" && rng() > 0.5)
        ? theme.roleTitles.primaryOperator
        : theme.roleTitles.secondaryOperator,
  };

  return template
    .replaceAll("{entity}", payload.entity)
    .replaceAll("{id}", payload.id)
    .replaceAll("{status}", payload.status)
    .replaceAll("{operatorRole}", payload.operatorRole);
}

function applyThemeAndScenarioText(state) {
  const theme = themePacks[state.currentThemeId];
  const scenario = scenarios[state.currentScenarioId];
  const module = theme.modules[scenario.primaryModuleKey];
  const supportModules = DASHBOARD_SUPPORT_MODULES[theme.id] || DASHBOARD_SUPPORT_MODULES.smb;

  setText(el.navDashboard, theme.nav.dashboard);
  setText(el.navFeeds, theme.nav.feeds);
  setText(el.navInsight, theme.nav.insight);

  setText(el.moduleTitle, module.title);
  setText(el.moduleTag, module.tag);
  setText(el.moduleDescription, module.description);
  setText(el.secondaryModuleTitle, supportModules.secondary.title);
  setText(el.secondaryModuleTag, supportModules.secondary.tag);
  setText(el.secondaryModuleDescription, supportModules.secondary.description);
  setText(el.tertiaryModuleTitle, supportModules.tertiary.title);
  setText(el.tertiaryModuleTag, supportModules.tertiary.tag);
  setText(el.tertiaryModuleDescription, supportModules.tertiary.description);

  setText(el.labelMetricActive, theme.kpiLabels.activeCases);
  setText(el.labelMetricCompleted, theme.kpiLabels.completedToday);
  setText(el.labelMetricCycle, theme.kpiLabels.avgCycle);
  setText(el.labelMetricEta, theme.kpiLabels.nextReviewEta);
  setText(el.labelMetricOperators, theme.kpiLabels.operatorsAvailable);

  setText(el.liveEventLabel, theme.microcopy.liveEventLabel);
  setText(el.workflowCta, theme.microcopy.ctaPrimary);
  if (el.floatingChatInput) {
    el.floatingChatInput.placeholder = theme.conversation.placeholder;
  }

  if (el.statusDot) {
    el.statusDot.classList.remove("is-auto", "is-flagged", "is-mixed");
    el.statusDot.classList.add(`is-${scenario.mode}`);
    el.statusDot.setAttribute("title", theme.microcopy.tooltip);
  }

  if (el.primaryCardArticle) el.primaryCardArticle.setAttribute("aria-label", module.title);
  if (el.secondaryCardArticle) {
    el.secondaryCardArticle.setAttribute("aria-label", supportModules.secondary.title);
  }
  if (el.tertiaryCardArticle) {
    el.tertiaryCardArticle.setAttribute("aria-label", supportModules.tertiary.title);
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function trimChatTranscript(maxNodes = 14) {
  if (!el.chatTranscript) return;
  while (el.chatTranscript.children.length > maxNodes) {
    el.chatTranscript.removeChild(el.chatTranscript.firstElementChild);
  }
}

function syncChatFocusOverlay() {
  if (!el.chatFocusOverlay || !el.chatTranscript) return;
  const hasTranscript = el.chatTranscript.children.length > 0;
  const isActive = chat.isBusy || hasTranscript;
  el.chatFocusOverlay.classList.toggle("is-active", isActive);
}

function appendUserBubble(text) {
  if (!el.chatTranscript) return null;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--user";
  bubble.textContent = text;
  el.chatTranscript.appendChild(bubble);
  window.requestAnimationFrame(() => {
    const styles = window.getComputedStyle(bubble);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    if (bubble.scrollHeight > lineHeight * 1.35) {
      bubble.classList.add("is-multiline");
    }
  });
  trimChatTranscript();
  syncChatFocusOverlay();
  bubble.scrollIntoView({ block: "end", behavior: "smooth" });
  return bubble;
}

function appendAssistantTypingBubble() {
  if (!el.chatTranscript) return null;

  const row = document.createElement("div");
  row.className = "chat-assistant-row";

  const mark = document.createElement("span");
  mark.className = "chat-assistant-mark";
  const markImg = document.createElement("img");
  markImg.src = "./Assets/A-logo.svg";
  markImg.alt = "";
  markImg.setAttribute("aria-hidden", "true");
  mark.appendChild(markImg);

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--assistant chat-bubble--typing";
  const dots = document.createElement("span");
  dots.className = "chat-typing-dots";
  dots.setAttribute("aria-label", "Assistant is typing");
  bubble.appendChild(dots);

  row.appendChild(mark);
  row.appendChild(bubble);
  el.chatTranscript.appendChild(row);
  trimChatTranscript();
  syncChatFocusOverlay();
  row.scrollIntoView({ block: "end", behavior: "smooth" });

  return row;
}

function createAssistantMessageRow() {
  if (!el.chatTranscript) return null;

  const row = document.createElement("div");
  row.className = "chat-assistant-row";

  const mark = document.createElement("span");
  mark.className = "chat-assistant-mark";
  const markImg = document.createElement("img");
  markImg.src = "./Assets/A-logo.svg";
  markImg.alt = "";
  markImg.setAttribute("aria-hidden", "true");
  mark.appendChild(markImg);

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--assistant";
  const content = document.createElement("span");
  content.className = "chat-text-typing";
  const cursor = document.createElement("span");
  cursor.className = "chat-text-cursor";
  cursor.setAttribute("aria-hidden", "true");

  bubble.appendChild(content);
  bubble.appendChild(cursor);
  row.appendChild(mark);
  row.appendChild(bubble);
  el.chatTranscript.appendChild(row);
  trimChatTranscript();
  syncChatFocusOverlay();
  row.scrollIntoView({ block: "end", behavior: "smooth" });

  return { row, content, cursor };
}

function appendAssistantCtaButton(label) {
  if (!el.chatTranscript) return null;

  const row = document.createElement("div");
  row.className = "chat-transcript-cta-row";

  const button = document.createElement("button");
  button.className = "chat-transcript-cta";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => {
    el.workflowCta?.click();
  });

  row.appendChild(button);
  el.chatTranscript.appendChild(row);
  trimChatTranscript();
  syncChatFocusOverlay();
  row.scrollIntoView({ block: "end", behavior: "smooth" });

  return row;
}

function getConversationSnapshot(runtime) {
  const scenario = scenarios[runtime.currentScenarioId];
  const metrics = simulator.state || scenario.metrics;
  const total = Math.max(1, Number(metrics.activeCases) || 1);

  const humanRatio =
    scenario.mode === "flagged" ? 0.42 : scenario.mode === "auto" ? 0.08 : 0.24;
  const humanCount = clamp(Math.round(total * humanRatio), 0, total);
  const aiCount = Math.max(0, total - humanCount);

  const flaggedBase = scenario.mode === "flagged" ? 3 : scenario.mode === "mixed" ? 2 : 1;
  const flaggedCount = clamp(Math.round(total * 0.08) + flaggedBase, 1, Math.max(1, total));

  const anomalyText =
    scenario.mode === "flagged"
      ? "An anomaly cluster is currently contained and under active review."
      : scenario.mode === "mixed"
        ? "A minor anomaly cluster was detected and is stabilizing."
        : "No active anomaly cluster is impacting throughput.";

  const riskState =
    scenario.mode === "flagged"
      ? "Elevated"
      : scenario.mode === "mixed"
        ? "Watch"
        : "Stable";

  return {
    total,
    aiCount,
    humanCount,
    flaggedCount,
    avgCycleSeconds: Number(metrics.avgCycleSeconds) || scenario.metrics.avgCycleSeconds,
    anomalyText,
    riskState,
  };
}

function buildConversationTurns(runtime) {
  const theme = themePacks[runtime.currentThemeId];
  const scenario = scenarios[runtime.currentScenarioId];
  const module = theme.modules[scenario.primaryModuleKey];
  const convo = theme.conversation;
  const snapshot = getConversationSnapshot(runtime);
  const entityPlural = theme.entityNaming.plural.toLowerCase();
  const statusQuestion = convo.statusQuestionTemplate.replace("{workflow}", module.name);

  const statusSummary =
    `${module.title} is active.\n` +
    `${snapshot.total} ${entityPlural} in progress.\n` +
    `${snapshot.aiCount} ${entityPlural} ${convo.aiLabel}.\n` +
    `${snapshot.humanCount} ${entityPlural} ${convo.humanLabel}.\n` +
    `${convo.performanceMetric}: ${formatCycleTime(snapshot.avgCycleSeconds)}.\n` +
    `${snapshot.anomalyText}`;

  const riskSummary =
    `${snapshot.flaggedCount} ${entityPlural} flagged for ${convo.riskSignal}.\n` +
    `Assigned to ${theme.roleTitles.primaryOperator}.\n` +
    `${convo.riskMetric}: ${snapshot.riskState}.`;

  return [
    { user: statusQuestion, assistant: statusSummary },
    { user: convo.riskQuestion, assistant: riskSummary, ctaLabel: `${theme.microcopy.ctaPrimary}` },
  ];
}

async function typeAssistantText(target, text, speedMultiplier, runToken) {
  const baseDelay = Math.max(10, Math.round(20 / speedMultiplier));
  let output = "";
  for (let i = 0; i < text.length; i += 1) {
    if (runToken !== chat.runToken || !target.content) return false;
    const char = text[i];
    output += char;
    target.content.textContent = output;
    let delay = baseDelay;
    if (char === "." || char === "," || char === ":") delay += Math.round(40 / speedMultiplier);
    if (char === " ") delay = Math.max(8, Math.round(delay * 0.75));
    await wait(delay);
  }
  if (target.cursor) {
    target.cursor.remove();
  }
  return true;
}

function lockChatComposer(locked) {
  if (el.floatingChatInput) {
    el.floatingChatInput.readOnly = true;
    el.floatingChatInput.classList.add("is-scripted");
    el.floatingChatInput.value = "";
  }
  if (el.floatingChatSend) {
    el.floatingChatSend.disabled = locked;
  }
}

function goToFeeds() {
  const runtime = store.getState();
  const url = new URL(FEEDS_ROUTE, window.location.href);
  url.searchParams.set("theme", runtime.currentThemeId);
  url.searchParams.set("scenario", runtime.currentScenarioId);
  url.searchParams.set("speed", String(runtime.speedMultiplier));
  window.location.href = url.toString();
}

function goToInsight() {
  const runtime = store.getState();
  const url = new URL(INSIGHT_ROUTE, window.location.href);
  url.searchParams.set("theme", runtime.currentThemeId);
  url.searchParams.set("scenario", runtime.currentScenarioId);
  url.searchParams.set("speed", String(runtime.speedMultiplier));
  window.location.href = url.toString();
}

function resetChatFlow() {
  chat.stepIndex = 0;
  chat.isBusy = false;
  chat.runToken += 1;
  if (el.chatTranscript) {
    el.chatTranscript.innerHTML = "";
  }
  lockChatComposer(false);
  syncChatFocusOverlay();
}

async function advanceChatFlow() {
  if (chat.isBusy) return;

  const runtime = store.getState();
  const steps = buildConversationTurns(runtime);
  if (!steps || !steps.length) return;

  if (chat.stepIndex >= steps.length) {
    chat.stepIndex = 0;
  }

  chat.isBusy = true;
  lockChatComposer(true);
  syncChatFocusOverlay();
  const token = chat.runToken;
  const step = steps[chat.stepIndex];
  chat.stepIndex += 1;

  appendUserBubble(step.user);
  await wait(Math.round(320 / runtime.speedMultiplier));
  if (token !== chat.runToken) return;

  const typingRow = appendAssistantTypingBubble();
  await wait(Math.round(700 / runtime.speedMultiplier));
  if (token !== chat.runToken) return;

  if (typingRow) {
    typingRow.remove();
    syncChatFocusOverlay();
  }

  const assistantRow = createAssistantMessageRow();
  if (!assistantRow) return;

  const typed = await typeAssistantText(assistantRow, step.assistant, runtime.speedMultiplier, token);
  if (!typed || token !== chat.runToken) return;

  if (step.ctaLabel) {
    appendAssistantCtaButton(step.ctaLabel);
  }

  chat.isBusy = false;
  lockChatComposer(false);
  syncChatFocusOverlay();
}

function writeMetrics(metrics) {
  setText(el.metricFetching, String(metrics.activeCases));
  setText(el.metricCompleted, String(metrics.completedToday));
  setText(el.metricCycleTime, formatCycleTime(metrics.avgCycleSeconds));
  setText(el.metricEta, formatEta(metrics.nextReviewEtaSeconds));
  setText(el.metricOperators, String(metrics.operatorsAvailable));
  renderOperatorAvatars(metrics.operatorsAvailable);
}

function setupRunState(state) {
  const scenario = scenarios[state.currentScenarioId];
  const initialPrimaryOperators = clamp(
    scenario.metrics.operatorsAvailable,
    PRIMARY_CARD_MIN_OPERATORS,
    PRIMARY_CARD_MAX_OPERATORS,
  );

  simulator.state = {
    activeCases: scenario.metrics.activeCases,
    completedToday: scenario.metrics.completedToday,
    avgCycleSeconds: scenario.metrics.avgCycleSeconds,
    nextReviewEtaSeconds: scenario.metrics.nextReviewEtaSeconds,
    operatorsAvailable: initialPrimaryOperators,
  };

  writeMetrics(simulator.state);

  const seed =
    scenario.seed + hashString(state.currentThemeId) + hashString(state.currentScenarioId) + state.runNonce;
  simulator.rng = mulberry32(seed);

  setText(el.liveEventValue, buildLiveEvent(themePacks[state.currentThemeId], scenario, simulator.rng));

  simulator.secondaryState = {
    activeCases: 14,
    completedToday: 62,
    avgCycleSeconds: 198,
    nextReviewEtaSeconds: 120,
    operatorsAvailable: SECONDARY_CARD_OPERATORS,
  };
  simulator.tertiaryState = {
    activeCases: 9,
    completedToday: 31,
    avgCycleSeconds: 246,
    nextReviewEtaSeconds: 180,
    operatorsAvailable: TERTIARY_CARD_OPERATORS,
  };

  setText(el.secondaryMetricFetching, String(simulator.secondaryState.activeCases));
  setText(el.secondaryMetricCompleted, String(simulator.secondaryState.completedToday));
  setText(el.secondaryMetricCycleTime, formatCycleTime(simulator.secondaryState.avgCycleSeconds));
  setText(el.secondaryMetricEta, formatEta(simulator.secondaryState.nextReviewEtaSeconds));
  setText(el.secondaryMetricOperators, String(simulator.secondaryState.operatorsAvailable));

  setText(el.tertiaryMetricFetching, String(simulator.tertiaryState.activeCases));
  setText(el.tertiaryMetricCompleted, String(simulator.tertiaryState.completedToday));
  setText(el.tertiaryMetricCycleTime, formatCycleTime(simulator.tertiaryState.avgCycleSeconds));
  setText(el.tertiaryMetricEta, formatEta(simulator.tertiaryState.nextReviewEtaSeconds));
  setText(el.tertiaryMetricOperators, String(simulator.tertiaryState.operatorsAvailable));

  setText(el.secondaryLiveEventValue, buildLiveEvent(themePacks[state.currentThemeId], scenario, simulator.rng));
  setText(el.tertiaryLiveEventValue, buildLiveEvent(themePacks[state.currentThemeId], scenario, simulator.rng));
}

function computeDue(now, speed, rng) {
  const scale = 1 / speed;
  return {
    activeCases: now + randBetween(rng, 1300, 3000) * scale,
    completedToday: now + randBetween(rng, 1800, 3600) * scale,
    avgCycleSeconds: now + randBetween(rng, 2200, 4200) * scale,
    nextReviewEtaSeconds: now + randBetween(rng, 1400, 2600) * scale,
    operatorsAvailable: now + randBetween(rng, 4800, 9000) * scale,
    liveEvent: now + randBetween(rng, 2400, 4200) * scale,
  };
}

function nextDue(now, speed, rng, min, max) {
  return now + randBetween(rng, min, max) * (1 / speed);
}

function tickSimulation() {
  const runtime = store.getState();
  if (runtime.frozen || !simulator.state || !simulator.rng || !simulator.due) return;

  const theme = themePacks[runtime.currentThemeId];
  const scenario = scenarios[runtime.currentScenarioId];
  const speed = runtime.speedMultiplier;
  const now = performance.now();
  const rng = simulator.rng;
  const s = simulator.state;

  if (now >= simulator.due.activeCases) {
    const delta = scenario.mode === "flagged" ? (rng() > 0.65 ? 1 : 0) : rng() > 0.35 ? 2 : 1;
    s.activeCases = clamp(s.activeCases + delta, 1, 999);
    setText(el.metricFetching, String(s.activeCases));
    pulseValue(el.metricFetching);
    simulator.due.activeCases = nextDue(now, speed, rng, 1300, 3000);
  }

  if (now >= simulator.due.completedToday) {
    const delta = scenario.mode === "flagged" ? (rng() > 0.75 ? 1 : 0) : rng() > 0.25 ? 1 : 2;
    s.completedToday = clamp(s.completedToday + delta, 1, 9999);
    setText(el.metricCompleted, String(s.completedToday));
    pulseValue(el.metricCompleted);
    simulator.due.completedToday = nextDue(now, speed, rng, 1800, 3600);
  }

  if (now >= simulator.due.avgCycleSeconds) {
    const cycleDelta =
      scenario.mode === "auto"
        ? rng() > 0.65
          ? 1
          : -2
        : scenario.mode === "flagged"
          ? rng() > 0.5
            ? 3
            : -1
          : rng() > 0.6
            ? 2
            : -1;
    s.avgCycleSeconds = clamp(s.avgCycleSeconds + cycleDelta, 45, 600);
    setText(el.metricCycleTime, formatCycleTime(s.avgCycleSeconds));
    pulseValue(el.metricCycleTime);
    simulator.due.avgCycleSeconds = nextDue(now, speed, rng, 2200, 4200);
  }

  if (now >= simulator.due.nextReviewEtaSeconds) {
    const subtract = scenario.mode === "flagged" ? 4 : 6;
    s.nextReviewEtaSeconds -= subtract;
    if (s.nextReviewEtaSeconds <= 10) {
      s.nextReviewEtaSeconds = scenario.mode === "flagged" ? 120 : scenario.mode === "mixed" ? 90 : 60;
    }
    setText(el.metricEta, formatEta(s.nextReviewEtaSeconds));
    pulseValue(el.metricEta);
    simulator.due.nextReviewEtaSeconds = nextDue(now, speed, rng, 1400, 2600);
  }

  if (now >= simulator.due.operatorsAvailable) {
    const changeRand = rng();
    if (scenario.mode === "flagged") {
      s.operatorsAvailable = clamp(
        changeRand > 0.55 ? s.operatorsAvailable - 1 : s.operatorsAvailable + 1,
        PRIMARY_CARD_MIN_OPERATORS,
        PRIMARY_CARD_MAX_OPERATORS,
      );
    } else {
      s.operatorsAvailable = clamp(
        changeRand > 0.7 ? s.operatorsAvailable - 1 : s.operatorsAvailable + 1,
        PRIMARY_CARD_MIN_OPERATORS,
        PRIMARY_CARD_MAX_OPERATORS,
      );
    }
    setText(el.metricOperators, String(s.operatorsAvailable));
    renderOperatorAvatars(s.operatorsAvailable);
    pulseValue(el.metricOperators);
    simulator.due.operatorsAvailable = nextDue(now, speed, rng, 4800, 9000);
  }

  if (now >= simulator.due.liveEvent) {
    setText(el.liveEventValue, buildLiveEvent(theme, scenario, rng));
    simulator.due.liveEvent = nextDue(now, speed, rng, 2400, 4200);
  }

  if (simulator.secondaryDue && simulator.secondaryState) {
    const ss = simulator.secondaryState;
    if (now >= simulator.secondaryDue.activeCases) {
      ss.activeCases = clamp(ss.activeCases + (rng() > 0.5 ? 1 : 0), 1, 999);
      setText(el.secondaryMetricFetching, String(ss.activeCases));
      pulseValue(el.secondaryMetricFetching);
      simulator.secondaryDue.activeCases = nextDue(now, speed, rng, 2000, 3600);
    }
    if (now >= simulator.secondaryDue.completedToday) {
      ss.completedToday = clamp(ss.completedToday + 1, 1, 9999);
      setText(el.secondaryMetricCompleted, String(ss.completedToday));
      pulseValue(el.secondaryMetricCompleted);
      simulator.secondaryDue.completedToday = nextDue(now, speed, rng, 2200, 4200);
    }
    if (now >= simulator.secondaryDue.avgCycleSeconds) {
      ss.avgCycleSeconds = clamp(ss.avgCycleSeconds + (rng() > 0.6 ? 2 : -1), 60, 600);
      setText(el.secondaryMetricCycleTime, formatCycleTime(ss.avgCycleSeconds));
      pulseValue(el.secondaryMetricCycleTime);
      simulator.secondaryDue.avgCycleSeconds = nextDue(now, speed, rng, 2600, 4400);
    }
    if (now >= simulator.secondaryDue.nextReviewEtaSeconds) {
      ss.nextReviewEtaSeconds -= 5;
      if (ss.nextReviewEtaSeconds <= 20) ss.nextReviewEtaSeconds = 120;
      setText(el.secondaryMetricEta, formatEta(ss.nextReviewEtaSeconds));
      pulseValue(el.secondaryMetricEta);
      simulator.secondaryDue.nextReviewEtaSeconds = nextDue(now, speed, rng, 1800, 3200);
    }
    if (now >= simulator.secondaryDue.liveEvent) {
      setText(el.secondaryLiveEventValue, buildLiveEvent(theme, scenario, rng));
      simulator.secondaryDue.liveEvent = nextDue(now, speed, rng, 2600, 4600);
    }
  }

  if (simulator.tertiaryDue && simulator.tertiaryState) {
    const ts = simulator.tertiaryState;
    if (now >= simulator.tertiaryDue.activeCases) {
      ts.activeCases = clamp(ts.activeCases + (rng() > 0.55 ? 1 : 0), 1, 999);
      setText(el.tertiaryMetricFetching, String(ts.activeCases));
      pulseValue(el.tertiaryMetricFetching);
      simulator.tertiaryDue.activeCases = nextDue(now, speed, rng, 2200, 3800);
    }
    if (now >= simulator.tertiaryDue.completedToday) {
      ts.completedToday = clamp(ts.completedToday + 1, 1, 9999);
      setText(el.tertiaryMetricCompleted, String(ts.completedToday));
      pulseValue(el.tertiaryMetricCompleted);
      simulator.tertiaryDue.completedToday = nextDue(now, speed, rng, 2400, 4400);
    }
    if (now >= simulator.tertiaryDue.avgCycleSeconds) {
      ts.avgCycleSeconds = clamp(ts.avgCycleSeconds + (rng() > 0.65 ? 2 : -1), 60, 600);
      setText(el.tertiaryMetricCycleTime, formatCycleTime(ts.avgCycleSeconds));
      pulseValue(el.tertiaryMetricCycleTime);
      simulator.tertiaryDue.avgCycleSeconds = nextDue(now, speed, rng, 2800, 4600);
    }
    if (now >= simulator.tertiaryDue.nextReviewEtaSeconds) {
      ts.nextReviewEtaSeconds -= 6;
      if (ts.nextReviewEtaSeconds <= 20) ts.nextReviewEtaSeconds = 180;
      setText(el.tertiaryMetricEta, formatEta(ts.nextReviewEtaSeconds));
      pulseValue(el.tertiaryMetricEta);
      simulator.tertiaryDue.nextReviewEtaSeconds = nextDue(now, speed, rng, 2000, 3400);
    }
    if (now >= simulator.tertiaryDue.liveEvent) {
      setText(el.tertiaryLiveEventValue, buildLiveEvent(theme, scenario, rng));
      simulator.tertiaryDue.liveEvent = nextDue(now, speed, rng, 3000, 5000);
    }
  }
}

function restartSimulation() {
  const runtime = store.getState();
  setupRunState(runtime);
  simulator.due = computeDue(performance.now(), runtime.speedMultiplier, simulator.rng);
  simulator.secondaryDue = computeDue(performance.now(), runtime.speedMultiplier, simulator.rng);
  simulator.tertiaryDue = computeDue(performance.now(), runtime.speedMultiplier, simulator.rng);

  if (simulator.intervalId !== null) {
    window.clearInterval(simulator.intervalId);
  }
  simulator.intervalId = window.setInterval(tickSimulation, 200);
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

let previousState = null;

applyAvatarPhotos();
resetChatFlow();

document.querySelectorAll(".workflow-cta").forEach((button) => {
  button.addEventListener("click", goToFeeds);
});

el.navFeeds?.addEventListener("click", goToFeeds);
el.navInsight?.addEventListener("click", goToInsight);

el.floatingChatSend?.addEventListener("click", () => {
  advanceChatFlow();
});

el.floatingChatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    advanceChatFlow();
  } else {
    event.preventDefault();
  }
});

store.subscribe((state) => {
  presenterPanel.sync(state);

  const hasThemeChanged = !previousState || previousState.currentThemeId !== state.currentThemeId;
  const hasScenarioChanged = !previousState || previousState.currentScenarioId !== state.currentScenarioId;
  const hasRunReset = !previousState || previousState.runNonce !== state.runNonce;

  if (hasThemeChanged || hasScenarioChanged) {
    applyThemeAndScenarioText(state);
  }

  if (hasThemeChanged || hasScenarioChanged || hasRunReset) {
    restartSimulation();
    resetChatFlow();
  }

  previousState = { ...state };
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (simulator.intervalId !== null) {
      window.clearInterval(simulator.intervalId);
      simulator.intervalId = null;
    }
    return;
  }
  restartSimulation();
});
