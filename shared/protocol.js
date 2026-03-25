/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

/**
 * shared/protocol.js — Single source of truth for the KinectConnect WebSocket
 * message protocol.
 *
 * Written as a UMD module so it loads without a bundler in both environments:
 *   - Node.js (server, tests): const { MESSAGE_TYPES } = require('../../shared/protocol')
 *   - Browser (client):        <script src="/shared/protocol.js"> → window.KinectProtocol
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.KinectProtocol = factory();
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : this,
  function () {
    "use strict";

    /**
     * All message type identifiers used in the WebSocket protocol.
     * Both server and client reference these constants instead of raw strings.
     */
    var MESSAGE_TYPES = Object.freeze({
      sensorInfo: "sensorInfo",
      colorFrame: "colorFrame",
      depthFrame: "depthFrame",
      bodyFrame: "bodyFrame",
      error: "error",
      switchSensor: "switchSensor",
      setQuality: "setQuality",
    });

    /**
     * Semver string that increments whenever a breaking change is made to any
     * message shape.  The server stamps this on every outgoing message; the
     * client logs a warning when the versions do not match.
     */
    var PROTOCOL_VERSION = "1.1.0";

    // -------------------------------------------------------------------------
    // Validator helpers
    // -------------------------------------------------------------------------

    /**
     * Returns true when msg looks like a valid sensorInfo message.
     * Required fields: type, version (1 | 2 | "mock"), title, features, notes
     */
    function isSensorInfoMessage(msg) {
      if (!msg || typeof msg !== "object") {
        return false;
      }
      if (msg.type !== MESSAGE_TYPES.sensorInfo) {
        return false;
      }
      if (msg.version !== 1 && msg.version !== 2 && msg.version !== "mock") {
        return false;
      }
      if (typeof msg.title !== "string") {
        return false;
      }
      if (!Array.isArray(msg.features)) {
        return false;
      }
      if (!Array.isArray(msg.notes)) {
        return false;
      }
      return true;
    }

    /**
     * Returns true when msg looks like a valid colorFrame or depthFrame message.
     * Required fields: type ("colorFrame" | "depthFrame"), width, height, data
     */
    function isFrameMessage(msg) {
      if (!msg || typeof msg !== "object") {
        return false;
      }
      if (
        msg.type !== MESSAGE_TYPES.colorFrame &&
        msg.type !== MESSAGE_TYPES.depthFrame
      ) {
        return false;
      }
      if (typeof msg.width !== "number") {
        return false;
      }
      if (typeof msg.height !== "number") {
        return false;
      }
      if (typeof msg.data !== "string") {
        return false;
      }
      return true;
    }

    /**
     * Returns true when msg looks like a valid bodyFrame message.
     * Required fields: type ("bodyFrame"), bodies (array)
     */
    function isBodyFrameMessage(msg) {
      if (!msg || typeof msg !== "object") {
        return false;
      }
      if (msg.type !== MESSAGE_TYPES.bodyFrame) {
        return false;
      }
      if (!Array.isArray(msg.bodies)) {
        return false;
      }
      return true;
    }

    /**
     * Returns true when msg looks like a valid error message.
     * Required fields: type ("error"), message (string)
     */
    function isErrorMessage(msg) {
      if (!msg || typeof msg !== "object") {
        return false;
      }
      if (msg.type !== MESSAGE_TYPES.error) {
        return false;
      }
      if (typeof msg.message !== "string") {
        return false;
      }
      return true;
    }

    /**
     * Returns true when msg looks like a valid switchSensor message.
     * Required fields: type ("switchSensor"), version (string)
     */
    function isSwitchSensorMessage(msg) {
      if (!msg || typeof msg !== "object") {
        return false;
      }
      if (msg.type !== MESSAGE_TYPES.switchSensor) {
        return false;
      }
      if (typeof msg.version !== "string") {
        return false;
      }
      return true;
    }

    /**
     * Returns true when msg looks like a valid setQuality message.
     * Required fields: type ("setQuality"), quality ("low" | "medium" | "full")
     */
    function isSetQualityMessage(msg) {
      if (!msg || typeof msg !== "object") {
        return false;
      }
      if (msg.type !== MESSAGE_TYPES.setQuality) {
        return false;
      }
      if (msg.quality !== "low" && msg.quality !== "medium" && msg.quality !== "full") {
        return false;
      }
      return true;
    }

    return {
      MESSAGE_TYPES: MESSAGE_TYPES,
      PROTOCOL_VERSION: PROTOCOL_VERSION,
      isSensorInfoMessage: isSensorInfoMessage,
      isFrameMessage: isFrameMessage,
      isBodyFrameMessage: isBodyFrameMessage,
      isErrorMessage: isErrorMessage,
      isSwitchSensorMessage: isSwitchSensorMessage,
      isSetQualityMessage: isSetQualityMessage,
    };
  }
);
