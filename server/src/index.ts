/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import express from "express";
import * as fs from "fs";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import path from "path";
import { KinectAdapter, OutgoingMessage, SensorVersion } from "./KinectAdapter";
import { Kinect1Adapter } from "./Kinect1Adapter";
import { Kinect2Adapter } from "./Kinect2Adapter";
import { MockAdapter } from "./MockAdapter";
import { MjpegBroadcaster } from "./MjpegBroadcaster";
import { WebSocketBroadcaster } from "./WebSocketBroadcaster";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isSwitchSensorMessage } = require("../../shared/protocol") as {
  isSwitchSensorMessage: (value: unknown) => value is { type: "switchSensor"; version: string };
};

const PORT = Number(process.env.PORT ?? 3000);
const requestedVersion = parseSensorVersion(process.env.KINECT_VERSION ?? "2");

const app = express();
const tlsCert = process.env.TLS_CERT;
const tlsKey = process.env.TLS_KEY;
const useTls = !!(tlsCert && tlsKey);

function createTlsServer() {
  try {
    return createHttpsServer(
      { cert: fs.readFileSync(tlsCert!), key: fs.readFileSync(tlsKey!) },
      app
    );
  } catch (err) {
    console.error(
      `[KinectConnect] Failed to read TLS files (TLS_CERT=${tlsCert}, TLS_KEY=${tlsKey}): ${(err as Error).message}`
    );
    process.exit(1);
  }
}

const server = useTls ? createTlsServer() : createHttpServer(app);

const broadcaster = new WebSocketBroadcaster(server);
const mjpeg = new MjpegBroadcaster();

app.use(express.static(path.resolve(__dirname, "../../client")));
app.use("/shared", express.static(path.resolve(__dirname, "../../shared")));

// Color frames are served as MJPEG (multipart JPEG) over a plain HTTP stream.
// The browser renders it natively in an <img> element — no WebSocket or JS decoder needed.
app.get("/stream/color", (_req, res) => {
  mjpeg.addClient(res);
});

// Route frames: color goes to MJPEG HTTP stream, everything else over WebSocket.
// This keeps large video data off the WebSocket and prevents heap exhaustion.
function routeFrame(message: OutgoingMessage): void {
  if (message.type === "colorFrame") {
    mjpeg.pushFrame(message);
  } else {
    broadcaster.broadcast(message);
  }
}

let adapter = createAdapter(requestedVersion);
initializeAdapter(adapter, requestedVersion);

// When a new client connects, immediately send them the current sensor state so
// their UI syncs without needing to request it or trigger a server-side adapter switch.
broadcaster.onClientJoined((sendToClient) => {
  sendToClient(adapter.getSensorInfo());
});

// Handle explicit sensor-switch requests from clients (e.g. Stage 4 toggle buttons).
broadcaster.onClientMessage((message) => {
  if (!isSwitchSensorMessage(message)) {
    return;
  }

  const nextVersion = parseSensorVersion(String(message.version));
  switchAdapter(nextVersion);
});

server.listen(PORT, () => {
  const scheme = useTls ? "https" : "http";
  const wsScheme = useTls ? "wss" : "ws";
  console.log(`KinectConnect server listening on ${scheme}://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ${wsScheme}://localhost:${PORT}`);
  console.log(`Requested startup sensor: ${requestedVersion}`);
  console.log("Setup notes:");
  console.log("- Kinect v2 mode needs Windows + Kinect for Windows SDK 2.0 + USB 3.0.");
  console.log("- Kinect v1 npm package is legacy. If needed, use nvm-windows with Node 18.");
  console.log("- If hardware is unavailable, use KINECT_VERSION=mock.");
  if (!useTls) {
    console.log("- TLS is off. Set TLS_CERT and TLS_KEY env vars to enable wss://.");
  }
});

function switchAdapter(version: SensorVersion): void {
  console.log(`[KinectConnect] Sensor switch requested → version: ${version}`);
  const next = createAdapter(version);

  try {
    adapter.stop();
  } catch {
    // If cleanup fails, keep moving for a classroom-friendly workflow.
  }

  adapter = next;
  initializeAdapter(adapter, version);
}

function initializeAdapter(nextAdapter: KinectAdapter, requested: SensorVersion): void {
  const opened = nextAdapter.open();

  if (!opened) {
    const sdkHint = getKinectSdkHint(requested);
    const fallback = new MockAdapter();
    fallback.open();
    fallback.start(routeFrame);
    adapter = fallback;

    if (sdkHint) {
      console.warn(`[KinectConnect] ${sdkHint}`);
    }

    broadcaster.broadcast({
      type: "error",
      message: sdkHint
        ? `Could not open ${nextAdapter.title}. ${sdkHint} Switched to Mock mode so the tutorial can continue.`
        : `Could not open ${nextAdapter.title}. Switched to Mock mode so the tutorial can continue.`,
    });

    broadcaster.broadcast(adapter.getSensorInfo());
    return;
  }

  nextAdapter.start(routeFrame);
  broadcaster.broadcast(nextAdapter.getSensorInfo());
  console.log(`[KinectConnect] ${nextAdapter.title} is active.`);
}

function createAdapter(version: SensorVersion): KinectAdapter {
  if (version === 1) {
    return new Kinect1Adapter();
  }

  if (version === 2) {
    return new Kinect2Adapter();
  }

  return new MockAdapter();
}

function parseSensorVersion(value: string): SensorVersion {
  if (value === "1") {
    return 1;
  }

  if (value === "2") {
    return 2;
  }

  return "mock";
}

function getKinectSdkHint(requested: SensorVersion): string | null {
  if (requested === "mock") {
    return null;
  }

  if (process.platform !== "win32") {
    return "Kinect hardware requires Windows and the matching Kinect SDK.";
  }

  if (requested === 2) {
    const hasSdk = !!process.env.KINECTSDK20_DIR;
    if (!hasSdk) {
      return "Kinect SDK 2.0 may be missing. Install Kinect for Windows SDK 2.0 and reconnect the sensor.";
    }
    return null;
  }

  const hasSdk = !!process.env.KINECTSDK10_DIR;
  if (!hasSdk) {
    return "Kinect SDK 1.8 may be missing. Install Kinect for Windows SDK 1.8 and reconnect the sensor.";
  }

  return null;
}
