const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false });
if (!gl) throw new Error('WebGL2 is required');

const controls = {
  radius: document.getElementById('radius'),
  distort: document.getElementById('distort'),
  dispersion: document.getElementById('dispersion'),
  shadowIntensity: document.getElementById('shadowIntensity'),
  shadowOffsetX: document.getElementById('shadowOffsetX'),
  shadowOffsetY: document.getElementById('shadowOffsetY'),
  shadowBlur: document.getElementById('shadowBlur'),
  highlightIntensity: document.getElementById('highlightIntensity'),
  highlightSize: document.getElementById('highlightSize'),
  highlightOffsetX: document.getElementById('highlightOffsetX'),
  highlightOffsetY: document.getElementById('highlightOffsetY'),
  uploadBg: document.getElementById('uploadBg'),
};

const labels = {
  radius: document.getElementById('radiusValue'),
  distort: document.getElementById('distortValue'),
  dispersion: document.getElementById('dispersionValue'),
  shadowIntensity: document.getElementById('shadowIntensityValue'),
  shadowOffsetX: document.getElementById('shadowOffsetXValue'),
  shadowOffsetY: document.getElementById('shadowOffsetYValue'),
  shadowBlur: document.getElementById('shadowBlurValue'),
  highlightIntensity: document.getElementById('highlightIntensityValue'),
  highlightSize: document.getElementById('highlightSizeValue'),
  highlightOffsetX: document.getElementById('highlightOffsetXValue'),
  highlightOffsetY: document.getElementById('highlightOffsetYValue'),
};

const vertexSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_textureResolution;
uniform vec2 u_mouse;
uniform vec2 u_targetMouse;
uniform vec2 u_lensCenter;
uniform float u_radius;
uniform float u_distort;
uniform float u_dispersion;
uniform float u_shadowIntensity;
uniform float u_shadowOffsetX;
uniform float u_shadowOffsetY;
uniform float u_shadowBlur;
uniform float u_highlightIntensity;
uniform float u_highlightSize;
uniform float u_highlightOffsetX;
uniform float u_highlightOffsetY;
uniform float u_time;

const float PI = 3.14159265359;

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

