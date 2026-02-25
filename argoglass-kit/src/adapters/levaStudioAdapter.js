import { getArgoGlassPreset } from '../presets.js';

export function applyArgoGlassToLeva(controlsAPI, presetName = 'ArgoGlass-Base') {
  if (typeof controlsAPI !== 'function') {
    throw new Error('applyArgoGlassToLeva requires a Leva controlsAPI function.');
  }
  const preset = getArgoGlassPreset(presetName);
  controlsAPI(preset.controls);
  return preset;
}
