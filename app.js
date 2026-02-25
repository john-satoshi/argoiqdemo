const canvas = document.getElementById('gl');
const cornerRadiusInput = document.getElementById('cornerRadius');
const thicknessInput = document.getElementById('thickness');
const blurRadiusInput = document.getElementById('blurRadius');
const frostLevelInput = document.getElementById('frostLevel');
const shadowXInput = document.getElementById('shadowX');
const shadowYInput = document.getElementById('shadowY');
const shadowBlurInput = document.getElementById('shadowBlur');
const shadowSpreadInput = document.getElementById('shadowSpread');
const shadowOpacityInput = document.getElementById('shadowOpacity');
const cornerRadiusValue = document.getElementById('cornerRadiusValue');
const thicknessValue = document.getElementById('thicknessValue');
const blurRadiusValue = document.getElementById('blurRadiusValue');
const frostLevelValue = document.getElementById('frostLevelValue');
const shadowXValue = document.getElementById('shadowXValue');
const shadowYValue = document.getElementById('shadowYValue');
const shadowBlurValue = document.getElementById('shadowBlurValue');
const shadowSpreadValue = document.getElementById('shadowSpreadValue');
const shadowOpacityValue = document.getElementById('shadowOpacityValue');

const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false });
if (!gl) {
  throw new Error('WebGL2 is required for this experiment.');
}

gl.getExtension('EXT_color_buffer_float');

const MAX_BLUR_RADIUS = 64;

const vertexSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const bgFragmentSource = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform vec2 u_rectCenter;
uniform vec2 u_rectSize;
uniform float u_cornerRadius;
uniform float u_roundness;
uniform vec2 u_shadowOffset;
uniform float u_shadowBlur;
uniform float u_shadowSpread;
uniform float u_shadowOpacity;
uniform vec3 u_shadowColor;
uniform vec2 u_circleCenter;
uniform float u_circleRadius;

float checker(vec2 p, float size) {
  vec2 id = floor(p / size);
  return mod(id.x + id.y, 2.0);
}

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