vec3 backgroundAt(vec2 uv) {
  vec2 imgUV = uv;

  // cover fit for full-viewport texture
  float texAspect = u_textureResolution.x / u_textureResolution.y;
  float screenAspect = u_resolution.x / u_resolution.y;
  vec2 tuv = imgUV;
  if (screenAspect > texAspect) {
    float scale = texAspect / screenAspect;
    tuv.y = tuv.y * scale + 0.5 - 0.5 * scale;
  } else {
    float scale = screenAspect / texAspect;
    tuv.x = tuv.x * scale + 0.5 - 0.5 * scale;
  }

  return texture(u_texture, tuv).rgb;
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float getDist(vec2 uv, vec2 lensCenter) {
  float sd = sdCircle(uv - lensCenter, u_radius);

  vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 mp = u_targetMouse * asp;
  float md = length(v_uv * asp - mp);
  float fall = smoothstep(0.0, 0.8, md);
  float tweak = mix(0.02 / max(fall, 0.05), 0.1 / max(fall, 0.05), u_distort * sd);
  tweak = min(-tweak, 0.0);
  return sd - tweak;
}

float getShadow(vec2 uv, vec2 lensCenter) {
  vec2 shadowPos = uv - lensCenter + vec2(u_shadowOffsetX, u_shadowOffsetY);
  float d = sdCircle(shadowPos, u_radius);
  float s = 1.0 - smoothstep(-u_shadowBlur, u_shadowBlur, d);
  return s * u_shadowIntensity;
}

float getHighlight(vec2 uv, vec2 lensCenter) {
  vec2 hp = uv - lensCenter + vec2(u_highlightOffsetX, u_highlightOffsetY);
  float r = u_radius * u_highlightSize;
  float d = sdCircle(hp, r);
  float h = 1.0 - smoothstep(-0.02, 0.02, d);
  float centerFalloff = 1.0 - smoothstep(0.0, r * 0.8, length(hp));
  return h * centerFalloff * u_highlightIntensity;
}

vec3 refrakt(float sd, vec2 st, vec2 uv) {
  float safeSd = abs(sd) < 0.0015 ? (sd < 0.0 ? -0.0015 : 0.0015) : sd;
  vec2 offset = mix(vec2(0.0), normalize(st) / safeSd, length(st));
  float maxOffset = 0.12;
  float offLen = length(offset);
  if (offLen > maxOffset) offset *= maxOffset / offLen;

  float disp = u_dispersion * 0.01;

  vec2 ro = offset * disp * 1.2;
  vec2 go = offset * disp * 1.0;
  vec2 bo = offset * disp * 0.8;

  vec3 rc = backgroundAt(uv + ro);
  vec3 gc = backgroundAt(uv + go);
  vec3 bc = backgroundAt(uv + bo);
  vec3 refracted = vec3(rc.r, gc.g, bc.b);

  float op = smoothstep(0.0, 0.0025, -sd);
  return mix(backgroundAt(uv), refracted, op);
}

void main() {
  vec2 lensCenter = u_lensCenter;

  float shadow = getShadow(v_uv, lensCenter);
  vec3 bg = backgroundAt(v_uv);
  bg = mix(bg, vec3(0.0), shadow);

  vec2 st = v_uv - lensCenter;
  st *= vec2(u_resolution.x / u_resolution.y, 1.0);
  st *= 1.0 / (0.4920 + 0.2);
  st = rot(-0.35 * 2.0 * PI) * st;

  float sd = getDist(v_uv, lensCenter);

  // five-tap like Muggleee's getEffect for smoother edge response
  float eps = 0.0005;
  vec3 c = vec3(0.0);
  c += refrakt(sd, st, v_uv);
  c += refrakt(getDist(v_uv + vec2(eps, 0.0), lensCenter), st + vec2(eps, 0.0), v_uv);
  c += refrakt(getDist(v_uv - vec2(eps, 0.0), lensCenter), st - vec2(eps, 0.0), v_uv);
  c += refrakt(getDist(v_uv + vec2(0.0, eps), lensCenter), st + vec2(0.0, eps), v_uv);
  c += refrakt(getDist(v_uv - vec2(0.0, eps), lensCenter), st - vec2(0.0, eps), v_uv);
  c *= 0.2;

  float h = getHighlight(v_uv, lensCenter);
  vec3 exposed = 1.0 - exp(-c * (1.0 + h * 2.5));
  vec3 brightened = c * (1.0 + h * 1.8);
  vec3 color = mix(exposed, brightened, 0.3);
  color *= mix(vec3(1.0), vec3(1.02, 1.01, 0.98), h * 0.3);

  // ring edge to emphasize glass boundary
  float ring = smoothstep(0.003, 0.0, abs(sd));
  color = mix(color, vec3(0.92, 0.95, 1.0), ring * 0.35);

  fragColor = vec4(color, 1.0);
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

function createProgram(vsSrc, fsSrc) {
  const program = gl.createProgram();
  const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function createTextureFromImage(image) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

const program = createProgram(vertexSource, fragmentSource);
const vao = gl.createVertexArray();
const vbo = gl.createBuffer();

gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const posLoc = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

const uniforms = {
  texture: gl.getUniformLocation(program, 'u_texture'),
  resolution: gl.getUniformLocation(program, 'u_resolution'),
  textureResolution: gl.getUniformLocation(program, 'u_textureResolution'),
  mouse: gl.getUniformLocation(program, 'u_mouse'),
  targetMouse: gl.getUniformLocation(program, 'u_targetMouse'),
  lensCenter: gl.getUniformLocation(program, 'u_lensCenter'),
  radius: gl.getUniformLocation(program, 'u_radius'),
  distort: gl.getUniformLocation(program, 'u_distort'),
  dispersion: gl.getUniformLocation(program, 'u_dispersion'),
  shadowIntensity: gl.getUniformLocation(program, 'u_shadowIntensity'),
  shadowOffsetX: gl.getUniformLocation(program, 'u_shadowOffsetX'),
  shadowOffsetY: gl.getUniformLocation(program, 'u_shadowOffsetY'),
  shadowBlur: gl.getUniformLocation(program, 'u_shadowBlur'),
  highlightIntensity: gl.getUniformLocation(program, 'u_highlightIntensity'),
  highlightSize: gl.getUniformLocation(program, 'u_highlightSize'),
  highlightOffsetX: gl.getUniformLocation(program, 'u_highlightOffsetX'),
  highlightOffsetY: gl.getUniformLocation(program, 'u_highlightOffsetY'),
  time: gl.getUniformLocation(program, 'u_time'),
};

let texture = null;
let textureSize = { width: 1, height: 1 };

const state = {
  width: 1,
  height: 1,
  mouseX: 0.73,
  mouseY: 0.52,
  targetMouseX: 0.73,
  targetMouseY: 0.52,
  lensCenterX: 0.73,
  lensCenterY: 0.52,
  smoothing: 0.06,
  radius: 0.30,
  distort: 2.3,
  dispersion: 0.7,
  shadowIntensity: 0.30,
  shadowOffsetX: 0.01,
  shadowOffsetY: 0.08,
  shadowBlur: 0.40,
  highlightIntensity: 0.40,
  highlightSize: 1.25,
  highlightOffsetX: 0.01,
  highlightOffsetY: 0.03,
};

function loadDefaultImage() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = document.createElement('canvas');
      fallback.width = fallback.height = 1024;
      const ctx = fallback.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 1024, 1024);
      g.addColorStop(0, '#d4c2ac');
      g.addColorStop(1, '#8f5c2f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 1024);
      resolve(fallback);
    };
    img.src = './ashim-d-silva-WeYamle9fDM-unsplash.jpg';
  });
}

function setTextureFromSource(source) {
  if (texture) gl.deleteTexture(texture);
  texture = createTextureFromImage(source);
  textureSize.width = source.width || source.videoWidth || 1;
  textureSize.height = source.height || source.videoHeight || 1;
}

