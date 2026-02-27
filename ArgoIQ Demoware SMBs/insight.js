import { renderSharedNavbar } from "./shared-navbar.js";
import { themePacks, scenarios } from "./dashboard-config.js";
import { createRuntimeStore } from "./dashboard-store.js";
import { buildRouteWithProfile, initPresenterPanel } from "./presenter-controls.js";

renderSharedNavbar({ active: "insight", logoTriggerId: "presenterLogoTrigger", tone: "ink" });
const store = createRuntimeStore();

const el = {
  screen: document.querySelector(".insight-screen"),
  navDashboard: document.getElementById("navDashboard"),
  navFeeds: document.getElementById("navFeeds"),
  navInsight: document.getElementById("navInsight"),
  chatInput: document.getElementById("insightChatInput"),
  chatSend: document.querySelector(".floating-chat-send"),
  chatFocusOverlay: document.getElementById("insightChatFocusOverlay"),
  chatRow: document.getElementById("insightChatRow"),
  chatFlow: document.getElementById("insightChatFlow"),
  chatTranscript: document.getElementById("insightChatTranscript"),
  generatedComparison: document.getElementById("insightGeneratedComparison"),
  workflowTabs: document.getElementById("insightWorkflowTabs"),
  timeTabs: document.getElementById("insightTimeTabs"),
  metricAccuracy: document.getElementById("insightMetricAccuracy"),
  metricAccuracyDelta: document.getElementById("insightMetricAccuracyDelta"),
  metricAccuracyNote: document.getElementById("insightMetricAccuracyNote"),
  metricCycle: document.getElementById("insightMetricCycle"),
  metricCycleDelta: document.getElementById("insightMetricCycleDelta"),
  metricCycleNote: document.getElementById("insightMetricCycleNote"),
  metricCompleted: document.getElementById("insightMetricCompleted"),
  metricCompletedDelta: document.getElementById("insightMetricCompletedDelta"),
  metricCompletedNote: document.getElementById("insightMetricCompletedNote"),
  metricOperators: document.getElementById("insightMetricOperators"),
  metricOperatorsDelta: document.getElementById("insightMetricOperatorsDelta"),
  metricOperatorsNote: document.getElementById("insightMetricOperatorsNote"),
  metricCost: document.getElementById("insightMetricCost"),
  metricCostDelta: document.getElementById("insightMetricCostDelta"),
  metricCostNote: document.getElementById("insightMetricCostNote"),
  financeSummary: document.getElementById("insightFinanceSummary"),
  workflowBreakdown: document.getElementById("insightWorkflowBreakdown"),
  sourceBreakdown: document.getElementById("insightSourceBreakdown"),
  costChart: document.getElementById("insightCostChart"),
  executionChart: document.getElementById("insightExecutionChart"),
  trendSelectTrigger: document.getElementById("insightTrendSelectTrigger"),
  trendSelectMenu: document.getElementById("insightTrendSelectMenu"),
  trendSelectLabel: document.getElementById("insightTrendSelectLabel"),
  trendLegend: document.getElementById("insightTrendLegend"),
  primaryMetricLabel: document.getElementById("insightPrimaryMetricLabel"),
  secondaryMetricLabel: document.getElementById("insightSecondaryMetricLabel"),
  donutChart: document.getElementById("insightDonutChart"),
  resolutionList: document.getElementById("insightResolutionList"),
  resolutionLegend: document.getElementById("insightResolutionLegend"),
  casesPerHour: document.getElementById("insightCasesPerHour"),
  cycleCount: document.getElementById("insightCycleCount"),
  presenterPanel: document.getElementById("presenterPanel"),
  presenterClose: document.getElementById("presenterClose"),
  presenterTheme: document.getElementById("presenterTheme"),
  presenterScenario: document.getElementById("presenterScenario"),
  presenterSpeed: document.getElementById("presenterSpeed"),
  presenterReset: document.getElementById("presenterReset"),
  presenterFreeze: document.getElementById("presenterFreeze"),
  presenterShare: document.getElementById("presenterShare"),
  presenterLogoTrigger: document.getElementById("presenterLogoTrigger"),
};

const WORKFLOW_TAB_LABELS = {
  healthcare: ["All Workflows", "Claims Processing", "Provider Onboarding", "Payment Integrity"],
  smb: ["All Workflows", "Scheduling", "Onboarding", "Billing Ops"],
  future: ["All Workflows", "Autonomous Runs", "Policy Oversight", "Exception Handling"],
};

const TIME_TABS = [
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "custom", label: "Custom range" },
];

const state = {
  selectedWorkflowTab: 0,
  selectedTimeTab: "today",
  selectedTrendView: "execution",
  trendMenuOpen: false,
  resolutionHoverKey: null,
  generatedComparisonVisible: false,
  generatedComparisonLoading: false,
};

let resolutionModel = null;
const insightChat = {
  busy: false,
  runToken: 0,
};
const generatedComparisonFlow = {
  token: 0,
};
let chatVisibilityBound = false;
const INSIGHT_CHAT_CLEARANCE_PX = 170;

function setText(node, value) {
  if (!node) return;
  node.textContent = value;
}

function setStatusBadge(node, label, tone = "is-good") {
  if (!node) return;
  node.textContent = label;
  node.classList.remove("is-good", "is-watch", "is-risk");
  node.classList.add(tone);
}

function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatCompactMoney(value) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return formatMoney(value);
}

function formatCycle(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function rerender(runtime = store.getState()) {
  renderModel(buildInsightModel(runtime));
}

function trimInsightChat(maxNodes = 10) {
  if (!el.chatTranscript) return;
  while (el.chatTranscript.children.length > maxNodes) {
    el.chatTranscript.removeChild(el.chatTranscript.firstElementChild);
  }
}

function scrollInsightTranscriptToBottom() {
  if (!el.chatTranscript) return;
  el.chatTranscript.scrollTop = el.chatTranscript.scrollHeight;
}

function syncInsightChatFocusOverlay() {
  if (!el.chatFocusOverlay || !el.chatTranscript) return;
  const hasTranscript = el.chatTranscript.children.length > 0;
  const isActive = insightChat.busy || hasTranscript;
  el.chatFocusOverlay.classList.toggle("is-active", isActive);
  updateInsightChatVisibility();
}

function setInsightChatVisible(visible) {
  if (!el.screen) return;
  el.screen.classList.toggle("insight-chat-ready", visible);
}

function bindInsightChatVisibilityGate() {
  if (chatVisibilityBound) return;
  chatVisibilityBound = true;
  window.addEventListener("scroll", updateInsightChatVisibility, { passive: true });
  window.addEventListener("resize", updateInsightChatVisibility);
  updateInsightChatVisibility();
}

function hasRoomForInsightChat() {
  if (!el.chatRow) return true;
  const markerTop = el.chatRow.getBoundingClientRect().top;
  return markerTop <= window.innerHeight - INSIGHT_CHAT_CLEARANCE_PX;
}

function updateInsightChatVisibility() {
  const hasTranscript = Boolean(el.chatTranscript && el.chatTranscript.children.length > 0);
  const forceVisible = insightChat.busy || hasTranscript;
  const enoughRoom = hasRoomForInsightChat();
  const scrollTop = window.scrollY || window.pageYOffset || 0;
  const viewportBottom = scrollTop + window.innerHeight;
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );
  const atBottom = viewportBottom >= docHeight - 2;
  setInsightChatVisible(forceVisible || enoughRoom || atBottom);
}

