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

## Getting Started Checklist

Follow these steps in order the first time you set up KinectConnect:

1. **Install Node.js ≥ 18** — download from [nodejs.org](https://nodejs.org) and run the installer.
2. **Clone or download this repo** — `git clone https://github.com/tj60647/KinectConnect.git` then `cd KinectConnect`.
3. **Install server dependencies** — run `npm run install:server` from the repo root. This skips the native Kinect addons so no C++ build tools are required.
4. **Start the dev server** — run `npm run dev`. You should see `KinectConnect server listening on http://localhost:3000`.
5. **Open the gallery** — navigate to `http://localhost:3000/gallery.html` in your browser (Chrome or Edge recommended).
6. **Click Stage 0** — the stage redirects to the main app in Mock mode. No hardware is needed.
7. **Verify mock frames appear** — open browser DevTools (F12 → Console). You should see no errors. The canvas should show animated color and depth frames within a few seconds.

If you get past Step 7 you are ready for Stages 1–4.

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

---

## Stage Guide

Each stage is a focused slice of the full KinectConnect demo. Open the stage from the gallery, then try the experiments listed below.

**Stage 0 — Setup and Mock Mode**  
You should see two animated panels (colour and depth) filled with synthetic data. No hardware is attached; the server generates fake frames so you can verify that WebSockets, p5.js, and the rendering pipeline all work. Try opening DevTools → Network → WS to watch the raw message stream arrive.

**Stage 1 — Color Stream**  
Only the left (colour) panel is active. The Kinect v2 is locked on; the depth and skeleton panels are hidden. Try changing the `rgba` calculation inside `MockAdapter.ts` to swap the colour channels and observe the result live.

**Stage 2 — Depth Stream**  
Only the right (depth) panel is active. Pixel brightness maps to distance in millimetres. Try adjusting the colour mapping in `depthRenderer.js` — swap the grayscale `map()` call for a hue-based one to create a false-colour depth image.

**Stage 3 — Skeleton and Gesture**  
All three renderers are on. A synthetic stick figure walks across the canvas. The right-hand raise gesture is already detected; try adding a second gesture condition (e.g., both hands raised) and display it in the gesture status panel.

**Stage 4 — Sensor Toggle and Capability Compare**  
The sensor-switch buttons are enabled. Click between Kinect v1, v2, and Mock to compare the `sensorInfo` capability lists in the sidebar. If you have real hardware connected, this stage will attempt to open it and fall back to Mock automatically if it fails.

**Free Play**  
All streams and controls are enabled. Use this mode for open exploration, critique sessions, or demonstrating the full sensor pipeline to a class.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `gyp ERR! build error` during install | Node native addon tried to build | Run `npm run install:server` (not `:full`), or install Visual Studio Build Tools with the "Desktop development with C++" workload |
| `WebSocket connection failed` in browser | Server is not running | Run `npm run dev` and confirm the terminal shows `listening on http://localhost:3000` |
| Canvas shows "No color frame yet" permanently | Server started but sensor not initialised | Check the terminal for errors; if using real hardware, confirm the Kinect SDK is installed and the sensor is plugged into USB 3.0 |
| `Kinect not detected` / falls back to Mock | Kinect SDK or USB issue | Check Device Manager for the Kinect entry; try a different USB 3.0 port; verify Kinect SDK 2.0 is installed |
| Protocol version mismatch warning in console | Client and server built from different versions | Rebuild the server (`npm run build`) and hard-refresh the browser (Ctrl+Shift+R) |
| Port 3000 already in use | Another process is on port 3000 | Set `PORT=3001 npm run dev`, then open `http://localhost:3001/gallery.html` |

---

## Contributing / Side Quests

Have an idea for extending KinectConnect beyond the core stages? See `SIDEQUESTS.md` (coming soon) for guided extension challenges including:

- Streaming depth data to an ESP32 over WebSockets
- Recording and replaying a frame sequence for offline critique
- Adding a second canvas for side-by-side v1 vs v2 comparison
- Mapping skeleton joints to MIDI or OSC for live performance

