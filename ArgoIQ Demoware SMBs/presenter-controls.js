export function buildRouteWithProfile(pathname, runtime) {
  const url = new URL(pathname, window.location.href);
  url.searchParams.set("theme", runtime.currentThemeId);
  url.searchParams.set("scenario", runtime.currentScenarioId);
  url.searchParams.set("speed", String(runtime.speedMultiplier));
  return url.toString();
}

export function initPresenterPanel(controls, actions) {
  const {
    panel,
    closeButton,
    themeSelect,
    scenarioSelect,
    speedSelect,
    resetButton,
    freezeButton,
    shareButton,
    logoTrigger,
  } = controls;
  const copiedDurationMs = Number.isFinite(actions.copiedDurationMs) ? actions.copiedDurationMs : 1000;

  if (!panel) {
    return {
      setOpen() {},
      toggle() {},
      sync() {},
    };
  }

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function toggle() {
    setOpen(!panel.classList.contains("is-open"));
  }

  function sync(runtime) {
    if (themeSelect) themeSelect.value = runtime.currentThemeId;
    if (scenarioSelect) scenarioSelect.value = runtime.currentScenarioId;
    if (speedSelect) speedSelect.value = String(runtime.speedMultiplier);
    if (freezeButton) {
      freezeButton.textContent = runtime.frozen ? "Resume motion" : "Freeze motion";
    }
  }

  let clickBurst = 0;
  let lastClickAt = 0;

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "p") toggle();
  });

  logoTrigger?.addEventListener("click", () => {
    const now = performance.now();
    clickBurst = now - lastClickAt < 700 ? clickBurst + 1 : 1;
    lastClickAt = now;
    if (clickBurst >= 3) {
      clickBurst = 0;
      toggle();
    }
  });

  closeButton?.addEventListener("click", () => setOpen(false));
  themeSelect?.addEventListener("change", (event) => {
    actions.onThemeChange?.(event.target.value);
  });
  scenarioSelect?.addEventListener("change", (event) => {
    actions.onScenarioChange?.(event.target.value);
  });
  speedSelect?.addEventListener("change", (event) => {
    actions.onSpeedChange?.(event.target.value);
  });
  resetButton?.addEventListener("click", () => {
    actions.onReset?.();
  });
  freezeButton?.addEventListener("click", () => {
    actions.onToggleFreeze?.();
  });
  shareButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(actions.getShareLink?.() || "");
      const original = shareButton.textContent;
      shareButton.textContent = "Copied";
      window.setTimeout(() => {
        shareButton.textContent = original;
      }, copiedDurationMs);
    } catch {
      // noop
    }
  });

  return { setOpen, toggle, sync };
}