float roundedRectSDF(vec2 p, vec2 center, vec2 size, float cornerRadius, float n) {
  p -= center;
  float cr = min(cornerRadius, min(size.x, size.y) * 0.5 - 0.001);
  vec2 d = abs(p) - size * 0.5;

  if (d.x > -cr && d.y > -cr) {
    vec2 cornerCenter = sign(p) * (size * 0.5 - vec2(cr));
    vec2 cornerP = p - cornerCenter;
    return superellipseCornerSDF(cornerP, cr, n);
  }

  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

void main() {
  vec2 px = v_uv * u_resolution;
  float c = checker(px, 56.0);
  vec3 a = vec3(0.95, 0.97, 1.0);
  vec3 b = vec3(0.78, 0.83, 0.9);
  vec3 base = mix(a, b, c);

  float band = 0.5 + 0.5 * sin(v_uv.y * 6.2831 + v_uv.x * 1.6);
  base = mix(base, base * 0.9 + vec3(0.04, 0.05, 0.07), band * 0.12);

  // Purple gradient circle layer behind glass.
  vec2 circleP = gl_FragCoord.xy - u_circleCenter;
  float circleDist = length(circleP);
  float circleMask = 1.0 - smoothstep(u_circleRadius - 2.0, u_circleRadius + 2.0, circleDist);
  float radial = clamp(circleDist / max(u_circleRadius, 0.001), 0.0, 1.0);
  float angle = atan(circleP.y, circleP.x);
  vec3 purpleA = vec3(0.45, 0.16, 0.94);
  vec3 purpleB = vec3(0.76, 0.36, 0.98);
  vec3 purpleC = vec3(0.32, 0.12, 0.78);
  vec3 circleColor = mix(purpleA, purpleB, 1.0 - radial);
  circleColor = mix(circleColor, purpleC, 0.5 + 0.5 * sin(angle + radial * 6.0));
  base = mix(base, circleColor, circleMask * 0.95);

  vec2 shadowCenter = u_rectCenter + vec2(u_shadowOffset.x, -u_shadowOffset.y);
  vec2 shadowSize = max(vec2(2.0), u_rectSize + vec2(u_shadowSpread * 2.0));
  float dist = roundedRectSDF(gl_FragCoord.xy, shadowCenter, shadowSize, u_cornerRadius, u_roundness);
  float outsideMask = smoothstep(-1.0, 1.0, dist);
  float shadowAlpha = exp(-max(dist, 0.0) / max(u_shadowBlur, 0.001)) * outsideMask * u_shadowOpacity;
  base = mix(base, u_shadowColor, clamp(shadowAlpha, 0.0, 1.0));

  fragColor = vec4(base, 1.0);
}`;

const blurVFragmentSource = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[${MAX_BLUR_RADIUS + 1}];

void main() {
  vec2 texel = 1.0 / u_resolution;
  vec4 sum = texture(u_prev, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= ${MAX_BLUR_RADIUS}; i++) {
    if (i > u_blurRadius) break;
    float w = u_blurWeights[i];
    vec2 off = vec2(0.0, float(i)) * texel;
    sum += texture(u_prev, v_uv + off) * w;
    sum += texture(u_prev, v_uv - off) * w;
  }
  fragColor = sum;
}`;

const blurHFragmentSource = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_prev;
uniform vec2 u_resolution;
uniform int u_blurRadius;
uniform float u_blurWeights[${MAX_BLUR_RADIUS + 1}];

void main() {
  vec2 texel = 1.0 / u_resolution;
  vec4 sum = texture(u_prev, v_uv) * u_blurWeights[0];
  for (int i = 1; i <= ${MAX_BLUR_RADIUS}; i++) {
    if (i > u_blurRadius) break;
    float w = u_blurWeights[i];
    vec2 off = vec2(float(i), 0.0) * texel;
    sum += texture(u_prev, v_uv + off) * w;
    sum += texture(u_prev, v_uv - off) * w;
  }
  fragColor = sum;
}`;

const mainFragmentSource = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_bg;
uniform sampler2D u_blur;
uniform vec2 u_resolution;
uniform vec2 u_rectCenter;
uniform vec2 u_rectSize;
uniform float u_cornerRadius;
uniform float u_roundness;
uniform float u_refThickness;
uniform float u_refFactor;
uniform float u_dispersion;
uniform float u_glareAngle;
uniform float u_tintOpacity;
uniform float u_frostLevel;

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

float roundedRectSDF(vec2 p, vec2 center, vec2 size, float cornerRadius, float n) {
  p -= center;
  float cr = min(cornerRadius, min(size.x, size.y) * 0.5 - 0.001);
  vec2 d = abs(p) - size * 0.5;

  if (d.x > -cr && d.y > -cr) {
    vec2 cornerCenter = sign(p) * (size * 0.5 - vec2(cr));
    vec2 cornerP = p - cornerCenter;
    return superellipseCornerSDF(cornerP, cr, n);
  }

  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdf(vec2 fragPx) {
  return roundedRectSDF(fragPx, u_rectCenter, u_rectSize, u_cornerRadius, u_roundness);
}

vec2 sdfNormal(vec2 fragPx) {
  float eps = 0.7;
  float dx = sdf(fragPx + vec2(eps, 0.0)) - sdf(fragPx - vec2(eps, 0.0));
  float dy = sdf(fragPx + vec2(0.0, eps)) - sdf(fragPx - vec2(0.0, eps));
  return normalize(vec2(dx, dy));
}

vec3 sampleDispersion(sampler2D texA, sampler2D texB, float mixRate, vec2 uv, vec2 off, float k) {
  float nR = 1.0 - 0.02;
  float nG = 1.0;
  float nB = 1.0 + 0.02;

  vec2 offR = off * (1.0 - (nR - 1.0) * k);
  vec2 offG = off * (1.0 - (nG - 1.0) * k);
  vec2 offB = off * (1.0 - (nB - 1.0) * k);

  float r = mix(texture(texA, uv + offR).r, texture(texB, uv + offR).r, mixRate);
  float g = mix(texture(texA, uv + offG).g, texture(texB, uv + offG).g, mixRate);
  float b = mix(texture(texA, uv + offB).b, texture(texB, uv + offB).b, mixRate);
  return vec3(r, g, b);
}

void main() {
  float dist = sdf(gl_FragCoord.xy);
  vec4 bg = texture(u_bg, v_uv);

  if (dist > 2.0) {
    fragColor = bg;
    return;
  }

  if (dist < 0.0) {
    vec2 normal = sdfNormal(gl_FragCoord.xy);
    float nDist = -dist;

    float xRatio = 1.0 - nDist / max(u_refThickness, 0.0001);
    xRatio = clamp(xRatio, 0.0, 1.0);
    float thetaI = asin(xRatio * xRatio);
    float thetaT = asin((1.0 / max(1.001, u_refFactor)) * sin(thetaI));
    float edgeFactor = -tan(thetaT - thetaI);

    if (nDist >= u_refThickness) {
      edgeFactor = 0.0;
    }

    vec2 uvOffset = -normal * edgeFactor * 0.045 * vec2(u_resolution.y / u_resolution.x, 1.0);
    // Frost control: 0.0 = very clear, 1.0 = frosty.
    float blurMix = smoothstep(0.0, u_refThickness, nDist) * mix(0.05, 0.95, clamp(u_frostLevel, 0.0, 1.0));

    vec3 refracted = sampleDispersion(u_bg, u_blur, blurMix, v_uv, uvOffset, u_dispersion);

    float fresnel = clamp(pow(1.0 + dist / 1400.0 + 0.2, 5.0), 0.0, 1.0);

    float angle = atan(normal.y, normal.x);
    float glare = 0.5 + 0.5 * sin((angle - 0.785398 + u_glareAngle) * 2.0);
    glare = pow(clamp(glare, 0.0, 1.0), 0.35);

    vec3 tint = vec3(1.0);
    vec3 color = mix(refracted, tint, clamp(u_tintOpacity, 0.0, 1.0));
    color = mix(color, vec3(1.0), fresnel * mix(0.06, 0.2, clamp(u_frostLevel, 0.0, 1.0)));
    color = mix(color, vec3(1.0), glare * smoothstep(0.0, u_refThickness * 0.7, nDist) * mix(0.04, 0.12, clamp(u_frostLevel, 0.0, 1.0)));

    float edgeAA = smoothstep(-1.0, 1.5, dist);
    fragColor = vec4(mix(color, bg.rgb, edgeAA), 1.0);
    return;
  }

  float border = smoothstep(0.0, 2.0, dist);
  vec3 rim = mix(vec3(1.0), bg.rgb, border);
  fragColor = vec4(rim, 1.0);
}`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed');
  }
  return shader;
}

