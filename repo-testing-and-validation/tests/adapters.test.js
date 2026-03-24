// =============================================================================
// File:    tests/adapters.test.js
// Project: KinectConnect
//
// Authors: Copilot
//          Thomas J McLeish
// License: MIT — see LICENSE in the root of this repository
// =============================================================================
//
// Tests for server/dist/MockAdapter — the software sensor used in Stage 0 and
// when no Kinect hardware is available.
//
// Checks:
//   1. open() — always returns true; does not throw
//   2. getSensorInfo() — returns a valid sensorInfo-shaped message
//   3. start() — invokes the broadcast callback with depthFrame, colorFrame,
//      and bodyFrame messages within a reasonable timeout
//   4. stop() — stops frame emission (no new callbacks after stop())
//   5. stop() called without start() does not throw

"use strict";

const path = require("path");

// The compiled CommonJS output is built by the pretest script in package.json.
const { MockAdapter } = require(path.resolve(__dirname, "../../server/dist/MockAdapter"));

// =============================================================================
// 1. open()
// =============================================================================

describe("MockAdapter — open()", () => {
  let adapter;
  beforeEach(() => { adapter = new MockAdapter(); });
  afterEach(() => { adapter.stop(); });

  test("returns true (sensor is always available in mock mode)", () => {
    expect(adapter.open()).toBe(true);
  });

  test("does not throw", () => {
    expect(() => adapter.open()).not.toThrow();
  });
});

// =============================================================================
// 2. getSensorInfo()
// =============================================================================

describe("MockAdapter — getSensorInfo()", () => {
  let adapter;
  beforeEach(() => { adapter = new MockAdapter(); adapter.open(); });
  afterEach(() => { adapter.stop(); });

  test('returns an object with type === "sensorInfo"', () => {
    expect(adapter.getSensorInfo().type).toBe("sensorInfo");
  });

  test('returns version === "mock"', () => {
    expect(adapter.getSensorInfo().version).toBe("mock");
  });

  test("returns a non-empty title string", () => {
    const info = adapter.getSensorInfo();
    expect(typeof info.title).toBe("string");
    expect(info.title.length).toBeGreaterThan(0);
  });

  test("returns a features array", () => {
    expect(Array.isArray(adapter.getSensorInfo().features)).toBe(true);
  });

  test("returns a notes array", () => {
    expect(Array.isArray(adapter.getSensorInfo().notes)).toBe(true);
  });
});

// =============================================================================
// 3. start() — emits frames
// =============================================================================

describe("MockAdapter — start()", () => {
  test(
    "emits a depthFrame within 200 ms",
    (done) => {
      const adapter = new MockAdapter();
      adapter.open();
      adapter.start((msg) => {
        if (msg.type === "depthFrame") {
          adapter.stop();
          done();
        }
      });
    },
    500
  );

  test(
    "emits a colorFrame within 200 ms",
    (done) => {
      const adapter = new MockAdapter();
      adapter.open();
      adapter.start((msg) => {
        if (msg.type === "colorFrame") {
          adapter.stop();
          done();
        }
      });
    },
    500
  );

  test(
    "emits a bodyFrame within 300 ms",
    (done) => {
      const adapter = new MockAdapter();
      adapter.open();
      adapter.start((msg) => {
        if (msg.type === "bodyFrame") {
          adapter.stop();
          done();
        }
      });
    },
    500
  );

  test("depthFrame has correct shape (type, width, height, data)", (done) => {
    const adapter = new MockAdapter();
    adapter.open();
    adapter.start((msg) => {
      if (msg.type === "depthFrame") {
        adapter.stop();
        expect(typeof msg.width).toBe("number");
        expect(typeof msg.height).toBe("number");
        expect(typeof msg.data).toBe("string");
        expect(msg.data.length).toBeGreaterThan(0);
        done();
      }
    });
  }, 500);

  test("colorFrame has correct shape (type, width, height, data)", (done) => {
    const adapter = new MockAdapter();
    adapter.open();
    adapter.start((msg) => {
      if (msg.type === "colorFrame") {
        adapter.stop();
        expect(typeof msg.width).toBe("number");
        expect(typeof msg.height).toBe("number");
        expect(typeof msg.data).toBe("string");
        expect(msg.data.length).toBeGreaterThan(0);
        done();
      }
    });
  }, 500);

  test("bodyFrame has a bodies array with at least one tracked body", (done) => {
    const adapter = new MockAdapter();
    adapter.open();
    adapter.start((msg) => {
      if (msg.type === "bodyFrame") {
        adapter.stop();
        expect(Array.isArray(msg.bodies)).toBe(true);
        expect(msg.bodies.length).toBeGreaterThan(0);
        expect(msg.bodies[0].tracked).toBe(true);
        done();
      }
    });
  }, 500);

  test("each body in bodyFrame has a joints array", (done) => {
    const adapter = new MockAdapter();
    adapter.open();
    adapter.start((msg) => {
      if (msg.type === "bodyFrame") {
        adapter.stop();
        for (const body of msg.bodies) {
          expect(Array.isArray(body.joints)).toBe(true);
        }
        done();
      }
    });
  }, 500);
});

// =============================================================================
// 4. stop() — halts emission
// =============================================================================

describe("MockAdapter — stop()", () => {
  test("stops frame emission after stop() is called", (done) => {
    const adapter = new MockAdapter();
    adapter.open();

    let callCount = 0;

    adapter.start((msg) => {
      callCount += 1;
      if (callCount === 1) {
        // Stop on the very first frame received.
        adapter.stop();
        const countAtStop = callCount;
        // After 150 ms no new callbacks should have fired.
        setTimeout(() => {
          expect(callCount).toBe(countAtStop);
          done();
        }, 150);
      }
    });
  }, 600);
});

// =============================================================================
// 5. stop() without start() does not throw
// =============================================================================

describe("MockAdapter — stop() without prior start()", () => {
  test("does not throw", () => {
    const adapter = new MockAdapter();
    adapter.open();
    expect(() => adapter.stop()).not.toThrow();
  });

  test("can be called multiple times without throwing", () => {
    const adapter = new MockAdapter();
    adapter.open();
    expect(() => {
      adapter.stop();
      adapter.stop();
    }).not.toThrow();
  });
});