function appendInsightUserBubble(text) {
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
  trimInsightChat();
  syncInsightChatFocusOverlay();
  scrollInsightTranscriptToBottom();
  return bubble;
}

function appendInsightTypingBubble() {
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
  trimInsightChat();
  syncInsightChatFocusOverlay();
  scrollInsightTranscriptToBottom();
  return row;
}

function createInsightAssistantMessageRow() {
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
  trimInsightChat();
  syncInsightChatFocusOverlay();
  scrollInsightTranscriptToBottom();
  return { row, content, cursor };
}

function appendInsightCtaButton(label) {
  if (!el.chatTranscript) return null;

  const row = document.createElement("div");
  row.className = "chat-transcript-cta-row";

  const button = document.createElement("button");
  button.className = "chat-transcript-cta";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => {
    handleInsightComparisonGenerate();
  });

  row.appendChild(button);
  el.chatTranscript.appendChild(row);
  trimInsightChat();
  syncInsightChatFocusOverlay();
  scrollInsightTranscriptToBottom();
  return row;
}

function shiftDateByMonths(date, monthDelta) {
  const next = new Date(date);
  const originalDate = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + monthDelta);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDate, lastDay));
  return next;
}

function formatRangeDate(start, end) {
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return startLabel === endLabel ? startLabel : `${startLabel}; ${endLabel}`;
}

function buildCumulativeSeries(points, total, weightBoost = 0.06) {
  const safePoints = Math.max(2, points);
  const weights = Array.from({ length: safePoints }, (_, index) => {
    const ramp = 1 + index * weightBoost;
    const wave = 1 + Math.sin((index / Math.max(1, safePoints - 1)) * Math.PI) * 0.1;
    return ramp * wave;
  });
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let running = 0;
  const values = weights.map((weight, index) => {
    running += (total * weight) / weightTotal;
    if (index === safePoints - 1) return total;
    return Math.round(running);
  });
  values[values.length - 1] = Math.round(total);
  return values;
}

function getInsightComparisonWindow(model) {
  const now = new Date();
  const points = model.labels.length;
  const baseEnd = new Date(now);
  const baseStart = new Date(now);
  const previousEnd = shiftDateByMonths(baseEnd, -3);
  const previousStart = shiftDateByMonths(baseStart, -3);

  if (model.time.id === "last30") {
    baseStart.setDate(baseEnd.getDate() - 29);
    previousStart.setDate(previousEnd.getDate() - 29);
    return {
      labels: model.labels,
      unit: "day",
      currentLabel: "Last 30 days",
      priorLabel: "Same period, 3 mo ago",
      rangeLabel: `${formatRangeDate(previousStart, previousEnd)}; ${formatRangeDate(baseStart, baseEnd)}`,
      points,
    };
  }

  if (model.time.id === "last7") {
    baseStart.setDate(baseEnd.getDate() - 6);
    previousStart.setDate(previousEnd.getDate() - 6);
    return {
      labels: model.labels,
      unit: "day",
      currentLabel: "Last 7 days",
      priorLabel: "Same period, 3 mo ago",
      rangeLabel: `${formatRangeDate(previousStart, previousEnd)}; ${formatRangeDate(baseStart, baseEnd)}`,
      points,
    };
  }

  const hourLabels = model.labels.map((label) => label.replace(":00", ""));
  return {
    labels: hourLabels,
    unit: "hour",
    currentLabel: "Today",
    priorLabel: "Same day, 3 mo ago",
    rangeLabel: `${formatRangeDate(previousStart, previousEnd)}; ${formatRangeDate(baseStart, baseEnd)}`,
    points,
  };
}

function buildInsightComparisonCardModel(model) {
  const windowConfig = getInsightComparisonWindow(model);
  const scenarioMultiplier = model.scenario.mode === "auto" ? 1.24 : model.scenario.mode === "flagged" ? 1.12 : 1.18;
  const timeMultiplier = model.time.id === "today" ? 0.42 : model.time.id === "last7" ? 0.75 : 1.08;
  const currentTotal = Math.max(1000, Math.round(model.cumulativeCostSaved * timeMultiplier));

  const baselineFactor = model.time.id === "today"
    ? (model.scenario.mode === "auto" ? 0.79 : model.scenario.mode === "flagged" ? 0.86 : 0.83)
    : model.time.id === "last7"
      ? (model.scenario.mode === "auto" ? 0.81 : model.scenario.mode === "flagged" ? 0.88 : 0.85)
      : (model.scenario.mode === "auto" ? 0.77 : model.scenario.mode === "flagged" ? 0.84 : 0.8);
  const previousTotal = Math.max(800, Math.round(currentTotal * baselineFactor));
  const totalCombined = currentTotal + previousTotal;
  const diff = currentTotal - previousTotal;
  const gapPerUnit = Math.round(Math.abs(diff) / Math.max(1, windowConfig.points));
  const deltaPct = previousTotal > 0 ? ((diff / previousTotal) * 100).toFixed(1) : "0.0";

  const currentSeries = buildCumulativeSeries(windowConfig.points, currentTotal, 0.08 * scenarioMultiplier);
  const priorSeries = buildCumulativeSeries(windowConfig.points, previousTotal, 0.055);

  return {
    ...windowConfig,
    currentTotal,
    previousTotal,
    totalCombined,
    gapPerUnit,
    deltaPct,
    currentSeries,
    priorSeries,
  };
}

function drawInsightComparisonChart(svg, model) {
  if (!svg) return;
  const measuredWidth = Math.round(svg.getBoundingClientRect().width || svg.clientWidth || 508);
  const width = Math.max(420, measuredWidth);
  const height = 260;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const left = 86;
  const right = 24;
  const top = 20;
  const bottom = 44;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const merged = [...model.currentSeries, ...model.priorSeries];
  const maxValue = Math.max(...merged);
  const minValue = Math.min(...merged);
  const yPad = Math.max(70, Math.round((maxValue - minValue) * 0.22));
  const yMin = Math.max(0, minValue - yPad);
  const yMax = maxValue + yPad;
  const span = Math.max(1, yMax - yMin);

  const toX = (index, count) => left + (innerW * index) / Math.max(1, count - 1);
  const toY = (value) => top + innerH - ((value - yMin) / span) * innerH;

  const currentPoints = model.currentSeries.map((value, index) => ({ x: toX(index, model.currentSeries.length), y: toY(value) }));
  const priorPoints = model.priorSeries.map((value, index) => ({ x: toX(index, model.priorSeries.length), y: toY(value) }));

  const currentPath = currentPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const priorPath = priorPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = `${currentPath} ${priorPoints.slice().reverse().map((point) => `L${point.x},${point.y}`).join(" ")} Z`;

  const gridLinesCount = 6;
  const gridLines = Array.from({ length: gridLinesCount + 1 }, (_, index) => {
    const ratio = index / gridLinesCount;
    const y = top + innerH * ratio;
    const tickValue = Math.round(yMax - span * ratio);
    return `
      <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="rgba(229,229,229,0.92)" />
      <text x="0" y="${y + 4}" text-anchor="start" class="insight-axis-label">${tickValue.toLocaleString("en-US")}</text>
    `;
  }).join("");

  const xTicks = model.labels.map((label, index) => {
    const x = toX(index, model.labels.length);
    return `<text x="${x}" y="${height - 8}" text-anchor="middle" class="insight-axis-label">${label}</text>`;
  }).join("");

  const gapPrefix = model.currentTotal >= model.previousTotal ? "+" : "-";

  svg.innerHTML = `
    <defs>
      <linearGradient id="insightComparisonArea" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(59,130,246,0.24)" />
        <stop offset="100%" stop-color="rgba(192,38,211,0.24)" />
      </linearGradient>
    </defs>
    ${gridLines}
    <path d="${areaPath}" fill="url(#insightComparisonArea)" />
    <path d="${priorPath}" fill="none" stroke="#3b82f6" stroke-width="2" />
    <path d="${currentPath}" fill="none" stroke="#c026d3" stroke-width="2" />
    <text x="${width - right - 16}" y="${top + innerH * 0.43}" text-anchor="end" class="insight-comparison-gap">Gap: ${gapPrefix}${formatMoney(model.gapPerUnit)}/${model.unit}</text>
    ${xTicks}
  `;
}

