/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import { BroadcastFn, KinectAdapter, SensorInfoMessage } from "./KinectAdapter";

// The npm package "kinect" is a legacy native addon.
// It is still useful for teaching, but students may need Node 18 + npm rebuild.
// If install issues happen, use nvm-windows to switch Node versions.
// Example:
//   nvm install 18.20.4
//   nvm use 18.20.4
//   npm rebuild kinect

type LegacyKinectDevice = {
  open?: () => boolean;
  close?: () => void;
  on?: (event: "video" | "depth", cb: (frame: Buffer) => void) => void;
  start?: (stream: "video" | "depth") => void;
  stop?: (stream: "video" | "depth") => void;
  removeAllListeners?: (event?: string) => void;
};

export class Kinect1Adapter implements KinectAdapter {
  public readonly sensorVersion = 1 as const;
  public readonly title = "Kinect v1 (Xbox 360 / Kinect for Windows v1)";
  private device: LegacyKinectDevice | null = null;
  private kinectLib: unknown = null;

  public open(): boolean {
    this.kinectLib = loadKinect1Module();
    if (!this.kinectLib) {
      return false;
    }

    this.device = this.createDevice();

    if (!this.device) {
      return false;
    }

    // Some versions auto-open when constructed. Others expose open().
    if (typeof this.device.open === "function") {
      return this.device.open();
    }

    return true;
  }

  public start(broadcast: BroadcastFn): void {
    if (!this.device) {
      throw new Error("Kinect v1 device is not initialized.");
    }

    this.device.on?.("depth", (frame: Buffer) => {
      broadcast({
        type: "depthFrame",
        sensorVersion: this.sensorVersion,
        width: 640,
        height: 480,
        data: frame.toString("base64"),
      });
    });

    this.device.on?.("video", (frame: Buffer) => {
      broadcast({
        type: "colorFrame",
        sensorVersion: this.sensorVersion,
        width: 640,
        height: 480,
        data: frame.toString("base64"),
      });
    });

    this.device.start?.("depth");
    this.device.start?.("video");
  }

  public stop(): void {
    if (!this.device) {
      return;
    }

    try {
      this.device.stop?.("depth");
    } catch {
      // Stream may not be active.
    }

    try {
      this.device.stop?.("video");
    } catch {
      // Stream may not be active.
    }

    try {
      this.device.removeAllListeners?.();
    } catch {
      // Ignore cleanup issues in tutorial code.
    }

    try {
      this.device.close?.();
    } catch {
      // Device may already be closed.
    }

    this.device = null;
  }

  public getSensorInfo(): SensorInfoMessage {
    return {
      type: "sensorInfo",
      version: this.sensorVersion,
      title: this.title,
      features: [
        "Depth stream (640x480)",
        "Color stream (640x480)",
        "Motor tilt and LED control (outside this basic demo)",
      ],
      notes: [
        "In this Node.js demo, Kinect v1 skeleton tracking is not available.",
        "For Kinect v1 skeleton work, use Processing + SimpleOpenNI or OpenNI/NiTE workflows.",
        "This package is old. If install fails, use nvm-windows and Node 18, then rebuild.",
      ],
    };
  }

  private createDevice(): LegacyKinectDevice | null {
    const KinectLib = this.kinectLib as any;

    if (typeof KinectLib === "function") {
      return KinectLib() as LegacyKinectDevice;
    }

    if (KinectLib && typeof KinectLib.Kinect === "function") {
      return new KinectLib.Kinect() as LegacyKinectDevice;
    }

    return null;
  }
}

function loadKinect1Module(): unknown {
  try {
    return require("kinect");
  } catch {
    return null;
  }
}