function updateLabels() {
  labels.radius.textContent = state.radius.toFixed(2);
  labels.distort.textContent = state.distort.toFixed(2);
  labels.dispersion.textContent = state.dispersion.toFixed(2);
  labels.shadowIntensity.textContent = state.shadowIntensity.toFixed(2);
  labels.shadowOffsetX.textContent = state.shadowOffsetX.toFixed(2);
  labels.shadowOffsetY.textContent = state.shadowOffsetY.toFixed(2);
  labels.shadowBlur.textContent = state.shadowBlur.toFixed(2);
  labels.highlightIntensity.textContent = state.highlightIntensity.toFixed(2);
  labels.highlightSize.textContent = state.highlightSize.toFixed(2);
  labels.highlightOffsetX.textContent = state.highlightOffsetX.toFixed(2);
  labels.highlightOffsetY.textContent = state.highlightOffsetY.toFixed(2);
}

controls.radius.addEventListener('input', () => {
  state.radius = Number(controls.radius.value) / 100;
  updateLabels();
});
controls.distort.addEventListener('input', () => {
  state.distort = Number(controls.distort.value) / 10;
  updateLabels();
});
controls.dispersion.addEventListener('input', () => {
  state.dispersion = Number(controls.dispersion.value) / 10;
  updateLabels();
});
controls.shadowIntensity.addEventListener('input', () => {
  state.shadowIntensity = Number(controls.shadowIntensity.value) / 100;
  updateLabels();
});
controls.shadowOffsetX.addEventListener('input', () => {
  state.shadowOffsetX = Number(controls.shadowOffsetX.value) / 100;
  updateLabels();
});
controls.shadowOffsetY.addEventListener('input', () => {
  state.shadowOffsetY = Number(controls.shadowOffsetY.value) / 100;
  updateLabels();
});
controls.shadowBlur.addEventListener('input', () => {
  state.shadowBlur = Number(controls.shadowBlur.value) / 100;
  updateLabels();
});
controls.highlightIntensity.addEventListener('input', () => {
  state.highlightIntensity = Number(controls.highlightIntensity.value) / 100;
  updateLabels();
});
controls.highlightSize.addEventListener('input', () => {
  state.highlightSize = Number(controls.highlightSize.value) / 100;
  updateLabels();
});
controls.highlightOffsetX.addEventListener('input', () => {
  state.highlightOffsetX = Number(controls.highlightOffsetX.value) / 100;
  updateLabels();
});
controls.highlightOffsetY.addEventListener('input', () => {
  state.highlightOffsetY = Number(controls.highlightOffsetY.value) / 100;
  updateLabels();
});

controls.uploadBg.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    setTextureFromSource(img);
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

window.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.targetMouseX = (e.clientX - rect.left) / rect.width;
  state.targetMouseY = 1 - (e.clientY - rect.top) / rect.height;
});

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = Math.max(1, Math.floor(window.innerWidth * dpr));
  state.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.width = state.width;
  canvas.height = state.height;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  gl.viewport(0, 0, state.width, state.height);
}
window.addEventListener('resize', resize);

function render(t) {
  requestAnimationFrame(render);

  state.mouseX += (state.targetMouseX - state.mouseX) * state.smoothing;
  state.mouseY += (state.targetMouseY - state.mouseY) * state.smoothing;
  state.lensCenterX += (state.targetMouseX - state.lensCenterX) * state.smoothing;
  state.lensCenterY += (state.targetMouseY - state.lensCenterY) * state.smoothing;

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.uniform1i(uniforms.texture, 0);
  gl.uniform2f(uniforms.resolution, state.width, state.height);
  gl.uniform2f(uniforms.textureResolution, textureSize.width, textureSize.height);
  gl.uniform2f(uniforms.mouse, state.mouseX, state.mouseY);
  gl.uniform2f(uniforms.targetMouse, state.targetMouseX, state.targetMouseY);
  gl.uniform2f(uniforms.lensCenter, state.lensCenterX, state.lensCenterY);
  gl.uniform1f(uniforms.radius, state.radius);
  gl.uniform1f(uniforms.distort, state.distort);
  gl.uniform1f(uniforms.dispersion, state.dispersion);
  gl.uniform1f(uniforms.shadowIntensity, state.shadowIntensity);
  gl.uniform1f(uniforms.shadowOffsetX, state.shadowOffsetX);
  gl.uniform1f(uniforms.shadowOffsetY, state.shadowOffsetY);
  gl.uniform1f(uniforms.shadowBlur, state.shadowBlur);
  gl.uniform1f(uniforms.highlightIntensity, state.highlightIntensity);
  gl.uniform1f(uniforms.highlightSize, state.highlightSize);
  gl.uniform1f(uniforms.highlightOffsetX, state.highlightOffsetX);
  gl.uniform1f(uniforms.highlightOffsetY, state.highlightOffsetY);
  gl.uniform1f(uniforms.time, t);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
}

async function init() {
  resize();
  updateLabels();
  const img = await loadDefaultImage();
  setTextureFromSource(img);
  requestAnimationFrame(render);
}

init();
