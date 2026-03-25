// =============================================================================
// File:    tests/protocol.test.js
// Project: KinectConnect
//
// Authors: Copilot
//          Thomas J McLeish
// License: MIT — see LICENSE in the root of this repository
// =============================================================================
//
// Tests for shared/protocol.js — the single source of truth for every
// WebSocket message shape used between the Node.js server and the browser
// client.
//
// Checks:
//   1. MESSAGE_TYPES — all values are strings; all expected keys are present
//   2. PROTOCOL_VERSION — is a valid semver string
//   3. isSensorInfoMessage — accepts / rejects correctly shaped objects
//   4. isFrameMessage — accepts colorFrame and depthFrame; rejects others
//   5. isBodyFrameMessage — accepts / rejects
//   6. isErrorMessage — accepts / rejects
//   7. isSwitchSensorMessage — accepts / rejects

"use strict";

const {
  MESSAGE_TYPES,
  PROTOCOL_VERSION,
  isSensorInfoMessage,
  isFrameMessage,
  isBodyFrameMessage,
  isErrorMessage,
  isSwitchSensorMessage,
} = require("../../shared/protocol");

// =============================================================================
// 1. MESSAGE_TYPES
// =============================================================================

describe("MESSAGE_TYPES", () => {
  const EXPECTED_KEYS = [
    "sensorInfo",
    "colorFrame",
    "depthFrame",
    "bodyFrame",
    "error",
    "switchSensor",
  ];

  for (const key of EXPECTED_KEYS) {
    test(`MESSAGE_TYPES.${key} is a non-empty string`, () => {
      expect(typeof MESSAGE_TYPES[key]).toBe("string");
      expect(MESSAGE_TYPES[key].length).toBeGreaterThan(0);
    });
  }

  test("MESSAGE_TYPES is frozen (immutable)", () => {
    expect(Object.isFrozen(MESSAGE_TYPES)).toBe(true);
  });
});

// =============================================================================
// 2. PROTOCOL_VERSION
// =============================================================================

