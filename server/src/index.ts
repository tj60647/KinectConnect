/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import express from "express";
import { createServer } from "http";
import path from "path";
import { KinectAdapter, SensorVersion } from "./KinectAdapter";
import { Kinect1Adapter } from "./Kinect1Adapter";
import { Kinect2Adapter } from "./Kinect2Adapter";
import { MockAdapter } from "./MockAdapter";
import { WebSocketBroadcaster } from "./WebSocketBroadcaster";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isSwitchSensorMessage } = require("../../shared/protocol") as {
  isSwitchSensorMessage: (value: unknown) => value is { type: "switchSensor"; version: string };
};

const PORT = Number(process.env.PORT ?? 3000);
const requestedVersion = parseSensorVersion(process.env.KINECT_VERSION ?? "2");

const app = express();
const server = createServer(app);
const broadcaster = new WebSocketBroadcaster(server);

app.use(express.static(path.resolve(__dirname, "../../client")));
app.use("/shared", express.static(path.resolve(__dirname, "../../shared")));

let adapter = createAdapter(requestedVersion);
initializeAdapter(adapter);

broadcaster.onClientConnected((message) => {
  if (!isSwitchSensorMessage(message)) {
    return;
  }

  const nextVersion = parseSensorVersion(String(message.version));
  switchAdapter(nextVersion);
});

server.listen(PORT, () => {
  console.log(`KinectConnect server listening on http://localhost:${PORT}`);
  console.log(`Requested startup sensor: ${requestedVersion}`);
  console.log("Setup notes:");
  console.log("- Kinect v2 mode needs Windows + Kinect for Windows SDK 2.0 + USB 3.0.");
  console.log("- Kinect v1 npm package is legacy. If needed, use nvm-windows with Node 18.");
  console.log("- If hardware is unavailable, use KINECT_VERSION=mock.");
});

function switchAdapter(version: SensorVersion): void {
  const next = createAdapter(version);

  try {
    adapter.stop();
  } catch {
    // If cleanup fails, keep moving for a classroom-friendly workflow.
  }

  adapter = next;
  initializeAdapter(adapter);
}

function initializeAdapter(nextAdapter: KinectAdapter): void {
  const opened = nextAdapter.open();

  if (!opened) {
    const fallback = new MockAdapter();
    fallback.open();
    fallback.start((message) => broadcaster.broadcast(message));
    adapter = fallback;

    broadcaster.broadcast({
      type: "error",
      message:
        `Could not open ${nextAdapter.title}. Switched to Mock mode so the tutorial can continue.`,
    });

    broadcaster.broadcast(adapter.getSensorInfo());
    return;
  }

  nextAdapter.start((message) => broadcaster.broadcast(message));
  broadcaster.broadcast(nextAdapter.getSensorInfo());
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
