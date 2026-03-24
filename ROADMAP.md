# KinectConnect — Refactor Roadmap

This document tracks the phased refactor of KinectConnect toward a stage-based teaching architecture, modeled after [smart-object-foundations](https://github.com/tj60647/smart-object-foundations).

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔲 | Not started |
| ⬜ | Optional / low priority |

---

## Phase A — Root Normalization ✅

Establish a working root for the monorepo so the whole project can be operated from a single directory.

- [x] Add root `package.json` with `install:server`, `dev`, `build`, `start` scripts
- [x] Add root `.gitignore` that excludes `server/dist/`, `server/node_modules/`, `.env`, logs
- [x] Default `install:server` skips `optionalDependencies` (no native Kinect addon required for setup)

---

## Phase B — Stage-Based Structure ✅

Layer a learning-stage hierarchy on top of the existing server/client architecture.

- [x] `client/gallery.html` — card-grid stage picker with descriptions for all 5 stages + Free Play
- [x] `client/stages/stage-{0–4}-*.html` — thin redirect shims that pass `?stage=N` to `index.html`
- [x] `client/sketch.js` — `STAGE_CONFIGS` object: per-stage sensor lock, renderer visibility flags, label
- [x] `client/index.html` — `#stageLabel` element shows current stage; gallery link badge in header
- [x] Stage 0 always forces `MockAdapter` (no hardware dependency for onboarding)
- [x] Stages 1–3 lock sensor and hide irrelevant renderers; stage 4 and Free Play allow full switching

---

## Phase C — Shared versioned message protocol ✅

Define a single source of truth for every WebSocket message shape so server and client stay in sync as the codebase evolves and so tests can validate message contracts.

**What to build:**

- `shared/protocol.js` — plain CommonJS (browser + Node compatible without a bundler)
  - Export a `MESSAGE_TYPES` constant object: `sensorInfo`, `colorFrame`, `depthFrame`, `bodyFrame`, `error`, `switchSensor`
  - Export a `PROTOCOL_VERSION` semver string (start at `"1.0.0"`)
  - Export lightweight validator functions: `isSensorInfoMessage(msg)`, `isFrameMessage(msg)`, etc.
- Update `server/src/index.ts` to require `shared/protocol.js` and stamp `protocolVersion` on every broadcast
- Update `client/sketch.js` to import `protocol.js` via `<script>` tag and check `protocolVersion` on connect

**Message shapes to document (derived from current adapters):**

| Type | Fields |
|------|--------|
| `sensorInfo` | `type`, `version` (`"1"`, `"2"`, `"mock"`), `capabilities` (array of `"color"`, `"depth"`, `"skeleton"`) |
| `colorFrame` | `type`, `data` (base64 JPEG or pixel buffer), `width`, `height` |
| `depthFrame` | `type`, `data`, `width`, `height`, `maxDepth` |
| `bodyFrame` | `type`, `bodies` (array of joint maps) |
| `error` | `type`, `message` |
| `switchSensor` | `type`, `version` |

---

## Phase D — Test Harness ✅

Create `repo-testing-and-validation/` modeled on the reference repo's test suite. Goal: 100+ passing tests that a learner can run to verify their repo is intact.

**Folder layout:**
```
repo-testing-and-validation/
├── package.json          (jest, no extra deps)
├── jest.config.js
└── tests/
    ├── protocol.test.js        ← message shape & version contract tests
    ├── adapters.test.js        ← MockAdapter open/start/stop/fallback behavior
    ├── client-compat.test.js   ← sketch.js: no require(), no Node globals, STAGE_CONFIGS completeness
    └── docs-structure.test.js  ← README, gallery.html, stage shims all present; stages 0–4 valid
```

**Key test cases per file:**

- `protocol.test.js` — `isSensorInfoMessage` accepts/rejects correctly shaped objects; `PROTOCOL_VERSION` is a valid semver; all `MESSAGE_TYPES` constants are strings; each validator rejects missing required fields
- `adapters.test.js` — `MockAdapter` emits `sensorInfo` on `open()`; `start()` emits frames at expected rate; `stop()` stops emission; `close()` does not throw
- `client-compat.test.js` — `sketch.js` source does not contain `require(` or `process.`; `STAGE_CONFIGS` keys include `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"free"`; each config has the required fields
- `docs-structure.test.js` — `README.md` exists and contains "Quick Start", "Stages", and "Hardware Matrix" headings; `client/gallery.html` exists; all 5 stage shim files exist; `package.json` at root has `dev` and `build` scripts

---

## Phase E — Learner Runbook ✅

Expand `README.md` with a full onboarding checklist and troubleshooting guide so a design student can get running without help.

**Sections to add to README.md:**

- **Getting Started Checklist** — numbered steps: install Node → clone → `npm run install:server` → `npm run dev` → open gallery → click Stage 0 → verify mock frames appear in browser console
- **Troubleshooting** — table of common errors and fixes:
  - `gyp ERR! build error` → run `install:server` (not `:full`) or install VS Build Tools
  - `WebSocket connection failed` → confirm server is running on port 3000
  - `Kinect not detected` → check USB port, SDK installation, sensor power
- **Stage Guide** — one paragraph per stage explaining what the learner should see and what to try changing in the code
- **Contributing / Side Quests** — stub section linking to future `SIDEQUESTS.md`

---

## Phase F — Runtime Hardening ⬜

Optional improvements for critique sessions and performance. Not required for the core teaching workflow.

- **Frame throttling** — add a `frameRate` cap (default 15 fps) configurable via URL param (`?fps=30`) and `STAGE_CONFIGS`
- **Startup diagnostics panel** — small overlay in `index.html` showing: server connected ✓, sensor detected ✓, protocol version match ✓
- **Recording mode** — capture a sequence of frames to a local JSON blob for offline critique playback; triggered by a keyboard shortcut
- **Resolution profiles** — `low` / `medium` / `full` quality modes per stage to reduce bandwidth for classroom WiFi

---

## Dependency Graph

```
A (root) → B (stages) → C (protocol) → D (tests)
                                    ↗
                       E (runbook) →
F (hardening) — independent
```

Phases A and B are complete. C is the prerequisite for good protocol tests in D. E can proceed in parallel with C/D. F is independent and lowest priority.
