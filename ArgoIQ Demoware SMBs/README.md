# ArgoIQ Demoware SMBs

> **Liquid Glass Standard (2026-02-25):** This project now defaults to the Muggleee style from https://github.com/Muggleee/liquid-glass. See `../LIQUID_GLASS_STANDARD.md`.

Baseline prototype scaffold with the same liquid-glass effect from the root experiment.

## Included
- `index.html`
- `styles.css`
- `app.js`
- `sandbox-muggleee-liquid-glass/` (isolated prior sandbox)
- `sandbox-liquid-glass-studio-20260225/` (new isolated sandbox cloned from `iyinchao/liquid-glass-studio`)

Features preserved:
- WebGL2 multipass liquid-glass rectangle
- Rounded corner SDF refraction
- Frost slider and white tint fill
- Shader-based drop shadow
- Draggable glass rectangle
- Draggable purple gradient background circle (for interaction testing)

## Run
From this folder:

```bash
python3 -m http.server 8081
```

Open:
- http://localhost:8081

## New Sandbox: liquid-glass-studio (2026-02-25)

Path:
- `sandbox-liquid-glass-studio-20260225`

Source:
- https://github.com/iyinchao/liquid-glass-studio

How to inspect:

```bash
cd "sandbox-liquid-glass-studio-20260225"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

Open:
- http://127.0.0.1:5174
