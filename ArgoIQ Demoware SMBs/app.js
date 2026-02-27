const form = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const tabLogin = document.getElementById('tabLogin');
const tabCreate = document.getElementById('tabCreate');
const loginTagline = document.getElementById('loginTagline');
const loginPresenterPanel = document.getElementById('loginPresenterPanel');
const loginPresenterClose = document.getElementById('loginPresenterClose');
const loginPresenterTheme = document.getElementById('loginPresenterTheme');
const presetCode = document.getElementById('preset-code');
const copyPresetButton = document.getElementById('copy-preset');
const panelToggle = document.getElementById('panel-toggle');
const controlPanel = document.querySelector('.control-panel');

const root = document.documentElement;
const rootComputed = getComputedStyle(root);

const turbulence = document.getElementById('frosted-rect-noise');
const gauss = document.getElementById('frosted-rect-gauss');
const displacement = document.getElementById('frosted-rect-displace');

const controls = {
  glassBlur: document.getElementById('glass-blur'),
  glassDistortion: document.getElementById('glass-distortion'),
  glassTint: document.getElementById('glass-tint'),
  glassBorder: document.getElementById('glass-border'),
  glassShadow: document.getElementById('glass-shadow'),
  radiusCard: document.getElementById('radius-card'),
  noiseFrequency: document.getElementById('noise-frequency'),
  noiseOctaves: document.getElementById('noise-octaves'),
  noiseSeed: document.getElementById('noise-seed'),
  gaussStd: document.getElementById('gauss-std'),
  displaceScale: document.getElementById('displace-scale'),
  xChannel: document.getElementById('x-channel'),
  yChannel: document.getElementById('y-channel'),
};
const hasGlassControls = Object.values(controls).every(Boolean);

const outputs = {
  glassBlur: document.getElementById('v-glass-blur'),
  glassDistortion: document.getElementById('v-glass-distortion'),
  glassTint: document.getElementById('v-glass-tint'),
  glassBorder: document.getElementById('v-glass-border'),
  glassShadow: document.getElementById('v-glass-shadow'),
  radiusCard: document.getElementById('v-radius-card'),
  noiseFrequency: document.getElementById('v-noise-frequency'),
  noiseOctaves: document.getElementById('v-noise-octaves'),
  noiseSeed: document.getElementById('v-noise-seed'),
  gaussStd: document.getElementById('v-gauss-std'),
  displaceScale: document.getElementById('v-displace-scale'),
};

const LOGIN_TAGLINES = {
  smb: 'Trusted by SMB teams where accuracy saves time',
  healthcare: 'Trusted by healthcare teams where accuracy protects outcomes',
  future: 'Trusted by teams managing high-stakes autonomous workflows',
};
const LOGIN_STORAGE_KEY = 'argoiq-demo-profile-v1';