function renderGeneratedComparisonCard(model) {
  if (!el.generatedComparison) return;
  const comparison = buildInsightComparisonCardModel(model);

  el.generatedComparison.hidden = false;
  el.generatedComparison.innerHTML = `
    <div class="insight-comparison-head">
      <h3 class="insight-comparison-title">Saving comparison</h3>
      <div class="insight-date-picker">
        <div class="insight-date-picker-trigger">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2.333" y="2.333" width="11.334" height="11.334" rx="1.667" stroke="#0A0A0A" stroke-width="1.33"/>
            <path d="M5 1.667V4.333" stroke="#0A0A0A" stroke-width="1.33" stroke-linecap="round"/>
            <path d="M11 1.667V4.333" stroke="#0A0A0A" stroke-width="1.33" stroke-linecap="round"/>
            <path d="M2.333 6H13.667" stroke="#0A0A0A" stroke-width="1.33" stroke-linecap="round"/>
          </svg>
          <span>${comparison.rangeLabel}</span>
        </div>
      </div>
    </div>
    <div class="insight-comparison-summary">
      <div>
        <p>Total savings combined</p>
        <h4>${formatMoney(comparison.totalCombined)}</h4>
      </div>
      <div>
        <p>${comparison.currentLabel}</p>
        <h4>${formatMoney(comparison.currentTotal)}</h4>
      </div>
      <div>
        <p>${comparison.priorLabel}</p>
        <h4>${formatMoney(comparison.previousTotal)}</h4>
      </div>
    </div>
    <div class="insight-comparison-chart-wrap">
      <svg id="insightGeneratedComparisonChart" aria-label="Generated savings comparison chart"></svg>
    </div>
    <div class="insight-chart-legend insight-chart-legend--dual">
      <span><i class="legend-dot is-magenta"></i>${comparison.currentLabel}</span>
      <span><i class="legend-dot is-blue"></i>${comparison.priorLabel}</span>
    </div>
  `;

  const chart = document.getElementById("insightGeneratedComparisonChart");
  if (chart) {
    window.requestAnimationFrame(() => {
      drawInsightComparisonChart(chart, comparison);
    });
  }
}

function renderGeneratedComparisonSkeleton() {
  if (!el.generatedComparison) return;
  el.generatedComparison.hidden = false;
  el.generatedComparison.innerHTML = `
    <div class="insight-comparison-head">
      <div class="insight-skeleton insight-skeleton-title"></div>
      <div class="insight-skeleton insight-skeleton-date-chip"></div>
    </div>
    <div class="insight-comparison-summary">
      <div>
        <div class="insight-skeleton insight-skeleton-label"></div>
        <div class="insight-skeleton insight-skeleton-value"></div>
      </div>
      <div>
        <div class="insight-skeleton insight-skeleton-label"></div>
        <div class="insight-skeleton insight-skeleton-value"></div>
      </div>
      <div>
        <div class="insight-skeleton insight-skeleton-label"></div>
        <div class="insight-skeleton insight-skeleton-value"></div>
      </div>
    </div>
    <div class="insight-comparison-chart-wrap">
      <div class="insight-skeleton insight-skeleton-chart"></div>
    </div>
    <div class="insight-chart-legend insight-chart-legend--dual">
      <div class="insight-skeleton insight-skeleton-legend"></div>
      <div class="insight-skeleton insight-skeleton-legend"></div>
    </div>
  `;
}

