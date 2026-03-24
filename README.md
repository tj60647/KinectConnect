# KinectConnect

**Author:** Thomas J McLeish  
**License:** MIT  

A teaching workspace that bridges a Kinect sensor to a p5.js browser client over WebSockets. Designed for design students with little or no coding background — work through the staged exercises in order, or skip straight to Free Play once the hardware is running.

---

## Hardware Matrix

| Sensor | Platform | SDK Required | USB |
|--------|----------|--------------|-----|
| Kinect v1 | Windows | Kinect SDK 1.8 | 2.0 |
| Kinect v2 | Windows | Kinect SDK 2.0 | 3.0 (SuperSpeed) |
| Mock (no sensor) | Any | None | — |

> The server auto-falls back to Mock mode if no sensor is detected. Stage 0 always runs in Mock mode so you can verify your setup without hardware.

---

## Prerequisites

- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- **Windows** — required for real Kinect hardware (v1 or v2 SDK only runs on Windows)
- **Visual Studio Build Tools** with the "Desktop development with C++" workload — only needed if you want to connect real hardware; not needed for Mock mode

---

## Quick Start

```bash
# 1. Install server dependencies (skips native Kinect addons)
npm run install:server

# 2. Start the dev server
npm run dev
```

Then open `client/gallery.html` in your browser to pick a stage, or open `client/index.html` directly for Free Play.

> If you have real hardware and want to enable native Kinect support, run `npm run install:server:full` instead. This requires Visual Studio Build Tools with the C++ workload.

---

## Folder Structure

```
KinectConnect/
├── client/
│   ├── gallery.html          ← Stage picker — start here
│   ├── index.html            ← Main app shell
│   ├── sketch.js             ← p5.js runtime, stage configs, WebSocket state
│   ├── colorRenderer.js      ← Color stream rendering
│   ├── depthRenderer.js      ← Depth stream rendering
│   ├── skeletonRenderer.js   ← Skeleton/gesture overlay
│   └── stages/
│       ├── stage-0-setup.html
│       ├── stage-1-color.html
│       ├── stage-2-depth.html
│       ├── stage-3-skeleton.html
│       └── stage-4-toggle.html
└── server/
    └── src/
        ├── index.ts              ← Express + WebSocket server entry point
        ├── KinectAdapter.ts      ← Shared adapter interface
        ├── Kinect1Adapter.ts     ← Kinect v1 implementation
        ├── Kinect2Adapter.ts     ← Kinect v2 implementation
        ├── MockAdapter.ts        ← Software mock (no hardware needed)
        └── WebSocketBroadcaster.ts
```

---

## Stages

| Stage | File | What you learn |
|-------|------|----------------|
| 0 — Setup | `stage-0-setup.html` | Server connection, Mock mode, developer tools |
| 1 — Color | `stage-1-color.html` | Raw RGB color stream from Kinect |
| 2 — Depth | `stage-2-depth.html` | Depth (distance) stream and grayscale mapping |
| 3 — Skeleton | `stage-3-skeleton.html` | Body joint tracking and gesture overlay |
| 4 — Toggle | `stage-4-toggle.html` | Switching between Kinect v1 and v2, capability compare |
| Free Play | `index.html` | All streams enabled, full sensor switching |

---

## npm Scripts

| Script | What it does |
|--------|-------------|
| `npm run install:server` | Install server deps, skip native Kinect addons |
| `npm run install:server:full` | Install everything including Kinect native addons |
| `npm run dev` | Start server with ts-node (live reload friendly) |
| `npm run build` | Compile TypeScript to `server/dist/` |
| `npm run start` | Run compiled server from `server/dist/` |
