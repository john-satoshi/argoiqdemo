import { getArgoGlassPreset } from './presets.js';

function to255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function readCssVarsFromControls(controls) {
  const tint = controls.tint ?? { r: 255, g: 255, b: 255, a: 0 };
  return {
    '--argoglass-ref-thickness': `${controls.refThickness}px`,
    '--argoglass-ref-factor': `${controls.refFactor}`,
    '--argoglass-ref-dispersion': `${controls.refDispersion}`,
    '--argoglass-fresnel-range': `${controls.refFresnelRange}`,
    '--argoglass-fresnel-hardness': `${controls.refFresnelHardness}`,
    '--argoglass-fresnel-factor': `${controls.refFresnelFactor}`,
    '--argoglass-glare-range': `${controls.glareRange}`,
    '--argoglass-glare-hardness': `${controls.glareHardness}`,
    '--argoglass-glare-factor': `${controls.glareFactor}`,
    '--argoglass-glare-convergence': `${controls.glareConvergence}`,
    '--argoglass-glare-angle': `${controls.glareAngle}deg`,
    '--argoglass-blur-radius': `${controls.blurRadius}px`,
    '--argoglass-radius': `${controls.shapeRadius}px`,
    '--argoglass-roundness': `${controls.shapeRoundness}`,
    '--argoglass-shadow-expand': `${controls.shadowExpand}px`,
    '--argoglass-shadow-factor': `${controls.shadowFactor}`,
    '--argoglass-shadow-x': `${controls.shadowPosition?.x ?? 0}px`,
    '--argoglass-shadow-y': `${controls.shadowPosition?.y ?? 0}px`,
    '--argoglass-tint': `rgba(${to255(tint.r)}, ${to255(tint.g)}, ${to255(tint.b)}, ${tint.a ?? 0})`,
  };
}

export function applyArgoGlass(element, options = {}) {
  if (!element) {
    throw new Error('applyArgoGlass requires a target element.');
  }

  const presetName = options.presetName ?? 'ArgoGlass-Base';
  const preset = options.preset ?? getArgoGlassPreset(presetName);
  const cssVars = readCssVarsFromControls(preset.controls);

  element.setAttribute('data-argoglass', presetName);
  Object.entries(cssVars).forEach(([k, v]) => {
    element.style.setProperty(k, v);
  });

  return preset;
}
