# ArgoGlass Kit

Portable preset kit for reusing the approved Liquid Glass look (`ArgoGlass-Base`) across future prototypes.

## What this gives you

- One canonical preset name: `ArgoGlass-Base`
- Local helper API (no paid external API)
- Portable preset JSON for sharing and versioning

## Files

- `presets/ArgoGlass-Base.json`: canonical exported preset file
- `src/presets.js`: preset registry
- `src/applyArgoGlass.js`: apply helper for DOM elements
- `src/adapters/levaStudioAdapter.js`: helper for Leva `controlsAPI`
- `examples/`: copy/paste usage snippets

## Quick Usage (Vanilla)

```js
import { applyArgoGlass } from '/absolute/path/to/argoglass-kit/src/index.js';

const card = document.querySelector('.argoglass-surface');
applyArgoGlass(card, { presetName: 'ArgoGlass-Base' });
```

Use `examples/argoglass.css` as the starter style class.

## Quick Usage (React)

See `examples/react-usage.jsx`.

## Quick Usage (Liquid Glass Studio style / Leva)

```js
import { applyArgoGlassToLeva } from '/absolute/path/to/argoglass-kit/src/index.js';

applyArgoGlassToLeva(controlsAPI, 'ArgoGlass-Base');
```

## Future chat/build prompt

Use this sentence in a new chat:

`Use the ArgoGlass-Base preset from /Users/john/Documents/Codex | ArgoIQ Demoware/argoglass-kit and apply it to the primary glass surface.`
