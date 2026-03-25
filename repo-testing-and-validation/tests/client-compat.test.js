// =============================================================================
// File:    tests/client-compat.test.js
// Project: KinectConnect
//
// Authors: Copilot
//          Thomas J McLeish
// License: MIT — see LICENSE in the root of this repository
// =============================================================================
//
// Browser and p5.js instance-mode compatibility checks for client/sketch.js.
//
// KinectConnect's sketch.js runs as a plain browser script loaded via <script>
// tag — there is no Node.js runtime, no module bundler, and no require().
// These tests catch accidental use of Node.js-specific syntax before anyone
// opens a browser.
//
// Checks:
//   1. File exists and is non-empty
//   2. No require() calls — absent in browsers
//   3. No import / export / module.exports — ES/CJS module syntax unsupported
//   4. No Node.js-only globals (__dirname, __filename, process.)
//   5. STAGE_CONFIGS has all required keys: "0"–"4" and "free"
//   6. Each STAGE_CONFIGS entry has the required fields
//   7. JavaScript syntax is valid

"use strict";

const fs   = require("fs");
const path = require("path");

const ROOT      = path.resolve(__dirname, "../..");
const SKETCH    = path.join(ROOT, "client", "sketch.js");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function syntaxError(code) {
  try {
    // eslint-disable-next-line no-new-func
    new Function(`(async () => {\n${code}\n})()`);
    return null;
  } catch (e) {
    return e.message;
  }
}

// =============================================================================
// 1. File existence and size
// =============================================================================

describe("sketch.js — file existence", () => {
  test("client/sketch.js exists", () => {
    expect(fs.existsSync(SKETCH)).toBe(true);
  });

  test("client/sketch.js is non-empty (> 1 KB)", () => {
    const size = fs.statSync(SKETCH).size;
    expect(size).toBeGreaterThan(1024);
  });
});

// =============================================================================
// 2 & 3. No Node.js module syntax
// =============================================================================

describe("sketch.js — no Node.js or ES module syntax", () => {
  let code;
  beforeAll(() => { code = read(SKETCH); });

  test("does not call require() — Node.js module system is absent in browsers", () => {
    expect(code).not.toMatch(/\brequire\s*\(/);
  });

  test("does not use import statements — not supported in browser script tag", () => {
    expect(code).not.toMatch(/^\s*import\s+/m);
  });

  test("does not use export statements — not supported in browser script tag", () => {
    expect(code).not.toMatch(/^\s*export\s+/m);
  });

  test("does not use module.exports — Node.js only", () => {
    expect(code).not.toMatch(/\bmodule\.exports\b/);
  });
});

// =============================================================================
// 4. No Node.js-only globals
// =============================================================================

describe("sketch.js — no Node.js-only globals", () => {
  let code;
  beforeAll(() => { code = read(SKETCH); });

  test("does not reference __dirname", () => {
    expect(code).not.toMatch(/\b__dirname\b/);
  });

  test("does not reference __filename", () => {
    expect(code).not.toMatch(/\b__filename\b/);
  });

  test("does not use process. (e.g. process.env) — Node.js global absent in browsers", () => {
    expect(code).not.toMatch(/\bprocess\./);
  });
});

// =============================================================================
// 5. STAGE_CONFIGS — required keys present
// =============================================================================

describe("sketch.js — STAGE_CONFIGS keys", () => {
  const REQUIRED_KEYS = ["0", "1", "2", "3", "4", "free"];

  for (const key of REQUIRED_KEYS) {
    test(`STAGE_CONFIGS contains key "${key}"`, () => {
      const code = read(SKETCH);
      // Match either a quoted property ("free":) or an unquoted one (free:)
      // followed by optional whitespace and a colon then an opening brace.
      const pattern = new RegExp(`(?:["']${key}["']|(?<![\\w$])${key}(?![\\w$]))\\s*:\\s*\\{`);
      expect(code).toMatch(pattern);
    });
  }
});

// =============================================================================
// 6. STAGE_CONFIGS — each entry has required fields
// =============================================================================

describe("sketch.js — STAGE_CONFIGS required fields per entry", () => {
  const REQUIRED_FIELDS = [
    "label",
    "defaultSensor",
    "canSwitchSensor",
    "showColor",
    "showDepth",
    "showSkeleton",
    "forcedSensor",
  ];

  let code;
  beforeAll(() => { code = read(SKETCH); });

  for (const field of REQUIRED_FIELDS) {
    test(`STAGE_CONFIGS entries reference the "${field}" field`, () => {
      expect(code).toMatch(new RegExp(`\\b${field}\\b`));
    });
  }
});

// =============================================================================
// 8. STAGE_CONFIGS — Phase F fields present
// =============================================================================

describe("sketch.js — STAGE_CONFIGS Phase F fields", () => {
  const PHASE_F_FIELDS = ["frameRate", "quality"];

  let code;
  beforeAll(() => { code = read(SKETCH); });

  for (const field of PHASE_F_FIELDS) {
    test(`STAGE_CONFIGS entries reference the "${field}" field`, () => {
      expect(code).toMatch(new RegExp(`\\b${field}\\b`));
    });
  }
});

// =============================================================================
// 7. JavaScript syntax validity
// =============================================================================

describe("sketch.js — JavaScript syntax validity", () => {
  test("sketch.js is syntactically valid JavaScript", () => {
    const code = read(SKETCH);
    const err  = syntaxError(code);
    expect(err).toBeNull();
  });
});