function createProgram(vertex, fragment) {
  const program = gl.createProgram();
  const vs = compileShader(gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  const uniforms = new Map();
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms.set(name, gl.getUniformLocation(program, info.name));
  }

  return { program, uniforms };
}

function createRenderTarget(width, height) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  const canFloat = !!gl.getExtension('EXT_color_buffer_float');
  if (canFloat) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Framebuffer incomplete');
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    framebuffer: fb,
    texture: tex,
    resize(newW, newH) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (canFloat) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, newW, newH, 0, gl.RGBA, gl.FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, newW, newH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
  };
}

function gaussianWeights(radius) {
  const sigma = radius / 3;
  const weights = new Float32Array(MAX_BLUR_RADIUS + 1);
  let sum = 0;
  for (let i = 0; i <= MAX_BLUR_RADIUS; i++) {
    if (i > radius) {
      weights[i] = 0;
      continue;
    }
    const w = Math.exp(-0.5 * (i * i) / (sigma * sigma));
    weights[i] = w;
    sum += i === 0 ? w : w * 2;
  }
  for (let i = 0; i <= radius; i++) {
    weights[i] /= sum;
  }
  return weights;
}

const bgProgram = createProgram(vertexSource, bgFragmentSource);
const blurVProgram = createProgram(vertexSource, blurVFragmentSource);
const blurHProgram = createProgram(vertexSource, blurHFragmentSource);
const mainProgram = createProgram(vertexSource, mainFragmentSource);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

