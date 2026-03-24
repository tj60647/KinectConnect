// =============================================================================
// File:    tests/docs-structure.test.js
// Project: KinectConnect
//
// Authors: Copilot
//          Thomas J McLeish
// License: MIT — see LICENSE in the root of this repository
// =============================================================================
//
// Repository structure and documentation integrity checks.
//
// These tests give a learner (or an instructor) confidence that the repo is
// intact: every required file is present, README contains key sections, and
// the root package.json exposes the expected scripts.
//
// Checks:
//   1. README.md exists and contains required section headings
//   2. client/gallery.html exists
//   3. All 5 stage shim files exist under client/stages/
//   4. Root package.json has required scripts (dev, build, install:server)
//   5. shared/protocol.js exists
//   6. ROADMAP.md exists

"use strict";

const fs   = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

// =============================================================================
// 1. README.md content
// =============================================================================

describe("README.md", () => {
  test("README.md exists", () => {
    expect(exists("README.md")).toBe(true);
  });

  test('contains a "Quick Start" heading', () => {
    expect(read("README.md")).toMatch(/##?\s+Quick Start/i);
  });

  test('contains a "Stages" heading', () => {
    expect(read("README.md")).toMatch(/##?\s+Stages/i);
  });

  test('contains a "Hardware Matrix" heading', () => {
    expect(read("README.md")).toMatch(/##?\s+Hardware Matrix/i);
  });

  test('contains a "Troubleshooting" heading', () => {
    expect(read("README.md")).toMatch(/##?\s+Troubleshooting/i);
  });

  test('contains a "Getting Started" section', () => {
    expect(read("README.md")).toMatch(/getting started/i);
  });
});

// =============================================================================
// 2. client/gallery.html
// =============================================================================

describe("client/gallery.html", () => {
  test("exists", () => {
    expect(exists("client/gallery.html")).toBe(true);
  });

  test("contains links to all 5 stage shims", () => {
    const html = read("client/gallery.html");
    for (let i = 0; i <= 4; i++) {
      expect(html).toMatch(new RegExp(`stage-${i}-`));
    }
  });
});

// =============================================================================
// 3. Stage shim files
// =============================================================================

describe("client/stages/ — stage shim files", () => {
  const STAGE_FILES = [
    "client/stages/stage-0-setup.html",
    "client/stages/stage-1-color.html",
    "client/stages/stage-2-depth.html",
    "client/stages/stage-3-skeleton.html",
    "client/stages/stage-4-toggle.html",
  ];

  for (const file of STAGE_FILES) {
    test(`${file} exists`, () => {
      expect(exists(file)).toBe(true);
    });

    test(`${file} redirects to index.html with a ?stage= param`, () => {
      const content = read(file);
      expect(content).toMatch(/index\.html\?stage=/);
    });
  }
});

// =============================================================================
// 4. Root package.json scripts
// =============================================================================

describe("Root package.json — scripts", () => {
  let pkg;
  beforeAll(() => { pkg = JSON.parse(read("package.json")); });

  test('has a "dev" script', () => {
    expect(typeof pkg.scripts.dev).toBe("string");
  });

  test('has a "build" script', () => {
    expect(typeof pkg.scripts.build).toBe("string");
  });

  test('has an "install:server" script', () => {
    expect(typeof pkg.scripts["install:server"]).toBe("string");
  });

  test('has a "start" script', () => {
    expect(typeof pkg.scripts.start).toBe("string");
  });
});

// =============================================================================
// 5. shared/protocol.js
// =============================================================================

describe("shared/protocol.js", () => {
  test("exists", () => {
    expect(exists("shared/protocol.js")).toBe(true);
  });

  test("is non-empty (> 500 bytes)", () => {
    const size = fs.statSync(path.join(ROOT, "shared/protocol.js")).size;
    expect(size).toBeGreaterThan(500);
  });

  test("exports MESSAGE_TYPES", () => {
    const { MESSAGE_TYPES } = require("../../shared/protocol");
    expect(typeof MESSAGE_TYPES).toBe("object");
    expect(MESSAGE_TYPES).not.toBeNull();
  });

  test("exports PROTOCOL_VERSION", () => {
    const { PROTOCOL_VERSION } = require("../../shared/protocol");
    expect(typeof PROTOCOL_VERSION).toBe("string");
  });
});

// =============================================================================
// 6. ROADMAP.md
// =============================================================================

describe("ROADMAP.md", () => {
  test("exists", () => {
    expect(exists("ROADMAP.md")).toBe(true);
  });

  test("contains Phase C section", () => {
    expect(read("ROADMAP.md")).toMatch(/Phase C/i);
  });

  test("contains Phase D section", () => {
    expect(read("ROADMAP.md")).toMatch(/Phase D/i);
  });
});
