import { scenarios, themePacks } from "./dashboard-config.js";

const DEFAULTS = {
  theme: "smb",
  scenario: "mixed",
  speed: 1,
};
const STORAGE_KEY = "argoiq-demo-profile-v1";

function normalizeTheme(themeId) {
  return themePacks[themeId] ? themeId : DEFAULTS.theme;
}

function normalizeScenario(scenarioId) {
  return scenarios[scenarioId] ? scenarioId : DEFAULTS.scenario;
}

function normalizeSpeed(speedRaw) {
  const n = Number.parseFloat(speedRaw);
  return [0.5, 1, 2].includes(n) ? n : DEFAULTS.speed;
}

function readPersistedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      currentThemeId: normalizeTheme(parsed?.currentThemeId || parsed?.theme || DEFAULTS.theme),
      currentScenarioId: normalizeScenario(parsed?.currentScenarioId || parsed?.scenario || DEFAULTS.scenario),
      speedMultiplier: normalizeSpeed(parsed?.speedMultiplier || parsed?.speed || DEFAULTS.speed),
    };
  } catch {
    return null;
  }
}

function stateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const persisted = readPersistedState();
  return {
    currentThemeId: normalizeTheme(params.get("theme") || persisted?.currentThemeId || DEFAULTS.theme),
    currentScenarioId: normalizeScenario(params.get("scenario") || persisted?.currentScenarioId || DEFAULTS.scenario),
    speedMultiplier: normalizeSpeed(params.get("speed") || persisted?.speedMultiplier || DEFAULTS.speed),
    frozen: false,
    showHuman: false,
    autoPass: false,
    demoClockStart: performance.now(),
    runNonce: 0,
  };
}

export function createRuntimeStore() {
  let state = stateFromUrl();
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener(state));
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("theme", state.currentThemeId);
    url.searchParams.set("scenario", state.currentScenarioId);
    url.searchParams.set("speed", String(state.speedMultiplier));
    window.history.replaceState({}, "", url);
  }

  function syncStorage() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentThemeId: state.currentThemeId,
          currentScenarioId: state.currentScenarioId,
          speedMultiplier: state.speedMultiplier,
        }),
      );
    } catch {
      // noop
    }
  }

  function update(next) {
    state = { ...state, ...next };
    syncUrl();
    syncStorage();
    emit();
  }

  function recomputeScenarioFlags(scenarioId) {
    const scenario = scenarios[scenarioId];
    return {
      autoPass: scenario.mode === "auto",
      showHuman: scenario.mode === "flagged" || scenario.mode === "mixed",
    };
  }

  const initialFlags = recomputeScenarioFlags(state.currentScenarioId);
  state = { ...state, ...initialFlags };
  syncUrl();
  syncStorage();

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },
    setTheme(themeId) {
      update({ currentThemeId: normalizeTheme(themeId) });
    },
    setScenario(scenarioId) {
      const resolved = normalizeScenario(scenarioId);
      update({
        currentScenarioId: resolved,
        ...recomputeScenarioFlags(resolved),
      });
    },
    setSpeed(speed) {
      update({ speedMultiplier: normalizeSpeed(speed) });
    },
    setFrozen(frozen) {
      update({ frozen: Boolean(frozen) });
    },
    resetRun() {
      update({
        demoClockStart: performance.now(),
        runNonce: state.runNonce + 1,
      });
    },
    copyShareableLink() {
      return window.location.href;
    },
  };
}