for (const p of [bgProgram, blurVProgram, blurHProgram, mainProgram]) {
  const loc = gl.getAttribLocation(p.program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}

gl.bindVertexArray(null);

let width = 0;
let height = 0;
let dpr = 1;

let bgTarget;
let blurVTarget;
let blurHTarget;

const state = {
  cornerRadius: Number(cornerRadiusInput.value),
  thickness: Number(thicknessInput.value),
  blurRadius: Number(blurRadiusInput.value),
  blurWeights: gaussianWeights(Number(blurRadiusInput.value)),
  frostLevel: Number(frostLevelInput.value) / 100,
  shadowX: Number(shadowXInput.value),
  shadowY: Number(shadowYInput.value),
  shadowBlur: Number(shadowBlurInput.value),
  shadowSpread: Number(shadowSpreadInput.value),
  shadowOpacity: Number(shadowOpacityInput.value) / 100,
  rectCenterX: 0,
  rectCenterY: 0,
  circleCenterX: 0,
  circleCenterY: 0,
  circleRadiusPx: 0,
  dragActive: false,
  dragTarget: 'none',
  dragOffsetX: 0,
  dragOffsetY: 0,
};

function updateLabels() {
  cornerRadiusValue.textContent = `${Math.round(state.cornerRadius)}px`;
  thicknessValue.textContent = `${Math.round(state.thickness)}`;
  blurRadiusValue.textContent = `${Math.round(state.blurRadius)}`;
  frostLevelValue.textContent = `${Math.round(state.frostLevel * 100)}%`;
  shadowXValue.textContent = `${Math.round(state.shadowX)}`;
  shadowYValue.textContent = `${Math.round(state.shadowY)}`;
  shadowBlurValue.textContent = `${Math.round(state.shadowBlur)}`;
  shadowSpreadValue.textContent = `${Math.round(state.shadowSpread)}`;
  shadowOpacityValue.textContent = `${Math.round(state.shadowOpacity * 100)}%`;
}

cornerRadiusInput.addEventListener('input', () => {
  state.cornerRadius = Number(cornerRadiusInput.value);
  updateLabels();
});

thicknessInput.addEventListener('input', () => {
  state.thickness = Number(thicknessInput.value);
  updateLabels();
});

blurRadiusInput.addEventListener('input', () => {
  state.blurRadius = Number(blurRadiusInput.value);
  state.blurWeights = gaussianWeights(Math.max(1, Math.min(MAX_BLUR_RADIUS, state.blurRadius)));
  updateLabels();
});

frostLevelInput.addEventListener('input', () => {
  state.frostLevel = Number(frostLevelInput.value) / 100;
  updateLabels();
});

shadowXInput.addEventListener('input', () => {
  state.shadowX = Number(shadowXInput.value);
  updateLabels();
});

shadowYInput.addEventListener('input', () => {
  state.shadowY = Number(shadowYInput.value);
  updateLabels();
});

shadowBlurInput.addEventListener('input', () => {
  state.shadowBlur = Number(shadowBlurInput.value);
  updateLabels();
});

shadowSpreadInput.addEventListener('input', () => {
  state.shadowSpread = Number(shadowSpreadInput.value);
  updateLabels();
});

shadowOpacityInput.addEventListener('input', () => {
  state.shadowOpacity = Number(shadowOpacityInput.value) / 100;
  updateLabels();
});

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.floor(window.innerWidth * dpr));
  height = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  if (!bgTarget) {
    bgTarget = createRenderTarget(width, height);
    blurVTarget = createRenderTarget(width, height);
    blurHTarget = createRenderTarget(width, height);
  } else {
    bgTarget.resize(width, height);
    blurVTarget.resize(width, height);
    blurHTarget.resize(width, height);
  }

  gl.viewport(0, 0, width, height);

  if (state.rectCenterX === 0 && state.rectCenterY === 0) {
    state.rectCenterX = width * 0.5;
    state.rectCenterY = height * 0.54;
  }
  state.circleRadiusPx = getCircleRadiusPx();
  if (state.circleCenterX === 0 && state.circleCenterY === 0) {
    state.circleCenterX = width * 0.32;
    state.circleCenterY = height * 0.54;
  }
  const clamped = clampRectCenter(state.rectCenterX, state.rectCenterY);
  state.rectCenterX = clamped.x;
  state.rectCenterY = clamped.y;
  const circleClamped = clampCircleCenter(state.circleCenterX, state.circleCenterY);
  state.circleCenterX = circleClamped.x;
  state.circleCenterY = circleClamped.y;
}

