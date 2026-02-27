/**
 * @typedef {Object} ThemeModule
 * @property {string} name
 * @property {string} tag
 * @property {string} title
 * @property {string} description
 */

/**
 * @typedef {Object} ThemePack
 * @property {string} id
 * @property {string} appName
 * @property {string} productName
 * @property {{ dashboard: string, feeds: string, insight: string }} nav
 * @property {{ primary: ThemeModule }} modules
 * @property {{ singular: string, plural: string, idPrefixes: string[] }} entityNaming
 * @property {{ validated: string, flagged: string, autoApproved: string, inReview: string }} statusVocabulary
 * @property {{ primaryOperator: string, secondaryOperator: string }} roleTitles
 * @property {{ inputPhaseSteps: string[], evaluationChecks: string[], outputPhaseSteps: string[] }} workflowPhases
 * @property {{ activeCases: string, completedToday: string, avgCycle: string, nextReviewEta: string, operatorsAvailable: string }} kpiLabels
 * @property {string[]} liveEventTemplates
 * @property {{ idPattern: string, timestampPattern: string }} samplePatterns
 * @property {{ liveEventLabel: string, whatsHappening: string, stuckOrRisky: string, ctaPrimary: string, tooltip: string }} microcopy
 * @property {{ placeholder: string, statusQuestionTemplate: string, riskQuestion: string, aiLabel: string, humanLabel: string, riskSignal: string, performanceMetric: string, riskMetric: string }} conversation
 */

/**
 * @typedef {Object} Scenario
 * @property {string} id
 * @property {string} label
 * @property {"auto" | "flagged" | "mixed"} mode
 * @property {string} primaryModuleKey
 * @property {number} seed
 * @property {{ activeCases: number, completedToday: number, avgCycleSeconds: number, nextReviewEtaSeconds: number, operatorsAvailable: number }} metrics
 */