describe("PROTOCOL_VERSION", () => {
  test("is a string", () => {
    expect(typeof PROTOCOL_VERSION).toBe("string");
  });

  test("matches semver format (MAJOR.MINOR.PATCH)", () => {
    // Basic semver: digits separated by exactly two dots.
    expect(PROTOCOL_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// =============================================================================
// 3. isSensorInfoMessage
// =============================================================================

describe("isSensorInfoMessage()", () => {
  const valid = {
    type: "sensorInfo",
    version: "mock",
    title: "Mock Sensor",
    features: ["depth", "color"],
    notes: ["no hardware needed"],
  };

  test("accepts a fully valid sensorInfo message", () => {
    expect(isSensorInfoMessage(valid)).toBe(true);
  });

  test("accepts version === 1 (Kinect v1)", () => {
    expect(isSensorInfoMessage({ ...valid, version: 1 })).toBe(true);
  });

  test("accepts version === 2 (Kinect v2)", () => {
    expect(isSensorInfoMessage({ ...valid, version: 2 })).toBe(true);
  });

  test('accepts version === "mock"', () => {
    expect(isSensorInfoMessage({ ...valid, version: "mock" })).toBe(true);
  });

  test("rejects null", () => {
    expect(isSensorInfoMessage(null)).toBe(false);
  });

  test("rejects a plain string", () => {
    expect(isSensorInfoMessage("sensorInfo")).toBe(false);
  });

  test("rejects wrong type value", () => {
    expect(isSensorInfoMessage({ ...valid, type: "colorFrame" })).toBe(false);
  });

  test("rejects invalid version", () => {
    expect(isSensorInfoMessage({ ...valid, version: "3" })).toBe(false);
  });

  test("rejects missing title", () => {
    const { title, ...rest } = valid;
    expect(isSensorInfoMessage(rest)).toBe(false);
  });

  test("rejects non-array features", () => {
    expect(isSensorInfoMessage({ ...valid, features: "depth" })).toBe(false);
  });

  test("rejects missing notes", () => {
    const { notes, ...rest } = valid;
    expect(isSensorInfoMessage(rest)).toBe(false);
  });
});

// =============================================================================
// 4. isFrameMessage
// =============================================================================

describe("isFrameMessage()", () => {
  const validColor = {
    type: "colorFrame",
    width: 640,
    height: 360,
    data: "base64data==",
    sensorVersion: "mock",
  };

  const validDepth = {
    type: "depthFrame",
    width: 512,
    height: 424,
    data: "base64depth==",
    sensorVersion: "mock",
  };

  test("accepts a valid colorFrame message", () => {
    expect(isFrameMessage(validColor)).toBe(true);
  });

  test("accepts a valid depthFrame message", () => {
    expect(isFrameMessage(validDepth)).toBe(true);
  });

  test("rejects bodyFrame type", () => {
    expect(isFrameMessage({ ...validColor, type: "bodyFrame" })).toBe(false);
  });

  test("rejects null", () => {
    expect(isFrameMessage(null)).toBe(false);
  });

  test("rejects missing width", () => {
    const { width, ...rest } = validColor;
    expect(isFrameMessage(rest)).toBe(false);
  });

  test("rejects missing height", () => {
    const { height, ...rest } = validColor;
    expect(isFrameMessage(rest)).toBe(false);
  });

  test("rejects missing data", () => {
    const { data, ...rest } = validColor;
    expect(isFrameMessage(rest)).toBe(false);
  });

  test("rejects non-string data", () => {
    expect(isFrameMessage({ ...validColor, data: 12345 })).toBe(false);
  });
});

// =============================================================================
// 5. isBodyFrameMessage
// =============================================================================

describe("isBodyFrameMessage()", () => {
  const valid = {
    type: "bodyFrame",
    sensorVersion: "mock",
    bodies: [{ tracked: true, joints: [] }],
  };

  test("accepts a valid bodyFrame message", () => {
    expect(isBodyFrameMessage(valid)).toBe(true);
  });

  test("accepts an empty bodies array", () => {
    expect(isBodyFrameMessage({ ...valid, bodies: [] })).toBe(true);
  });

  test("rejects null", () => {
    expect(isBodyFrameMessage(null)).toBe(false);
  });

  test("rejects wrong type", () => {
    expect(isBodyFrameMessage({ ...valid, type: "depthFrame" })).toBe(false);
  });

  test("rejects non-array bodies", () => {
    expect(isBodyFrameMessage({ ...valid, bodies: "[]" })).toBe(false);
  });

  test("rejects missing bodies", () => {
    expect(isBodyFrameMessage({ type: "bodyFrame" })).toBe(false);
  });
});

// =============================================================================
// 6. isErrorMessage
// =============================================================================

describe("isErrorMessage()", () => {
  const valid = { type: "error", message: "something went wrong" };

  test("accepts a valid error message", () => {
    expect(isErrorMessage(valid)).toBe(true);
  });

  test("rejects null", () => {
    expect(isErrorMessage(null)).toBe(false);
  });

  test("rejects wrong type", () => {
    expect(isErrorMessage({ ...valid, type: "sensorInfo" })).toBe(false);
  });

  test("rejects missing message field", () => {
    expect(isErrorMessage({ type: "error" })).toBe(false);
  });

  test("rejects non-string message field", () => {
    expect(isErrorMessage({ type: "error", message: 42 })).toBe(false);
  });
});

// =============================================================================
// 7. isSwitchSensorMessage
// =============================================================================

describe("isSwitchSensorMessage()", () => {
  const valid = { type: "switchSensor", version: "2" };

  test("accepts a valid switchSensor message", () => {
    expect(isSwitchSensorMessage(valid)).toBe(true);
  });

  test('accepts version "1"', () => {
    expect(isSwitchSensorMessage({ type: "switchSensor", version: "1" })).toBe(true);
  });

  test('accepts version "mock"', () => {
    expect(isSwitchSensorMessage({ type: "switchSensor", version: "mock" })).toBe(true);
  });

  test("rejects null", () => {
    expect(isSwitchSensorMessage(null)).toBe(false);
  });

  test("rejects wrong type", () => {
    expect(isSwitchSensorMessage({ type: "error", version: "2" })).toBe(false);
  });

  test("rejects missing version", () => {
    expect(isSwitchSensorMessage({ type: "switchSensor" })).toBe(false);
  });

  test("rejects non-string version", () => {
    expect(isSwitchSensorMessage({ type: "switchSensor", version: 2 })).toBe(false);
  });
});

// =============================================================================
// 8. isSetQualityMessage  (Phase F)
// =============================================================================

const { isSetQualityMessage } = require("../../shared/protocol");

describe("isSetQualityMessage()", () => {
  const valid = { type: "setQuality", quality: "medium" };

  test('accepts a valid setQuality message with quality "low"', () => {
    expect(isSetQualityMessage({ type: "setQuality", quality: "low" })).toBe(true);
  });

  test('accepts a valid setQuality message with quality "medium"', () => {
    expect(isSetQualityMessage(valid)).toBe(true);
  });

  test('accepts a valid setQuality message with quality "full"', () => {
    expect(isSetQualityMessage({ type: "setQuality", quality: "full" })).toBe(true);
  });

  test("rejects null", () => {
    expect(isSetQualityMessage(null)).toBe(false);
  });

  test("rejects wrong type", () => {
    expect(isSetQualityMessage({ type: "switchSensor", quality: "medium" })).toBe(false);
  });

  test('rejects invalid quality value "ultra"', () => {
    expect(isSetQualityMessage({ type: "setQuality", quality: "ultra" })).toBe(false);
  });

  test("rejects missing quality field", () => {
    expect(isSetQualityMessage({ type: "setQuality" })).toBe(false);
  });
});

// MESSAGE_TYPES.setQuality is present (Phase F)
describe("MESSAGE_TYPES.setQuality (Phase F)", () => {
  test("MESSAGE_TYPES.setQuality is a non-empty string", () => {
    expect(typeof MESSAGE_TYPES.setQuality).toBe("string");
    expect(MESSAGE_TYPES.setQuality.length).toBeGreaterThan(0);
  });
});