window.addEventListener('resize', resize);
resize();
updateLabels();

function getRectSizePx() {
  const rectW = Math.min(width * 0.62, 720 * dpr);
  const rectH = Math.min(height * 0.36, 320 * dpr);
  return { rectW, rectH };
}

function clampRectCenter(x, y) {
  const { rectW, rectH } = getRectSizePx();
  const halfW = rectW * 0.5;
  const halfH = rectH * 0.5;
  return {
    x: Math.min(width - halfW, Math.max(halfW, x)),
    y: Math.min(height - halfH, Math.max(halfH, y)),
  };
}

function getCircleRadiusPx() {
  return Math.max(56 * dpr, Math.min(160 * dpr, Math.min(width, height) * 0.14));
}

function clampCircleCenter(x, y) {
  const r = state.circleRadiusPx;
  return {
    x: Math.min(width - r, Math.max(r, x)),
    y: Math.min(height - r, Math.max(r, y)),
  };
}

function pointerToGLPixels(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * dpr;
  const y = height - (event.clientY - rect.top) * dpr;
  return { x, y };
}

function isPointerInsideRect(px, py) {
  const { rectW, rectH } = getRectSizePx();
  return (
    Math.abs(px - state.rectCenterX) <= rectW * 0.5 &&
    Math.abs(py - state.rectCenterY) <= rectH * 0.5
  );
}

function isPointerInsideCircle(px, py) {
  const dx = px - state.circleCenterX;
  const dy = py - state.circleCenterY;
  return dx * dx + dy * dy <= state.circleRadiusPx * state.circleRadiusPx;
}

