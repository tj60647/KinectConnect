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

Then open `http://localhost:3000/gallery.html` in your browser to pick a stage, or navigate to `http://localhost:3000` directly for Free Play.

> If you have real hardware and want to enable native Kinect support, run `npm run install:server:full` instead. This requires Visual Studio Build Tools with the C++ workload.

---

## Hosted Gallery

The static client is published to GitHub Pages on every push to `main`:

**<https://tj60647.github.io/KinectConnect/gallery.html>**

The gallery and all stage pages load directly from Pages. Because the page is served over `https://` but your Kinect server runs locally over plain WebSockets (`ws://`), you must tell the gallery where your server is:

1. Open the gallery URL above.
2. In the **Server** dropdown, select `ws://localhost:3000` (or whichever port your server is on).
3. Click **Save**.
4. Click any stage — the stage will connect to your local server.

> Chrome and Edge may block the `https:` → `ws://` mixed-content connection by default. If the WebSocket never connects, enable **chrome://flags/#allow-insecure-localhost** or run the server behind a local TLS proxy.

---

## Getting Started Checklist

Follow these steps in order the first time you set up KinectConnect:

1. **Install Node.js ≥ 18** — download from [nodejs.org](https://nodejs.org) and run the installer.
2. **Clone or download this repo** — `git clone https://github.com/tj60647/KinectConnect.git` then `cd KinectConnect`.
3. **Install server dependencies** — run `npm run install:server` from the repo root. This skips the native Kinect addons so no C++ build tools are required.
4. **Start the dev server** — run `npm run dev`. You should see `KinectConnect server listening on http://localhost:3000`.
5. **Open the gallery** — navigate to `http://localhost:3000/gallery.html` in your browser (Chrome or Edge recommended). The gallery includes a **Server** dropdown if you need to point at a different host or port — leave it on `auto (same host)` for a local setup.
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
├── shared/
│   └── protocol.js           ← UMD module: MESSAGE_TYPES, PROTOCOL_VERSION, validators
├── server/
│   └── src/
│       ├── index.ts              ← Express + WebSocket server entry point
│       ├── KinectAdapter.ts      ← Shared adapter interface
│       ├── Kinect1Adapter.ts     ← Kinect v1 implementation
│       ├── Kinect2Adapter.ts     ← Kinect v2 implementation
│       ├── MockAdapter.ts        ← Software mock (no hardware needed)
│       └── WebSocketBroadcaster.ts
└── repo-testing-and-validation/
    └── tests/
        ├── protocol.test.js      ← Message shape & version contract tests
        ├── adapters.test.js      ← MockAdapter behaviour tests
        ├── client-compat.test.js ← sketch.js browser-compatibility checks
        └── docs-structure.test.js← README, gallery, and stage shim presence
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | TCP port the server listens on |
| `KINECT_VERSION` | `2` | Sensor to open at startup: `1`, `2`, or `mock` |
| `TLS_CERT` | _(unset)_ | Path to a PEM certificate file. Required to enable WSS. |
| `TLS_KEY` | _(unset)_ | Path to a PEM private-key file. Required to enable WSS. |

When both `TLS_CERT` and `TLS_KEY` are set the server starts an HTTPS listener and all WebSocket connections use `wss://`. Without them the server falls back to plain HTTP/WS.

### Enabling WSS locally with a self-signed certificate

```bash
# Generate a self-signed cert (valid for localhost, 365 days)
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout localhost.key -out localhost.crt \
  -days 365 -subj "/CN=localhost"

# Start the server with TLS
TLS_CERT=localhost.crt TLS_KEY=localhost.key npm run dev
```

The server will print:
```
KinectConnect server listening on https://localhost:3000
WebSocket endpoint: wss://localhost:3000
```

In the browser, open `https://localhost:3000` (accept the self-signed cert warning), then select `wss://localhost:3000` from the **Server** dropdown. Because the page is now served over `https:` the client's auto-detection also switches to `wss://` automatically when the preset is set to `auto (same host)`.

> **Note:** Browsers will reject a self-signed certificate unless you explicitly trust it or navigate to `https://localhost:3000` and click through the warning first.

---

## Shared Protocol

`shared/protocol.js` is the single source of truth for every WebSocket message shape. It is a UMD module that loads without a bundler in both environments:

- **Node.js / server:** `const { MESSAGE_TYPES } = require('../../shared/protocol')`
- **Browser / client:** `<script src="/shared/protocol.js">` → `window.KinectProtocol`

Key exports:

| Export | Type | Description |
|--------|------|-------------|
| `MESSAGE_TYPES` | Object | Frozen map of all message type strings (`sensorInfo`, `colorFrame`, `depthFrame`, `bodyFrame`, `error`, `switchSensor`) |
| `PROTOCOL_VERSION` | String | Semver string (`"1.0.0"`). Server stamps this on every outgoing message; client logs a warning on mismatch |
| `isSensorInfoMessage(msg)` | Function | Validates a `sensorInfo` message (checks `type`, `version`, `title`, `features`, `notes`) |
| `isFrameMessage(msg)` | Function | Validates a `colorFrame` or `depthFrame` message (checks `type`, `width`, `height`, `data`) |
| `isBodyFrameMessage(msg)` | Function | Validates a `bodyFrame` message (checks `type`, `bodies`) |
| `isErrorMessage(msg)` | Function | Validates an `error` message (checks `type`, `message`) |
| `isSwitchSensorMessage(msg)` | Function | Validates a `switchSensor` message (checks `type`, `version`) |

---

## Running the Tests

The `repo-testing-and-validation/` directory contains a Jest test suite that verifies protocol contracts, adapter behaviour, client compatibility, and repo structure.

```bash
# Build the server first, then run all tests
cd repo-testing-and-validation
npm install
npm test
```

> `npm test` automatically runs `npm --prefix ../server run build` before Jest. The first time you run the tests you must have Visual Studio Build Tools installed (or be on Mac/Linux where the TypeScript compile step still works). If you have already compiled the server once with `npm run build` from the repo root, that compiled output will be reused.

| Test file | What it checks |
|-----------|---------------|
| `protocol.test.js` | `MESSAGE_TYPES` constants, `PROTOCOL_VERSION` semver format, each validator accepts/rejects correctly shaped objects |
| `adapters.test.js` | `MockAdapter` emits `sensorInfo` on `open()`, emits frames after `start()`, stops after `stop()` |
| `client-compat.test.js` | `sketch.js` contains no `require()` or `process.` globals; `STAGE_CONFIGS` has all required keys and fields |
| `docs-structure.test.js` | `README.md` has required headings; gallery and all 5 stage shim files exist; root `package.json` has required scripts |

---

## Stage Guide

Each stage is a focused slice of the full KinectConnect demo. Open the stage from the gallery, then try the experiments listed below.

**Stage 0 — Setup and Mock Mode**  
You should see two animated panels (colour and depth) filled with synthetic data. No hardware is attached; the server generates fake frames so you can verify that WebSockets, p5.js, and the rendering pipeline all work. Try opening DevTools → Network → WS to watch the raw message stream arrive.

**Stage 1 — Color Stream**  
Only the left (colour) panel is active. The sensor is hardcoded to Kinect v2 and sensor switching is disabled for this stage (the server falls back to Mock automatically if no hardware is connected); the depth and skeleton panels are hidden. Try changing the pixel colour calculation inside `MockAdapter.ts` to swap the colour channels and observe the result live.

**Stage 2 — Depth Stream**  
Only the right (depth) panel is active. Pixel brightness maps to distance in millimetres. Like Stage 1, the sensor is hardcoded to Kinect v2 with no switching (falls back to Mock if unavailable). Try adjusting the colour mapping in `depthRenderer.js` — swap the grayscale `map()` call for a hue-based one to create a false-colour depth image.

**Stage 3 — Skeleton and Gesture**  
All three renderers are on. A synthetic stick figure walks across the canvas. The right-hand raise gesture is already detected; try adding a second gesture condition (e.g., both hands raised) and display it in the gesture status panel.

**Stage 4 — Sensor Toggle and Capability Compare**  
The sensor-switch buttons are enabled. Click between Kinect v1, v2, and Mock to compare the `sensorInfo` feature lists in the sidebar. If you have real hardware connected, this stage will attempt to open it and fall back to Mock automatically if it fails.

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
| `wss://` connection refused | TLS not enabled | Set `TLS_CERT` and `TLS_KEY` env vars pointing to a PEM cert and key (see **Environment Variables**) |
| Browser shows "Your connection is not private" | Self-signed certificate | Open `https://localhost:3000` directly and accept the cert warning, then reload the client page |

---

## Contributing / Side Quests

Have an idea for extending KinectConnect beyond the core stages? See `SIDEQUESTS.md` (coming soon) for guided extension challenges including:

- Streaming depth data to an ESP32 over WebSockets
- Recording and replaying a frame sequence for offline critique
- Adding a second canvas for side-by-side v1 vs v2 comparison
- Mapping skeleton joints to MIDI or OSC for live performance