function readStoredProfile() {
  try {
    const raw = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCurrentTheme() {
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get('theme');
  if (urlTheme && LOGIN_TAGLINES[urlTheme]) return urlTheme;

  const parsed = readStoredProfile();
  const storedTheme = parsed?.currentThemeId || parsed?.theme;
  return LOGIN_TAGLINES[storedTheme] ? storedTheme : 'smb';
}

function writeTheme(themeId) {
  const safeTheme = LOGIN_TAGLINES[themeId] ? themeId : 'smb';
  const params = new URLSearchParams(window.location.search);
  params.set('theme', safeTheme);
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', nextUrl);

  const stored = readStoredProfile() || {};
  const nextProfile = {
    ...stored,
    currentThemeId: safeTheme,
    theme: safeTheme,
  };

  try {
    window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(nextProfile));
  } catch {
    // noop
  }
}

function applyLoginThemeCopy() {
  if (!loginTagline) return;
  const themeId = getCurrentTheme();
  loginTagline.textContent = LOGIN_TAGLINES[themeId] || LOGIN_TAGLINES.smb;
  if (loginPresenterTheme) {
    loginPresenterTheme.value = themeId;
  }
}

function setLoginPresenterOpen(open) {
  if (!loginPresenterPanel) return;
  loginPresenterPanel.classList.toggle('is-open', open);
  loginPresenterPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function parseCssNumber(varName, fallback = 0) {
  const raw = rootComputed.getPropertyValue(varName).trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function setCssVar(name, value, unit = '') {
  root.style.setProperty(name, `${value}${unit}`);
}

function setOutput(key, value, suffix = '') {
  if (!outputs[key]) return;
  outputs[key].value = `${value}${suffix}`;
}

function buildPresetCode() {
  const blur = Number.parseFloat(controls.glassBlur.value);
  const distortion = Number.parseFloat(controls.glassDistortion.value);
  const tint = Number.parseFloat(controls.glassTint.value);
  const border = Number.parseFloat(controls.glassBorder.value);
  const shadow = Number.parseFloat(controls.glassShadow.value);
  const radius = Number.parseFloat(controls.radiusCard.value);
  const noiseFrequency = Number.parseFloat(controls.noiseFrequency.value);
  const noiseOctaves = Number.parseInt(controls.noiseOctaves.value, 10);
  const noiseSeed = Number.parseInt(controls.noiseSeed.value, 10);
  const gaussStd = Number.parseFloat(controls.gaussStd.value);
  const displaceScale = Number.parseFloat(controls.displaceScale.value);
  const xChannel = controls.xChannel.value;
  const yChannel = controls.yChannel.value;

  return `/* Glass Preset Export */\n:root {\n  --glass-blur: ${blur.toFixed(0)}px;\n  --glass-distortion: ${distortion.toFixed(0)};\n  --glass-tint: ${tint.toFixed(2)};\n  --glass-border: ${border.toFixed(2)};\n  --glass-shadow: ${shadow.toFixed(2)};\n  --radius-card: ${radius.toFixed(0)}px;\n}\n\n/* SVG filter internals */\n<feTurbulence type=\"fractalNoise\" baseFrequency=\"${noiseFrequency.toFixed(2)}\" numOctaves=\"${noiseOctaves}\" seed=\"${noiseSeed}\" result=\"noise\" />\n<feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"${gaussStd.toFixed(2)}\" result=\"blurred\" />\n<feDisplacementMap in=\"blurred\" in2=\"noise\" scale=\"${displaceScale.toFixed(0)}\" xChannelSelector=\"${xChannel}\" yChannelSelector=\"${yChannel}\" />\n\n/* Reusable surface class */\n.ArgoGlass-M {\n  border-radius: var(--radius-card);\n  border: 1px solid rgba(255, 255, 255, var(--glass-border));\n  background: rgba(255, 255, 255, var(--glass-tint));\n  box-shadow:\n    0 10px 30px rgba(0, 0, 0, var(--glass-shadow)),\n    inset 0 1px 0 rgba(255, 255, 255, 0.45);\n  backdrop-filter: url(#frosted-rect) blur(var(--glass-blur)) saturate(1.2);\n  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);\n}`.trim();
}

function initControlValues() {
  controls.glassBlur.value = parseCssNumber('--glass-blur', 14);
  controls.glassDistortion.value = parseCssNumber('--glass-distortion', 10);
  controls.glassTint.value = parseCssNumber('--glass-tint', 0.12);
  controls.glassBorder.value = parseCssNumber('--glass-border', 0.35);
  controls.glassShadow.value = parseCssNumber('--glass-shadow', 0.22);
  controls.radiusCard.value = parseCssNumber('--radius-card', 10);

  controls.noiseFrequency.value = turbulence?.getAttribute('baseFrequency') || '0.85';
  controls.noiseOctaves.value = turbulence?.getAttribute('numOctaves') || '1';
  controls.noiseSeed.value = turbulence?.getAttribute('seed') || '7';
  controls.gaussStd.value = gauss?.getAttribute('stdDeviation') || '0.8';
  controls.displaceScale.value = displacement?.getAttribute('scale') || controls.glassDistortion.value;
  controls.xChannel.value = displacement?.getAttribute('xChannelSelector') || 'R';
  controls.yChannel.value = displacement?.getAttribute('yChannelSelector') || 'G';
}

function applyControlValues() {
  const blur = Number.parseFloat(controls.glassBlur.value);
  const distortion = Number.parseFloat(controls.glassDistortion.value);
  const tint = Number.parseFloat(controls.glassTint.value);
  const border = Number.parseFloat(controls.glassBorder.value);
  const shadow = Number.parseFloat(controls.glassShadow.value);
  const radius = Number.parseFloat(controls.radiusCard.value);

  setCssVar('--glass-blur', blur, 'px');
  setCssVar('--glass-distortion', distortion);
  setCssVar('--glass-tint', tint);
  setCssVar('--glass-border', border);
  setCssVar('--glass-shadow', shadow);
  setCssVar('--radius-card', radius, 'px');

  setOutput('glassBlur', blur.toFixed(0), 'px');
  setOutput('glassDistortion', distortion.toFixed(0));
  setOutput('glassTint', tint.toFixed(2));
  setOutput('glassBorder', border.toFixed(2));
  setOutput('glassShadow', shadow.toFixed(2));
  setOutput('radiusCard', radius.toFixed(0), 'px');

  if (turbulence) {
    const frequency = Number.parseFloat(controls.noiseFrequency.value);
    const octaves = Number.parseInt(controls.noiseOctaves.value, 10);
    const seed = Number.parseInt(controls.noiseSeed.value, 10);

    turbulence.setAttribute('baseFrequency', frequency.toFixed(2));
    turbulence.setAttribute('numOctaves', String(octaves));
    turbulence.setAttribute('seed', String(seed));

    setOutput('noiseFrequency', frequency.toFixed(2));
    setOutput('noiseOctaves', octaves);
    setOutput('noiseSeed', seed);
  }

  if (gauss) {
    const std = Number.parseFloat(controls.gaussStd.value);
    gauss.setAttribute('stdDeviation', std.toFixed(2));
    setOutput('gaussStd', std.toFixed(2));
  }

  if (displacement) {
    const scale = Number.parseFloat(controls.displaceScale.value);
    displacement.setAttribute('scale', String(scale));
    displacement.setAttribute('xChannelSelector', controls.xChannel.value);
    displacement.setAttribute('yChannelSelector', controls.yChannel.value);

    setOutput('displaceScale', scale.toFixed(0));
  }

  if (presetCode) {
    presetCode.value = buildPresetCode();
  }
}

function bindControls() {
  Object.values(controls).forEach((el) => {
    if (!el) return;
    el.addEventListener('input', () => {
      if (el === controls.glassDistortion) {
        controls.displaceScale.value = controls.glassDistortion.value;
      }
      if (el === controls.displaceScale) {
        controls.glassDistortion.value = controls.displaceScale.value;
      }
      applyControlValues();
    });
    el.addEventListener('change', applyControlValues);
  });
}

function setActiveTab(mode) {
  const isLogin = mode === 'login';
  tabLogin.classList.toggle('is-active', isLogin);
  tabCreate.classList.toggle('is-active', !isLogin);
  tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
  tabCreate.setAttribute('aria-selected', isLogin ? 'false' : 'true');
  loginButton.textContent = isLogin ? 'Login' : 'Create Account';
}

tabLogin.addEventListener('click', () => setActiveTab('login'));
tabCreate.addEventListener('click', () => setActiveTab('create'));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  loginButton.textContent = 'Please wait...';

  window.setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const stored = readStoredProfile() || {};
    const nextUrl = new URL('./dashboard.html', window.location.href);
    nextUrl.searchParams.set('theme', getCurrentTheme());

    const scenario = params.get('scenario') || stored?.currentScenarioId || stored?.scenario;
    const speed = params.get('speed') || stored?.speedMultiplier || stored?.speed;

    if (scenario) nextUrl.searchParams.set('scenario', String(scenario));
    if (speed) nextUrl.searchParams.set('speed', String(speed));

    window.location.href = nextUrl.toString();
  }, 900);
});

if (hasGlassControls) {
  initControlValues();
  bindControls();
  applyControlValues();
}

if (hasGlassControls && copyPresetButton && presetCode) {
  copyPresetButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(presetCode.value);
      const original = copyPresetButton.textContent;
      copyPresetButton.textContent = 'Copied';
      window.setTimeout(() => {
        copyPresetButton.textContent = original;
      }, 900);
    } catch (error) {
      console.warn('Could not copy preset code.', error);
    }
  });
}

if (hasGlassControls && panelToggle && controlPanel) {
  panelToggle.addEventListener('click', () => {
    const collapsed = controlPanel.classList.toggle('is-collapsed');
    panelToggle.textContent = collapsed ? 'Show Controls' : 'Hide Controls';
    panelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'p') return;
  setLoginPresenterOpen(!loginPresenterPanel?.classList.contains('is-open'));
});

if (loginPresenterClose) {
  loginPresenterClose.addEventListener('click', () => {
    setLoginPresenterOpen(false);
  });
}

if (loginPresenterTheme) {
  loginPresenterTheme.addEventListener('change', (event) => {
    writeTheme(event.target.value);
    applyLoginThemeCopy();
  });
}

applyLoginThemeCopy();