canvas.addEventListener('pointerdown', (event) => {
  const p = pointerToGLPixels(event);
  if (isPointerInsideRect(p.x, p.y)) {
    state.dragTarget = 'rect';
    state.dragActive = true;
    state.dragOffsetX = p.x - state.rectCenterX;
    state.dragOffsetY = p.y - state.rectCenterY;
  } else if (isPointerInsideCircle(p.x, p.y)) {
    state.dragTarget = 'circle';
    state.dragActive = true;
    state.dragOffsetX = p.x - state.circleCenterX;
    state.dragOffsetY = p.y - state.circleCenterY;
  } else {
    return;
  }
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('pointermove', (event) => {
  const p = pointerToGLPixels(event);
  if (!state.dragActive) {
    canvas.style.cursor =
      isPointerInsideRect(p.x, p.y) || isPointerInsideCircle(p.x, p.y) ? 'grab' : 'default';
    return;
  }
  if (state.dragTarget === 'rect') {
    const next = clampRectCenter(p.x - state.dragOffsetX, p.y - state.dragOffsetY);
    state.rectCenterX = next.x;
    state.rectCenterY = next.y;
  } else if (state.dragTarget === 'circle') {
    const next = clampCircleCenter(p.x - state.dragOffsetX, p.y - state.dragOffsetY);
    state.circleCenterX = next.x;
    state.circleCenterY = next.y;
  }
});

canvas.addEventListener('pointerup', (event) => {
  state.dragActive = false;
  state.dragTarget = 'none';
  canvas.releasePointerCapture(event.pointerId);
  canvas.style.cursor = 'default';
});

canvas.addEventListener('pointercancel', () => {
  state.dragActive = false;
  state.dragTarget = 'none';
  canvas.style.cursor = 'default';
});

function bindCommon(programObj) {
  gl.useProgram(programObj.program);
  gl.bindVertexArray(vao);
}

function setVec2(programObj, name, x, y) {
  const loc = programObj.uniforms.get(name);
  if (loc) gl.uniform2f(loc, x, y);
}

function setFloat(programObj, name, v) {
  const loc = programObj.uniforms.get(name);
  if (loc) gl.uniform1f(loc, v);
}

function setInt(programObj, name, v) {
  const loc = programObj.uniforms.get(name);
  if (loc) gl.uniform1i(loc, v);
}

function drawFullscreen() {
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function render() {
  requestAnimationFrame(render);
  const { rectW, rectH } = getRectSizePx();
  const safeRadius = Math.min(state.cornerRadius * dpr, rectW * 0.5 - 2, rectH * 0.5 - 2);

  // Pass 1: checker background
  gl.bindFramebuffer(gl.FRAMEBUFFER, bgTarget.framebuffer);
  bindCommon(bgProgram);
  setVec2(bgProgram, 'u_resolution', width, height);
  setVec2(bgProgram, 'u_rectCenter', state.rectCenterX, state.rectCenterY);
  setVec2(bgProgram, 'u_rectSize', rectW, rectH);
  setFloat(bgProgram, 'u_cornerRadius', Math.max(2, safeRadius));
  setFloat(bgProgram, 'u_roundness', 4.8);
  setVec2(bgProgram, 'u_shadowOffset', state.shadowX * dpr, state.shadowY * dpr);
  setFloat(bgProgram, 'u_shadowBlur', Math.max(1, state.shadowBlur * dpr));
  setFloat(bgProgram, 'u_shadowSpread', state.shadowSpread * dpr);
  setFloat(bgProgram, 'u_shadowOpacity', state.shadowOpacity);
  setVec2(bgProgram, 'u_circleCenter', state.circleCenterX, state.circleCenterY);
  setFloat(bgProgram, 'u_circleRadius', state.circleRadiusPx);
  const shadowColorLoc = bgProgram.uniforms.get('u_shadowColor');
  if (shadowColorLoc) gl.uniform3f(shadowColorLoc, 0.0, 0.0, 0.0);
  drawFullscreen();

  // Pass 2: vertical blur
  gl.bindFramebuffer(gl.FRAMEBUFFER, blurVTarget.framebuffer);
  bindCommon(blurVProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bgTarget.texture);
  setInt(blurVProgram, 'u_prev', 0);
  setVec2(blurVProgram, 'u_resolution', width, height);
  setInt(blurVProgram, 'u_blurRadius', Math.max(1, Math.min(MAX_BLUR_RADIUS, Math.round(state.blurRadius))));
  const blurWeightsLocV = blurVProgram.uniforms.get('u_blurWeights');
  if (blurWeightsLocV) gl.uniform1fv(blurWeightsLocV, state.blurWeights);
  drawFullscreen();

  // Pass 3: horizontal blur
  gl.bindFramebuffer(gl.FRAMEBUFFER, blurHTarget.framebuffer);
  bindCommon(blurHProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, blurVTarget.texture);
  setInt(blurHProgram, 'u_prev', 0);
  setVec2(blurHProgram, 'u_resolution', width, height);
  setInt(blurHProgram, 'u_blurRadius', Math.max(1, Math.min(MAX_BLUR_RADIUS, Math.round(state.blurRadius))));
  const blurWeightsLocH = blurHProgram.uniforms.get('u_blurWeights');
  if (blurWeightsLocH) gl.uniform1fv(blurWeightsLocH, state.blurWeights);
  drawFullscreen();

  // Pass 4: liquid glass composition
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  bindCommon(mainProgram);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bgTarget.texture);
  setInt(mainProgram, 'u_bg', 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, blurHTarget.texture);
  setInt(mainProgram, 'u_blur', 1);

  setVec2(mainProgram, 'u_resolution', width, height);
  setVec2(mainProgram, 'u_rectCenter', state.rectCenterX, state.rectCenterY);
  setVec2(mainProgram, 'u_rectSize', rectW, rectH);
  setFloat(mainProgram, 'u_cornerRadius', Math.max(2, safeRadius));
  setFloat(mainProgram, 'u_roundness', 4.8);
  setFloat(mainProgram, 'u_refThickness', state.thickness * dpr);
  setFloat(mainProgram, 'u_refFactor', 1.42);
  setFloat(mainProgram, 'u_dispersion', 8.0);
  setFloat(mainProgram, 'u_glareAngle', -0.785398);
  setFloat(mainProgram, 'u_tintOpacity', 0.2);
  setFloat(mainProgram, 'u_frostLevel', state.frostLevel);

  drawFullscreen();

  gl.bindVertexArray(null);
}

render();
