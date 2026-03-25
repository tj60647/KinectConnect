/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import {
  BodyData,
  BodyJoint,
  BroadcastFn,
  KinectAdapter,
  SensorInfoMessage,
} from "./KinectAdapter";

const JOINT_NAMES = [
  "spineBase",
  "spineMid",
  "neck",
  "head",
  "shoulderLeft",
  "elbowLeft",
  "wristLeft",
  "handLeft",
  "shoulderRight",
  "elbowRight",
  "wristRight",
  "handRight",
  "hipLeft",
  "kneeLeft",
  "ankleLeft",
  "footLeft",
  "hipRight",
  "kneeRight",
  "ankleRight",
  "footRight",
  "spineShoulder",
  "handTipLeft",
  "thumbLeft",
  "handTipRight",
  "thumbRight",
] as const;

export class MockAdapter implements KinectAdapter {
  public readonly sensorVersion = "mock" as const;
  public readonly title = "Mock Sensor (No Hardware Needed)";
  private depthTimer: NodeJS.Timeout | null = null;
  private colorTimer: NodeJS.Timeout | null = null;
  private bodyTimer: NodeJS.Timeout | null = null;
  private frameCount = 0;
  private quality: "low" | "medium" | "full" = "medium";

  public open(): boolean {
    return true;
  }

  public setQuality(quality: string): void {
    if (quality === "low" || quality === "medium" || quality === "full") {
      this.quality = quality;
    }
  }

  private getDepthDimensions(): { width: number; height: number } {
    if (this.quality === "low") {
      return { width: 256, height: 212 };
    }
    return { width: 512, height: 424 };
  }

  private getColorDimensions(): { width: number; height: number } {
    if (this.quality === "low") {
      return { width: 320, height: 180 };
    }
    if (this.quality === "full") {
      return { width: 1280, height: 720 };
    }
    return { width: 640, height: 360 };
  }

  public start(broadcast: BroadcastFn): void {
    // This simulation mode is useful in classrooms where only a few groups have hardware.
    this.depthTimer = setInterval(() => {
      const { width, height } = this.getDepthDimensions();
      const depth = Buffer.alloc(width * height * 2);

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 2;
          const wave = Math.sin((x + this.frameCount) * 0.04) * 0.5 + 0.5;
          const band = Math.sin((y + this.frameCount) * 0.03) * 0.5 + 0.5;
          const mm = 500 + Math.floor((wave * 0.6 + band * 0.4) * 3500);
          depth.writeUInt16LE(mm, index);
        }
      }

      broadcast({
        type: "depthFrame",
        sensorVersion: this.sensorVersion,
        width,
        height,
        data: depth.toString("base64"),
      });

      this.frameCount += 1;
    }, 33);

    this.colorTimer = setInterval(() => {
      const { width, height } = this.getColorDimensions();
      const rgba = Buffer.alloc(width * height * 4);

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const i = (y * width + x) * 4;
          rgba[i] = (x + this.frameCount) % 255;
          rgba[i + 1] = (y * 2) % 255;
          rgba[i + 2] = (x + y + this.frameCount * 2) % 255;
          rgba[i + 3] = 255;
        }
      }

      broadcast({
        type: "colorFrame",
        sensorVersion: this.sensorVersion,
        width,
        height,
        data: rgba.toString("base64"),
      });
    }, 33);

    this.bodyTimer = setInterval(() => {
      const t = this.frameCount * 0.03;
      const centerX = 0.5 + Math.sin(t) * 0.1;
      const centerY = 0.55;

      const body: BodyData = {
        tracked: true,
        trackingId: 1,
        handLeftState: 2,
        handRightState: Math.sin(t * 2) > 0.2 ? 3 : 2,
        joints: this.makeJoints(centerX, centerY, t),
      };

      broadcast({
        type: "bodyFrame",
        sensorVersion: this.sensorVersion,
        bodies: [body],
      });
    }, 50);
  }

  public stop(): void {
    if (this.depthTimer) {
      clearInterval(this.depthTimer);
      this.depthTimer = null;
    }

    if (this.colorTimer) {
      clearInterval(this.colorTimer);
      this.colorTimer = null;
    }

    if (this.bodyTimer) {
      clearInterval(this.bodyTimer);
      this.bodyTimer = null;
    }
  }

  public getSensorInfo(): SensorInfoMessage {
    return {
      type: "sensorInfo",
      version: this.sensorVersion,
      title: this.title,
      features: [
        "Synthetic depth frames",
        "Synthetic color frames",
        "Synthetic body joints for skeleton rendering",
      ],
      notes: [
        "Use this mode when hardware is unavailable.",
        "This is only for learning rendering and interaction logic.",
      ],
    };
  }

  private makeJoints(cx: number, cy: number, t: number): BodyJoint[] {
    const map = new Map<string, BodyJoint>();
    const set = (name: string, x: number, y: number, z: number) => {
      map.set(name, { name, x, y, z, tracked: true });
    };

    set("head", cx, cy - 0.25, 1.5);
    set("neck", cx, cy - 0.2, 1.5);
    set("spineShoulder", cx, cy - 0.15, 1.6);
    set("spineMid", cx, cy - 0.05, 1.7);
    set("spineBase", cx, cy + 0.1, 1.8);

    set("shoulderLeft", cx - 0.08, cy - 0.15, 1.6);
    set("elbowLeft", cx - 0.13, cy - 0.08, 1.65);
    set("wristLeft", cx - 0.16, cy - 0.02, 1.7);
    set("handLeft", cx - 0.18, cy + 0.02, 1.72);
    set("handTipLeft", cx - 0.2, cy + 0.02, 1.72);
    set("thumbLeft", cx - 0.17, cy + 0.01, 1.72);

    const rightLift = Math.sin(t * 2) > 0.2 ? -0.22 : -0.05;
    set("shoulderRight", cx + 0.08, cy - 0.15, 1.6);
    set("elbowRight", cx + 0.13, cy - 0.1 + rightLift * 0.4, 1.6);
    set("wristRight", cx + 0.16, cy - 0.02 + rightLift * 0.8, 1.6);
    set("handRight", cx + 0.18, cy + rightLift, 1.6);
    set("handTipRight", cx + 0.2, cy + rightLift, 1.6);
    set("thumbRight", cx + 0.17, cy + rightLift + 0.01, 1.6);

    set("hipLeft", cx - 0.05, cy + 0.1, 1.8);
    set("kneeLeft", cx - 0.05, cy + 0.23, 1.9);
    set("ankleLeft", cx - 0.05, cy + 0.34, 2.0);
    set("footLeft", cx - 0.05, cy + 0.37, 2.0);

    set("hipRight", cx + 0.05, cy + 0.1, 1.8);
    set("kneeRight", cx + 0.05, cy + 0.23, 1.9);
    set("ankleRight", cx + 0.05, cy + 0.34, 2.0);
    set("footRight", cx + 0.05, cy + 0.37, 2.0);

    return JOINT_NAMES.map((name) => {
      const joint = map.get(name);
      return joint ?? { name, x: 0, y: 0, z: 0, tracked: false };
    });
  }
}