async function handleInsightComparisonGenerate() {
  if (state.generatedComparisonLoading) return;
  const model = buildInsightModel(store.getState());
  const token = ++generatedComparisonFlow.token;
  state.generatedComparisonVisible = true;
  state.generatedComparisonLoading = true;
  renderGeneratedComparisonSkeleton();

  if (el.chatTranscript) el.chatTranscript.innerHTML = "";
  insightChat.busy = false;
  if (el.chatSend) el.chatSend.disabled = false;
  syncInsightChatFocusOverlay();

  if (el.generatedComparison) {
    window.requestAnimationFrame(() => {
      el.generatedComparison.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  await wait(3000);
  if (token !== generatedComparisonFlow.token) return;

  state.generatedComparisonLoading = false;
  renderGeneratedComparisonCard(model);
}

async function typeInsightAssistantText(target, text, runToken) {
  if (!target?.content) return false;
  const baseDelay = 18;
  let output = "";
  for (let i = 0; i < text.length; i += 1) {
    if (runToken !== insightChat.runToken || !target.content) return false;
    const char = text[i];
    output += char;
    target.content.textContent = output;
    let delay = baseDelay;
    if (char === "." || char === "," || char === ":") delay += 32;
    if (char === " ") delay = Math.max(8, Math.round(delay * 0.7));
    await wait(delay);
  }
  target.cursor?.remove();
  return true;
}

function buildInsightComparisonPayload() {
  const model = buildInsightModel(store.getState());
  const audienceCopy = {
    healthcare: {
      audienceLabel: "payer operations",
      metricLabel: "claim-handling savings",
      coverageLabel: "auto-adjudication coverage",
    },
    smb: {
      audienceLabel: "SMB operations",
      metricLabel: "workflow savings",
      coverageLabel: "automation coverage",
    },
    future: {
      audienceLabel: "autonomous ops",
      metricLabel: "agent-execution savings",
      coverageLabel: "policy-safe autonomy coverage",
    },
  };
  const audience = audienceCopy[model.theme.id] || audienceCopy.smb;
  const modeSummary = model.scenario.mode === "auto"
    ? "mostly autonomous"
    : model.scenario.mode === "flagged"
      ? "risk-screened with heavier human checks"
      : "hybrid human + AI";
  const workflowName = model.activeWorkflow === "All Workflows" ? model.workflowBreakdown[0]?.name || "primary workflow" : model.activeWorkflow;
  const horizonLabel = model.time.id === "last30" ? "last 30 days" : model.time.id === "last7" ? "last 7 days" : "today";
  const currentWindowSavings = Math.round(model.cumulativeCostSaved * (model.time.id === "today" ? 0.46 : model.time.id === "last7" ? 0.68 : 0.44));
  const baselineWindowSavings = Math.round(currentWindowSavings * (model.time.id === "today" ? 0.81 : model.time.id === "last7" ? 0.86 : 0.84));
  const lift = currentWindowSavings - baselineWindowSavings;
  const trendDirection = lift >= 0 ? "increased" : "decreased";
  const trendWord = lift >= 0 ? "additional" : "lower";
  const pctLift = baselineWindowSavings > 0 ? ((lift / baselineWindowSavings) * 100).toFixed(1) : "0.0";

  const summary =
    `Key result for ${audience.audienceLabel}:\n` +
    `${workflowName} produced ${formatMoney(currentWindowSavings + baselineWindowSavings)} in ${audience.metricLabel} across both windows, with ${formatMoney(Math.abs(lift))} ${trendWord} savings in ${horizonLabel}.\n\n` +
    `Daily savings ${trendDirection} by ${pctLift}% while running in ${modeSummary} mode as ${audience.coverageLabel} improved.`;
  return {
    query: "Compare last 14-days saving against same period but 3 months ago",
    summary,
    cta: "Generate comparison chart",
  };
}

async function runInsightChatFlow() {
  if (insightChat.busy || !el.chatTranscript || !el.chatInput || !el.chatSend) return;
  const payload = buildInsightComparisonPayload();
  const userText = payload.query.trim();
  if (!userText) return;

  const token = ++insightChat.runToken;
  insightChat.busy = true;
  el.chatSend.disabled = true;
  syncInsightChatFocusOverlay();

  appendInsightUserBubble(userText);
  el.chatInput.value = "";

  await wait(260);
  if (token !== insightChat.runToken) return;

  const typingRow = appendInsightTypingBubble();
  await wait(680);
  if (token !== insightChat.runToken) return;

  if (typingRow?.parentNode) {
    typingRow.parentNode.removeChild(typingRow);
    syncInsightChatFocusOverlay();
  }

  const assistantRow = createInsightAssistantMessageRow();
  if (!assistantRow) return;

  const typed = await typeInsightAssistantText(assistantRow, payload.summary, token);
  if (!typed || token !== insightChat.runToken) return;

  appendInsightCtaButton(payload.cta);

  insightChat.busy = false;
  el.chatSend.disabled = false;
  syncInsightChatFocusOverlay();
}

function renderTabs(themeId) {
  const labels = WORKFLOW_TAB_LABELS[themeId] || WORKFLOW_TAB_LABELS.smb;
  el.workflowTabs.innerHTML = labels
    .map((label, index) => `<button class="insight-tab ${index === state.selectedWorkflowTab ? "is-active" : ""}" data-workflow-tab="${index}" type="button">${label}</button>`)
    .join("");

  el.timeTabs.innerHTML = TIME_TABS.map((tab) => `<button class="insight-tab ${tab.id === state.selectedTimeTab ? "is-active" : ""}" data-time-tab="${tab.id}" type="button">${tab.label}</button>`).join("");

  el.workflowTabs.querySelectorAll("[data-workflow-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedWorkflowTab = Number(btn.getAttribute("data-workflow-tab"));
      rerender();
    });
  });

  el.timeTabs.querySelectorAll("[data-time-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedTimeTab = String(btn.getAttribute("data-time-tab"));
      rerender();
    });
  });
}

function drawLineChart(svg, config) {
  if (!svg) return;
  const viewBox = svg.viewBox?.baseVal;
  const w = viewBox?.width || 520;
  const h = viewBox?.height || 220;
  const left = Number.isFinite(config.leftPadding) ? config.leftPadding : 52;
  const right = 20;
  const top = 14;
  const bottom = 34;
  const innerW = w - left - right;
  const innerH = h - top - bottom;
  const maxY = Math.max(...config.series.flatMap((s) => s.values), 1);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((n) => {
    const y = top + innerH * n;
    return `<line x1="${left}" y1="${y}" x2="${w - right}" y2="${y}" stroke="rgba(229,229,229,0.9)" />`;
  }).join("");

  const yLabels = [1, 0.75, 0.5, 0.25, 0].map((n) => {
    const y = top + innerH * (1 - n);
    const raw = maxY * n;
    const text = config.yFormatter ? config.yFormatter(raw) : `${Math.round(raw)}`;
    const yLabelOffset = Number.isFinite(config.yLabelOffset) ? config.yLabelOffset : 10;
    return `<text x="${left - yLabelOffset}" y="${y + 4}" text-anchor="end" class="insight-axis-label">${text}</text>`;
  }).join("");

  const xLabels = config.labels.map((label, i) => {
    const x = left + (innerW * i) / (config.labels.length - 1 || 1);
    return `<text x="${x}" y="${h - 10}" text-anchor="middle" class="insight-axis-label">${label}</text>`;
  }).join("");

  const mode = config.mode === "step" ? "step" : "line";

  const paths = config.series.map((series) => {
    const points = series.values.map((value, i) => {
      const x = left + (innerW * i) / (series.values.length - 1 || 1);
      const y = top + innerH - (value / maxY) * innerH;
      return { x, y };
    });

    const d = points.map((point, i) => {
      if (i === 0) return `M${point.x},${point.y}`;
      if (mode === "step") {
        const prev = points[i - 1];
        return `L${point.x},${prev.y} L${point.x},${point.y}`;
      }
      return `L${point.x},${point.y}`;
    }).join(" ");

    return `<path d="${d}" fill="none" stroke="${series.color}" stroke-width="2" />`;
  }).join("");

  svg.innerHTML = `${gridLines}${yLabels}${paths}${xLabels}`;
}

function drawDonut(svg, series, activeKey = null) {
  if (!svg) return;
  const total = series.reduce((sum, item) => sum + item.value, 0) || 1;
  const cx = 110;
  const cy = 110;
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const activeItem = activeKey ? series.find((item) => item.key === activeKey) : null;

  const rings = series.map((item) => {
    const ratio = item.value / total;
    const len = c * ratio;
    const muted = Boolean(activeKey) && item.key !== activeKey;
    const seg = `<circle class="insight-donut-segment${muted ? " is-muted" : " is-active"}" data-resolution-key="${item.key}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#insightDonutGlass-${item.key})" stroke-width="22" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" filter="url(#insightDonutGlassFilter)" />`;
    offset += len;
    return seg;
  }).join("");

  const centerValue = activeItem ? `${Math.round(activeItem.pct)}%` : String(Math.max(1, Math.round(series.reduce((sum, item) => sum + item.cases, 0))));

  const defs = `
    <defs>
      ${series
        .map(
          (item) => `
        <linearGradient id="insightDonutGlass-${item.key}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.66)" />
          <stop offset="35%" stop-color="${item.color}" stop-opacity="0.82" />
          <stop offset="100%" stop-color="${item.color}" stop-opacity="0.54" />
        </linearGradient>`,
        )
        .join("")}
      <filter id="insightDonutGlassFilter" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="soft" />
        <feBlend in="SourceGraphic" in2="soft" mode="normal" />
        <feDropShadow dx="0" dy="2" stdDeviation="3.2" flood-color="rgba(0,0,0,0.16)" />
      </filter>
    </defs>
  `;

  svg.innerHTML = `
    ${defs}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="22" />
    ${rings}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="insight-donut-total">${centerValue}</text>
    <text x="${cx}" y="${cy + 24}" text-anchor="middle" class="insight-donut-sub">cases</text>
  `;
}

