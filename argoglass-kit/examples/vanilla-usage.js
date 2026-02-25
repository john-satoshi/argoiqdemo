import { applyArgoGlass } from '../src/index.js';

const card = document.querySelector('[data-demo="argoglass-card"]');
applyArgoGlass(card, { presetName: 'ArgoGlass-Base' });