/** @type {Record<string, ThemePack>} */
export const themePacks = {
  healthcare: {
    id: "healthcare",
    appName: "ArgoIQ",
    productName: "ArgoIQ Ops",
    nav: { dashboard: "Dashboard", feeds: "Feeds", insight: "Insight" },
    modules: {
      primary: {
        name: "Claims Review",
        tag: "Claims",
        title: "Claims QA & Revenue Integrity",
        description: "Ingests claims, validates coding quality, and routes high-risk submissions to human review.",
      },
    },
    entityNaming: { singular: "Claim", plural: "Claims", idPrefixes: ["CLM", "ENC", "AUTH"] },
    statusVocabulary: {
      validated: "Validated",
      flagged: "Flagged for review",
      autoApproved: "Auto-approved",
      inReview: "In review",
    },
    roleTitles: {
      primaryOperator: "Claims QA Operator",
      secondaryOperator: "Revenue Integrity Specialist",
    },
    workflowPhases: {
      inputPhaseSteps: ["Input normalization", "Eligibility check", "Coding parse"],
      evaluationChecks: ["Policy mismatch", "Risk threshold", "Duplicate detection"],
      outputPhaseSteps: ["Auto decision", "Human escalation", "Case closure"],
    },
    kpiLabels: {
      activeCases: "Active claims:",
      completedToday: "Completed (today):",
      avgCycle: "Avg cycle time:",
      nextReviewEta: "Next review ETA:",
      operatorsAvailable: "Operators available:",
    },
    liveEventTemplates: [
      "{entity} {id} validated and queued for adjudication",
      "{entity} {id} matched policy rules and auto-approved",
      "{entity} {id} flagged for payer mismatch review",
      "{entity} {id} routed to {operatorRole}",
      "{entity} {id} completed with status: {status}",
      "{entity} {id} moved to secondary check window",
    ],
    samplePatterns: { idPattern: "{prefix}-{n}", timestampPattern: "HH:mm:ss" },
    microcopy: {
      liveEventLabel: "Live Event:",
      whatsHappening: "Claim flow is actively processing with QA safeguards.",
      stuckOrRisky: "Two claims are in manual review due to policy mismatch.",
      ctaPrimary: "View Live Cases",
      tooltip: "Live supervision signal",
    },
    conversation: {
      placeholder: "Ask about live workflow status",
      statusQuestionTemplate: "What’s happening with {workflow} right now?",
      riskQuestion: "Anything stuck or risky?",
      aiLabel: "are being processed by AI",
      humanLabel: "are under human review",
      riskSignal: "low confidence",
      performanceMetric: "Avg resolution time",
      riskMetric: "SLA risk",
    },
  },
  smb: {
    id: "smb",
    appName: "ArgoIQ",
    productName: "ArgoIQ Ops",
    nav: { dashboard: "Dashboard", feeds: "Feeds", insight: "Insight" },
    modules: {
      primary: {
        name: "Revenue Ops",
        tag: "RevOps",
        title: "CRM & Revenue Ops Cleanup",
        description: "Ingests new leads, validates CRM data, enriches missing fields, and routes edge cases to human QA before impact.",
      },
    },
    entityNaming: { singular: "Lead", plural: "Leads", idPrefixes: ["L", "INV", "VND", "BKG"] },
    statusVocabulary: {
      validated: "Validated",
      flagged: "Flagged",
      autoApproved: "Auto-approved",
      inReview: "In review",
    },
    roleTitles: {
      primaryOperator: "Ops QA Specialist",
      secondaryOperator: "RevOps Specialist",
    },
    workflowPhases: {
      inputPhaseSteps: ["Input normalization", "Field validation", "Entity enrichment"],
      evaluationChecks: ["Duplicate detection", "Risk scoring", "Ownership check"],
      outputPhaseSteps: ["Auto route", "Human QA", "CRM sync"],
    },
    kpiLabels: {
      activeCases: "Active cases:",
      completedToday: "Completed (today):",
      avgCycle: "Avg cycle time:",
      nextReviewEta: "Next review ETA:",
      operatorsAvailable: "Operators available:",
    },
    liveEventTemplates: [
      "{entity} {id} enriched, deduped, and synced",
      "{entity} {id} validated and routed to account owner",
      "{entity} {id} flagged for billing mismatch review",
      "{entity} {id} routed to {operatorRole}",
      "{entity} {id} completed with status: {status}",
      "{entity} {id} moved to verification queue",
    ],
    samplePatterns: { idPattern: "{prefix}-{n}", timestampPattern: "HH:mm:ss" },
    microcopy: {
      liveEventLabel: "Live Event:",
      whatsHappening: "Ops workflows are active and routing in real time.",
      stuckOrRisky: "One workflow is waiting on human QA confirmation.",
      ctaPrimary: "View Live Cases",
      tooltip: "Live supervision signal",
    },
    conversation: {
      placeholder: "Ask about live workflow status",
      statusQuestionTemplate: "What’s happening with {workflow} right now?",
      riskQuestion: "Anything stuck or risky?",
      aiLabel: "are being enriched and validated by AI",
      humanLabel: "are under RevOps QA review",
      riskSignal: "low data confidence",
      performanceMetric: "Avg resolution time",
      riskMetric: "Pipeline risk",
    },
  },
  future: {
    id: "future",
    appName: "ArgoIQ",
    productName: "ArgoIQ Systems",
    nav: { dashboard: "Dashboard", feeds: "Feeds", insight: "Insight" },
    modules: {
      primary: {
        name: "Workflow Supervision",
        tag: "Supervisor",
        title: "Autonomous Workflow Supervision",
        description: "Monitors multi-agent workflows, validates execution traces, and escalates uncertain outputs to a human reviewer.",
      },
    },
    entityNaming: { singular: "Workflow", plural: "Workflows", idPrefixes: ["WF", "RUN", "TASK"] },
    statusVocabulary: {
      validated: "Validated",
      flagged: "Needs intervention",
      autoApproved: "Auto-resolved",
      inReview: "Human oversight",
    },
    roleTitles: {
      primaryOperator: "Workflow Supervisor",
      secondaryOperator: "Human-in-the-loop Analyst",
    },
    workflowPhases: {
      inputPhaseSteps: ["Signal intake", "Context merge", "Constraint parse"],
      evaluationChecks: ["Drift detection", "Policy compliance", "Confidence gate"],
      outputPhaseSteps: ["Auto resolve", "Human intervention", "Run archive"],
    },
    kpiLabels: {
      activeCases: "Active workflows:",
      completedToday: "Completed (today):",
      avgCycle: "Avg cycle time:",
      nextReviewEta: "Next review ETA:",
      operatorsAvailable: "Supervisors online:",
    },
    liveEventTemplates: [
      "{entity} {id} merged contextual signals",
      "{entity} {id} auto-resolved with high confidence",
      "{entity} {id} flagged and escalated to {operatorRole}",
      "{entity} {id} completed with status: {status}",
      "{entity} {id} passed drift checks and moved forward",
      "{entity} {id} entered oversight queue",
    ],
    samplePatterns: { idPattern: "{prefix}-{n}", timestampPattern: "HH:mm:ss" },
    microcopy: {
      liveEventLabel: "Live Event:",
      whatsHappening: "Supervision loop is validating live execution paths.",
      stuckOrRisky: "One workflow is under human oversight for risk mitigation.",
      ctaPrimary: "View Live Cases",
      tooltip: "Live supervision signal",
    },
    conversation: {
      placeholder: "Ask about live workflow status",
      statusQuestionTemplate: "What’s happening with {workflow} right now?",
      riskQuestion: "Anything stuck or risky?",
      aiLabel: "are being supervised by AI",
      humanLabel: "are in human oversight",
      riskSignal: "execution uncertainty",
      performanceMetric: "Avg resolution time",
      riskMetric: "Pipeline delay risk",
    },
  },
};

/** @type {Record<string, Scenario>} */
export const scenarios = {
  auto: {
    id: "auto",
    label: "Auto-pass",
    mode: "auto",
    primaryModuleKey: "primary",
    seed: 101,
    metrics: {
      activeCases: 27,
      completedToday: 143,
      avgCycleSeconds: 102,
      nextReviewEtaSeconds: 60,
      operatorsAvailable: 6,
    },
  },
  flagged: {
    id: "flagged",
    label: "Flagged",
    mode: "flagged",
    primaryModuleKey: "primary",
    seed: 202,
    metrics: {
      activeCases: 19,
      completedToday: 62,
      avgCycleSeconds: 198,
      nextReviewEtaSeconds: 120,
      operatorsAvailable: 4,
    },
  },
  mixed: {
    id: "mixed",
    label: "Mixed",
    mode: "mixed",
    primaryModuleKey: "primary",
    seed: 303,
    metrics: {
      activeCases: 23,
      completedToday: 97,
      avgCycleSeconds: 138,
      nextReviewEtaSeconds: 90,
      operatorsAvailable: 5,
    },
  },
};