function setResolutionHover(key = null) {
  state.resolutionHoverKey = key;
  if (!resolutionModel) return;

  const activeKey = state.resolutionHoverKey;
  drawDonut(el.donutChart, resolutionModel.resolutionSeries, activeKey);

  el.resolutionList?.querySelectorAll("[data-resolution-key]").forEach((node) => {
    const nodeKey = node.getAttribute("data-resolution-key");
    const muted = Boolean(activeKey) && nodeKey !== activeKey;
    node.classList.toggle("is-muted", muted);
    node.classList.toggle("is-active", Boolean(activeKey) && nodeKey === activeKey);
  });

  el.resolutionLegend?.querySelectorAll("[data-resolution-key]").forEach((node) => {
    const nodeKey = node.getAttribute("data-resolution-key");
    const muted = Boolean(activeKey) && nodeKey !== activeKey;
    node.classList.toggle("is-muted", muted);
    node.classList.toggle("is-active", Boolean(activeKey) && nodeKey === activeKey);
  });
}

function bindResolutionHover() {
  if (!el.resolutionList || !el.resolutionLegend || !el.donutChart) return;

  el.resolutionList.addEventListener("mouseover", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest("[data-resolution-key]");
    if (!item) return;
    const key = item.getAttribute("data-resolution-key");
    if (key) setResolutionHover(key);
  });
  el.resolutionList.addEventListener("mouseleave", () => setResolutionHover(null));

  el.resolutionLegend.addEventListener("mouseover", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest("[data-resolution-key]");
    if (!item) return;
    const key = item.getAttribute("data-resolution-key");
    if (key) setResolutionHover(key);
  });
  el.resolutionLegend.addEventListener("mouseleave", () => setResolutionHover(null));

  el.donutChart.addEventListener("mouseover", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const segment = target.closest("[data-resolution-key]");
    if (!segment) return;
    const key = segment.getAttribute("data-resolution-key");
    if (key) setResolutionHover(key);
  });
  el.donutChart.addEventListener("mouseleave", () => setResolutionHover(null));
}

function drawBarChart(svg, config) {
  if (!svg) return;
  const viewBox = svg.viewBox?.baseVal;
  const w = viewBox?.width || 520;
  const h = viewBox?.height || 220;
  const left = Number.isFinite(config.leftPadding) ? config.leftPadding : 52;
  const right = 20;
  const top = 14;
  const bottom = 34;
  const innerW = w - left - right;
  const innerH = h - top - bottom;
  const maxY = Math.max(...config.values, 1);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((n) => {
    const y = top + innerH * n;
    return `<line x1="${left}" y1="${y}" x2="${w - right}" y2="${y}" stroke="rgba(229,229,229,0.9)" />`;
  }).join("");

  const yLabels = [1, 0.75, 0.5, 0.25, 0].map((n) => {
    const y = top + innerH * (1 - n);
    const raw = maxY * n;
    const text = config.yFormatter ? config.yFormatter(raw) : `${Math.round(raw)}`;
    return `<text x="${left - 10}" y="${y + 4}" text-anchor="end" class="insight-axis-label">${text}</text>`;
  }).join("");

  const slot = innerW / (config.values.length || 1);
  const barW = Math.max(12, slot * 0.58);
  const bars = config.values.map((value, i) => {
    const barH = Math.max(1, (value / maxY) * innerH);
    const x = left + i * slot + (slot - barW) / 2;
    const y = top + innerH - barH;
    if (config.argoGlassS) {
      const highlightH = Math.max(1, Math.round(barH * 0.48));
      return `
        <g class="insight-bar-glass">
          <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="6" fill="url(#insightBarGlassPurple)" stroke="rgba(255,255,255,0.20)" stroke-width="1" filter="url(#insightBarGlassFilter)" />
          <rect x="${x + 0.75}" y="${y + 0.75}" width="${Math.max(0, barW - 1.5)}" height="${Math.max(0, highlightH)}" rx="5" fill="url(#insightBarGlassHighlight)" />
        </g>
      `;
    }
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="6" fill="${config.color || "#c026d3"}" fill-opacity="0.9" />`;
  }).join("");

  const xLabels = config.labels.map((label, i) => {
    const x = left + i * slot + slot / 2;
    return `<text x="${x}" y="${h - 10}" text-anchor="middle" class="insight-axis-label">${label}</text>`;
  }).join("");

  const defs = config.argoGlassS
    ? `
      <defs>
        <linearGradient id="insightBarGlassPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(217,70,239,0.62)" />
          <stop offset="100%" stop-color="rgba(192,38,211,0.42)" />
        </linearGradient>
        <linearGradient id="insightBarGlassHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="insightBarGlassFilter" x="-25%" y="-25%" width="150%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.32" result="soft" />
          <feBlend in="SourceGraphic" in2="soft" mode="normal" />
          <feDropShadow dx="0" dy="2" stdDeviation="3.2" flood-color="rgba(0,0,0,0.16)" />
        </filter>
      </defs>
    `
    : "";

  svg.innerHTML = `${defs}${gridLines}${yLabels}${bars}${xLabels}`;
}

function getTimeProfile(tabId) {
  if (tabId === "last7") {
    return {
      id: "last7",
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      cumulativeMilestones: [0.08, 0.18, 0.31, 0.47, 0.63, 0.79, 1],
      windowScale: 6.6,
      savingsMultiplier: 20,
      avgCostAdjustment: -0.15,
      accuracyNote: "vs prev 7d",
      cycleNote: "vs baseline",
      completedNote: "vs prev 7d",
      operatorsNote: "vs 30d avg",
      costNote: "vs prev 7d",
      costSavedSuffix: "last 7d",
      deltaMultiplier: 1.8,
      operatorsDenominator: 34,
      trendPrimaryLabel: "Avg cases per day",
      trendSecondaryLabel: "Average cycle count",
    };
  }

  if (tabId === "last30") {
    return {
      id: "last30",
      labels: ["week 1", "week 2", "week 3", "week 4", "week 5"],
      cumulativeMilestones: [0.12, 0.26, 0.48, 0.73, 1],
      windowScale: 30,
      savingsMultiplier: 11,
      avgCostAdjustment: -0.35,
      accuracyNote: "vs previous 30d",
      cycleNote: "vs baseline",
      completedNote: "vs previous 30d",
      operatorsNote: "vs previous 30d",
      costNote: "vs previous 30d",
      costSavedSuffix: "MTD",
      deltaMultiplier: 2.7,
      operatorsDenominator: 40,
      trendPrimaryLabel: "Cases per week",
      trendSecondaryLabel: "Average cycle count",
    };
  }

  return {
    id: "today",
    labels: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"],
    cumulativeMilestones: [0.12, 0.2, 0.38, 0.56, 0.88, 1],
    windowScale: 1,
    savingsMultiplier: 52,
    avgCostAdjustment: 0,
    accuracyNote: "vs last hour",
    cycleNote: "vs baseline",
    completedNote: "vs same time ytd",
    operatorsNote: "vs ytd",
    costNote: "vs same time ytd",
    costSavedSuffix: "so far",
    deltaMultiplier: 1,
    operatorsDenominator: 28,
    trendPrimaryLabel: "Cases per hour",
    trendSecondaryLabel: "Average cycle count",
  };
}

function getResolutionMix(mode, timeId) {
  if (mode === "auto") return [72, 23, 5];
  if (mode === "flagged") {
    if (timeId === "last30") return [54, 32, 14];
    if (timeId === "last7") return [53, 33, 14];
    return [52, 33, 15];
  }
  if (timeId === "last30") return [66, 26, 8];
  if (timeId === "last7") return [65, 27, 8];
  return [64, 27, 9];
}

function formatSignedSeconds(value) {
  const abs = Math.abs(Math.round(value));
  return `${value >= 0 ? "+" : "-"}${abs}s`;
}

function formatSignedPercent(value) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(rounded % 1 === 0 ? 0 : 1)}%`;
}

function buildInsightModel(runtime) {
  const theme = themePacks[runtime.currentThemeId] || themePacks.smb;
  const scenario = scenarios[runtime.currentScenarioId] || scenarios.mixed;
  const time = getTimeProfile(state.selectedTimeTab);
  const workflowLabels = WORKFLOW_TAB_LABELS[theme.id] || WORKFLOW_TAB_LABELS.smb;
  const activeWorkflow = workflowLabels[state.selectedWorkflowTab] || workflowLabels[0];

  const baselineCostMap = { healthcare: 18.4, smb: 14.2, future: 21.0 };
  const optimizedCostMap = { auto: 4.6, mixed: 5.4, flagged: 6.8 };
  const scenarioCostPenalty = { auto: 0, mixed: 0.15, flagged: 0.38 };
  const themeLoadAdjust = { healthcare: 8, smb: 0, future: 14 };
  const scenarioLoadAdjust = { auto: 6, mixed: 0, flagged: -5 };
  const scenarioFlagRatio = { auto: 0.12, mixed: 0.24, flagged: 0.46 };
  const modeCycleShift = { auto: -8, mixed: -4, flagged: 18 };
  const modeAccuracyBase = { auto: 98.4, mixed: 98.0, flagged: 97.5 };
  const modeAccuracyDelta = { auto: 0.4, mixed: 0.4, flagged: 0.2 };
  const modeCompletedDelta = { auto: 14, mixed: 10, flagged: 6 };
  const modeOperatorsDelta = { auto: -4, mixed: -3, flagged: 1 };

  const baselineCost = baselineCostMap[theme.id] || 14.2;
  const avgCost = Math.max(2.8, (optimizedCostMap[scenario.mode] || 5.4) + time.avgCostAdjustment + (scenarioCostPenalty[scenario.mode] || 0));
  const reduction = Math.max(0, (1 - avgCost / baselineCost) * 100);

  const baseCompleted = scenario.metrics.completedToday + scenario.metrics.activeCases;
  const completed = Math.max(1, Math.round(baseCompleted * time.windowScale));
  const cumulativeCostSaved = Math.round(completed * (baselineCost - avgCost) * time.savingsMultiplier);
  const fteSaved = cumulativeCostSaved / 24600;

  const labels = time.labels;
  const loadOffset = (themeLoadAdjust[theme.id] || 0) + (scenarioLoadAdjust[scenario.mode] || 0);
  const seriesBase = labels.map((_, i) => {
    if (time.id === "last30") {
      const weeklyWeightsByMode = {
        auto: [0.7, 0.86, 1.01, 1.03, 1.2],
        mixed: [0.72, 0.88, 1.0, 1.01, 1.16],
        flagged: [0.74, 0.87, 0.96, 1.02, 1.14],
      };
      const weeklyWeight = (weeklyWeightsByMode[scenario.mode] || weeklyWeightsByMode.mixed)[i] || 1;
      const weeklyBase = 620 + loadOffset * 18;
      return Math.max(80, Math.round(weeklyBase * weeklyWeight));
    }

    if (time.id === "last7") {
      const weekdayWeightsByMode = {
        auto: [0.9, 1.0, 1.11, 1.17, 1.22, 0.86, 0.78],
        mixed: [0.88, 0.97, 1.07, 1.12, 1.17, 0.81, 0.73],
        flagged: [0.84, 0.93, 1.02, 1.08, 1.13, 0.79, 0.71],
      };
      const weekdayWeight = (weekdayWeightsByMode[scenario.mode] || weekdayWeightsByMode.mixed)[i] || 1;
      const dailyBase = 92 + loadOffset * 2;
      return Math.max(24, Math.round(dailyBase * weekdayWeight));
    }

    const intradayWeightsByMode = {
      auto: [0.78, 0.92, 1.09, 1.02, 1.18, 1.08],
      mixed: [0.8, 0.94, 1.1, 1.0, 1.16, 1.04],
      flagged: [0.82, 0.9, 1.12, 0.98, 1.14, 1.0],
    };
    const intradayBase = 32 + loadOffset * 0.9;
    const intradayWeight = (intradayWeightsByMode[scenario.mode] || intradayWeightsByMode.mixed)[i] || 1;
    return Math.max(18, Math.round(intradayBase * intradayWeight));
  });

  const flagRatio = Math.min(0.65, (scenarioFlagRatio[scenario.mode] || 0.24) + (time.id === "today" ? 0 : time.id === "last7" ? 0.03 : 0.05));
  const flagged = seriesBase.map((value, i) => {
    const flaggedShape = time.id === "today"
      ? [0.72, 0.83, 1.0, 0.86, 1.06, 0.98]
      : time.id === "last7"
        ? [0.96, 1.02, 1.08, 1.14, 1.12, 0.88, 0.82]
        : [0.86, 0.93, 1.01, 1.08, 1.18];
    const shapeWeight = flaggedShape[i] || 1;
    return Math.max(3, Math.round(value * flagRatio * shapeWeight));
  });
  const cumulative = labels.map((_, i) => Math.round(cumulativeCostSaved * (time.cumulativeMilestones[i] || 1)));

  const mix = getResolutionMix(scenario.mode, time.id);
  const totalResolutionCases = Math.max(1, Math.round(completed * 1.35));
  const resolutionSeries = [
    { key: "ai", label: "Fully AI", pct: mix[0], color: "#c026d3" },
    { key: "hybrid", label: "AI + Human QA", pct: mix[1], color: "#3b82f6" },
    { key: "human", label: "Operators", pct: mix[2], color: "#06b6d4" },
  ].map((item) => ({ ...item, cases: Math.max(1, Math.round((item.pct / 100) * totalResolutionCases)), value: item.pct }));

  const workflowNames = state.selectedWorkflowTab === 0
    ? [workflowLabels[1], workflowLabels[2], workflowLabels[3]]
    : [activeWorkflow, ...workflowLabels.slice(1).filter((name) => name !== activeWorkflow)].slice(0, 3);

  const workflowBreakdown = [
    { name: workflowNames[0], value: cumulativeCostSaved * 0.58 },
    { name: workflowNames[1], value: cumulativeCostSaved * 0.27 },
    { name: workflowNames[2], value: cumulativeCostSaved * 0.15 },
  ];

  const avgCycleSeconds = Math.max(42, Math.round(scenario.metrics.avgCycleSeconds + (modeCycleShift[scenario.mode] || 0) * time.deltaMultiplier));
  const accuracyCurrent = Number(Math.min(99.8, Math.max(92.4, (modeAccuracyBase[scenario.mode] || 98) + (time.id === "last30" ? 0.4 : time.id === "last7" ? 0.2 : 0))).toFixed(1));
  const accuracyDelta = Number(((modeAccuracyDelta[scenario.mode] || 0.3) * time.deltaMultiplier).toFixed(1));
  const cycleDeltaSeconds = Math.round((modeCycleShift[scenario.mode] || 0) * time.deltaMultiplier);
  const completedDelta = Math.round((modeCompletedDelta[scenario.mode] || 8) * time.deltaMultiplier);
  const operatorsPct = `${Math.round((scenario.metrics.operatorsAvailable / time.operatorsDenominator) * 100)}%`;
  const operatorsDelta = Math.round((modeOperatorsDelta[scenario.mode] || -1) * time.deltaMultiplier);
  const costDeltaValue = Math.round(cumulativeCostSaved * (time.id === "today" ? 0.09 : time.id === "last7" ? 0.13 : 0.16));

  const accuracySeries = labels.map((_, i) => {
    const drift = (i / Math.max(1, labels.length - 1)) * (scenario.mode === "flagged" ? 0.35 : 0.75);
    const base = accuracyCurrent - Math.max(0.25, accuracyDelta);
    return Number(Math.max(92, Math.min(99.8, base + drift)).toFixed(1));
  });

  const cycleBuckets = ["<1m", "1-2m", "2-3m", "3-5m", ">5m"];
  const cycleDistributionMap = {
    auto: [34, 46, 24, 11, 4],
    mixed: [22, 39, 28, 15, 8],
    flagged: [11, 25, 33, 23, 14],
  };
  const cycleDistribution = (cycleDistributionMap[scenario.mode] || cycleDistributionMap.mixed).map((v) => Math.round(v * (completed / (time.id === "today" ? 120 : time.id === "last7" ? 220 : 540))));

  const humanTouchSeries = labels.map((_, i) => Math.max(2, Math.round(flagged[i] * (scenario.mode === "flagged" ? 0.82 : 0.58))));
  const aiAssistSeries = labels.map((_, i) => Math.max(8, seriesBase[i] - humanTouchSeries[i]));

  const executionPrimaryValue = String(Math.round(seriesBase.reduce((a, b) => a + b, 0) / seriesBase.length));

  return {
    time,
    theme,
    scenario,
    activeWorkflow,
    baselineCost,
    avgCost,
    reduction,
    completed,
    cumulativeCostSaved,
    fteSaved,
    labels,
    seriesBase,
    flagged,
    cumulative,
    resolutionSeries,
    workflowBreakdown,
    totalResolutionCases,
    accuracySeries,
    cycleBuckets,
    cycleDistribution,
    humanTouchSeries,
    aiAssistSeries,
    avgCycleSeconds,
    accuracyCurrent,
    accuracyDelta,
    cycleDeltaSeconds,
    completedDelta,
    operatorsPct,
    operatorsDelta,
    costDeltaValue,
    executionPrimaryValue,
  };
}

function setTrendMenuOpen(open) {
  state.trendMenuOpen = Boolean(open);
  if (!el.trendSelectMenu || !el.trendSelectTrigger) return;
  el.trendSelectMenu.hidden = !state.trendMenuOpen;
  el.trendSelectTrigger.setAttribute("aria-expanded", state.trendMenuOpen ? "true" : "false");
}

function renderTrendView(model) {
  const view = state.selectedTrendView;
  const labels = model.labels;

  if (el.trendSelectLabel) {
    const map = {
      execution: "Execution Volume Trend",
      accuracy: "Accuracy Over Time",
      distribution: "Cycle Time Distribution",
      efficiency: "Human Efficiency",
    };
    el.trendSelectLabel.textContent = map[view] || map.execution;
  }

  el.trendSelectMenu?.querySelectorAll("[data-trend-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-trend-view") === view);
  });

  if (view === "accuracy") {
    const delta = model.accuracySeries[model.accuracySeries.length - 1] - model.accuracySeries[0];
    setText(el.primaryMetricLabel, "Current accuracy");
    setText(el.secondaryMetricLabel, "Delta vs start");
    setText(el.casesPerHour, `${model.accuracySeries[model.accuracySeries.length - 1].toFixed(1)}%`);
    setText(el.cycleCount, `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`);
    drawLineChart(el.executionChart, {
      leftPadding: 40,
      yLabelOffset: 8,
      labels,
      series: [{ color: "#c026d3", values: model.accuracySeries }],
      yFormatter: (value) => `${value.toFixed(0)}%`,
    });
    if (el.trendLegend) {
      el.trendLegend.innerHTML = `<span><i class="legend-dot is-magenta"></i>Accuracy (%)</span>`;
    }
    return;
  }

  if (view === "distribution") {
    const p95 = Math.round(model.avgCycleSeconds * 1.85);
    setText(el.primaryMetricLabel, "Median cycle");
    setText(el.secondaryMetricLabel, "P95 cycle");
    setText(el.casesPerHour, formatDuration(model.avgCycleSeconds));
    setText(el.cycleCount, formatDuration(p95));
    drawBarChart(el.executionChart, {
      labels: model.cycleBuckets,
      values: model.cycleDistribution,
      color: "#c026d3",
      yFormatter: (value) => `${Math.round(value)}`,
      leftPadding: 40,
      argoGlassS: true,
    });
    if (el.trendLegend) {
      el.trendLegend.innerHTML = `<span><i class="legend-dot is-magenta"></i>Cases</span>`;
    }
    return;
  }

  if (view === "efficiency") {
    const throughput = Math.round(model.seriesBase.reduce((sum, v) => sum + v, 0) / model.seriesBase.length);
    const perOperator = (throughput / Math.max(1, model.scenario.metrics.operatorsAvailable)).toFixed(1);
    const touchRate = (model.humanTouchSeries.reduce((s, v) => s + v, 0) / Math.max(1, model.seriesBase.reduce((s, v) => s + v, 0))) * 100;
    setText(el.primaryMetricLabel, "Cases / operator");
    setText(el.secondaryMetricLabel, "Manual touch rate");
    setText(el.casesPerHour, perOperator);
    setText(el.cycleCount, `${touchRate.toFixed(1)}%`);
    drawLineChart(el.executionChart, {
      leftPadding: 40,
      yLabelOffset: 8,
      labels,
      series: [
        { color: "#c026d3", values: model.aiAssistSeries },
        { color: "#3b82f6", values: model.humanTouchSeries },
      ],
    });
    if (el.trendLegend) {
      el.trendLegend.innerHTML = `
        <span><i class="legend-dot is-magenta"></i>AI-assisted</span>
        <span><i class="legend-dot is-blue"></i>Human-touch</span>
      `;
    }
    return;
  }

  setText(el.primaryMetricLabel, model.time.trendPrimaryLabel);
  setText(el.secondaryMetricLabel, model.time.trendSecondaryLabel);
  setText(el.casesPerHour, model.executionPrimaryValue);
  setText(el.cycleCount, formatDuration(model.avgCycleSeconds));
  drawLineChart(el.executionChart, {
    leftPadding: 36,
    yLabelOffset: 8,
    labels,
    series: [
      { color: "#c026d3", values: model.seriesBase },
      { color: "#3b82f6", values: model.flagged },
    ],
  });
  if (el.trendLegend) {
    el.trendLegend.innerHTML = `
      <span><i class="legend-dot is-magenta"></i>Cases</span>
      <span><i class="legend-dot is-blue"></i>Flagged</span>
    `;
  }
}

function bindTrendViewMenu() {
  if (!el.trendSelectTrigger || !el.trendSelectMenu) return;

  el.trendSelectTrigger.addEventListener("click", () => {
    setTrendMenuOpen(!state.trendMenuOpen);
  });

  el.trendSelectMenu.querySelectorAll("[data-trend-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-trend-view");
      if (next) state.selectedTrendView = next;
      setTrendMenuOpen(false);
      rerender();
    });
  });

  document.addEventListener("click", (event) => {
    if (!state.trendMenuOpen) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (el.trendSelectTrigger.contains(target) || el.trendSelectMenu.contains(target)) return;
    setTrendMenuOpen(false);
  });
}

function renderModel(model) {
  renderTabs(model.theme.id);

  setText(el.metricAccuracy, `${model.accuracyCurrent.toFixed(1)}%`);
  setStatusBadge(el.metricAccuracyDelta, formatSignedPercent(model.accuracyDelta), model.accuracyDelta >= 0 ? "is-good" : "is-watch");
  setText(el.metricAccuracyNote, model.time.accuracyNote);
  setText(el.metricCycle, formatCycle(model.avgCycleSeconds));
  setStatusBadge(el.metricCycleDelta, formatSignedSeconds(model.cycleDeltaSeconds), model.cycleDeltaSeconds <= 0 ? "is-good" : "is-watch");
  setText(el.metricCycleNote, model.time.cycleNote);
  setText(el.metricCompleted, String(model.completed));
  setStatusBadge(el.metricCompletedDelta, formatSignedPercent(model.completedDelta), model.completedDelta >= 0 ? "is-good" : "is-watch");
  setText(el.metricCompletedNote, model.time.completedNote);
  setText(el.metricOperators, model.operatorsPct);
  setStatusBadge(el.metricOperatorsDelta, formatSignedPercent(model.operatorsDelta), model.operatorsDelta <= 0 ? "is-good" : "is-watch");
  setText(el.metricOperatorsNote, model.time.operatorsNote);
  setText(el.metricCost, formatCompactMoney(model.cumulativeCostSaved));
  setStatusBadge(el.metricCostDelta, `+${formatCompactMoney(model.costDeltaValue)}`, "is-good");
  setText(el.metricCostNote, model.time.costNote);

  el.financeSummary.innerHTML = `
    <div class="insight-summary-item"><p>Cost saved</p><h4>${formatMoney(model.cumulativeCostSaved)} <span>${model.time.costSavedSuffix}</span></h4></div>
    <div class="insight-summary-item"><p>Avg cost/case</p><h4>$${model.avgCost.toFixed(2)} <span>vs $${model.baselineCost.toFixed(2)}</span></h4></div>
    <div class="insight-summary-item"><p>Cost reduction</p><h4>↓ ${Math.round(model.reduction)}% <span>vs baseline</span></h4></div>
    <div class="insight-summary-item"><p>FTE saved</p><h4>~${model.fteSaved.toFixed(1)} FTE <span>est.</span></h4></div>
  `;

  el.workflowBreakdown.innerHTML = model.workflowBreakdown
    .map((item) => `<div class="insight-breakdown-row"><span class="insight-breakdown-label">${item.name}:</span><span class="workflow-pill workflow-pill-light insight-breakdown-pill">${formatMoney(item.value)}</span></div>`)
    .join("");

  el.sourceBreakdown.innerHTML = model.resolutionSeries
    .map((item) => `<div class="insight-breakdown-row"><span class="insight-breakdown-label">${item.label} (${item.pct}%)</span><span class="workflow-pill workflow-pill-light insight-breakdown-pill">${formatMoney(item.cases * model.avgCost * 85)}</span></div>`)
    .join("");

  drawLineChart(el.costChart, {
    mode: "step",
    labels: model.labels,
    series: [{ color: "#22c55e", values: model.cumulative }],
    yFormatter: (value) => {
      if (value <= 0) return "$0";
      const rounded = Math.round(value / 1000) * 1000;
      return `$${Math.round(rounded / 1000)}k`;
    },
  });

  renderTrendView(model);

  resolutionModel = model;
  drawDonut(el.donutChart, model.resolutionSeries, state.resolutionHoverKey);

  el.resolutionList.innerHTML = model.resolutionSeries
    .map((item) => `
      <div class="insight-resolution-item" data-resolution-key="${item.key}">
        <div class="insight-resolution-title"><i class="legend-dot" style="background:${item.color}"></i>${item.label}</div>
        <div class="insight-resolution-row"><strong>${item.cases} cases</strong><span class="workflow-pill workflow-pill-light">${item.pct.toFixed(1)}%</span></div>
        <p>${item.key === "ai" ? "Resolved end-to-end by AI with high confidence." : item.key === "hybrid" ? "AI output reviewed and approved by a human." : "Manually resolved by a human operator."}</p>
      </div>
    `)
    .join("");

  el.resolutionLegend.innerHTML = model.resolutionSeries
    .map((item) => `<span class="insight-resolution-legend-item" data-resolution-key="${item.key}"><i class="legend-dot" style="background:${item.color}"></i>${item.label}</span>`)
    .join("");
  setResolutionHover(state.resolutionHoverKey);

  if (el.chatInput) el.chatInput.placeholder = model.theme.conversation.placeholder;
  setText(el.navDashboard, model.theme.nav.dashboard);
  setText(el.navFeeds, model.theme.nav.feeds);
  setText(el.navInsight, model.theme.nav.insight);

  if (state.generatedComparisonVisible) {
    if (state.generatedComparisonLoading) {
      renderGeneratedComparisonSkeleton();
    } else {
      renderGeneratedComparisonCard(model);
    }
  } else if (el.generatedComparison) {
    el.generatedComparison.hidden = true;
    el.generatedComparison.innerHTML = "";
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
  runInsightChatFlow();
});

el.chatInput?.addEventListener("keydown", (event) => {
  event.preventDefault();
});

bindTrendViewMenu();
bindResolutionHover();
bindInsightChatVisibilityGate();

let prev = null;
store.subscribe((runtime) => {
  presenterPanel.sync(runtime);
  const hasChanged = !prev || prev.currentThemeId !== runtime.currentThemeId || prev.currentScenarioId !== runtime.currentScenarioId || prev.runNonce !== runtime.runNonce;
  if (hasChanged) {
    renderModel(buildInsightModel(runtime));
  }
  prev = runtime;
});

const initialRuntime = store.getState();
presenterPanel.sync(initialRuntime);
renderModel(buildInsightModel(initialRuntime));
syncInsightChatFocusOverlay();
prev = { ...initialRuntime };
