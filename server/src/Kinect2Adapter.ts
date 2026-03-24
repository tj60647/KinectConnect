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

type Kinect2Joint = {
  depthX: number;
  depthY: number;
  cameraZ: number;
  trackingState: number;
};

type Kinect2Body = {
  tracked: boolean;
  trackingId: number;
  handLeftState: number;
  handRightState: number;
  joints: Kinect2Joint[];
};

type Kinect2BodyFrame = {
  bodies: Kinect2Body[];
};

interface Kinect2RuntimeInstance {
  open: () => boolean;
  close: () => void;
  openBodyReader: () => void;
  openColorReader: () => void;
  openDepthReader: () => void;
  closeBodyReader: () => void;
  closeColorReader: () => void;
  closeDepthReader: () => void;
  on(event: "bodyFrame", cb: (frame: Kinect2BodyFrame) => void): void;
  on(event: "colorFrame", cb: (frame: Buffer) => void): void;
  on(event: "depthFrame", cb: (frame: Buffer) => void): void;
  removeAllListeners: () => void;
}

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

export class Kinect2Adapter implements KinectAdapter {
  public readonly sensorVersion = 2 as const;
  public readonly title = "Kinect v2 (Xbox One / Kinect for Windows v2)";
  private kinect: Kinect2RuntimeInstance | null = null;

  public constructor() {}

  public open(): boolean {
    const Kinect2Runtime = loadKinect2Module();
    if (!Kinect2Runtime) {
      return false;
    }

    this.kinect = new Kinect2Runtime();

    // Kinect v2 requires Windows + Kinect for Windows SDK 2.0 + USB 3.0.
    return this.kinect.open();
  }

  public start(broadcast: BroadcastFn): void {
    if (!this.kinect) {
      throw new Error("Kinect v2 module is not available.");
    }

    this.kinect.on("depthFrame", (frame: Buffer) => {
      broadcast({
        type: "depthFrame",
        sensorVersion: this.sensorVersion,
        width: 512,
        height: 424,
        data: frame.toString("base64"),
      });
    });

    this.kinect.on("colorFrame", (frame: Buffer) => {
      broadcast({
        type: "colorFrame",
        sensorVersion: this.sensorVersion,
        width: 1920,
        height: 1080,
        data: frame.toString("base64"),
      });
    });

    this.kinect.on("bodyFrame", (frame: Kinect2BodyFrame) => {
      const trackedBodies: BodyData[] = frame.bodies
        .filter((body) => body.tracked)
        .map((body) => ({
          tracked: body.tracked,
          trackingId: body.trackingId,
          handLeftState: body.handLeftState,
          handRightState: body.handRightState,
          joints: this.mapJoints(body.joints),
        }));

      broadcast({
        type: "bodyFrame",
        sensorVersion: this.sensorVersion,
        bodies: trackedBodies,
      });
    });

    this.kinect.openDepthReader();
    this.kinect.openColorReader();
    this.kinect.openBodyReader();
  }

  public stop(): void {
    if (!this.kinect) {
      return;
    }

    this.kinect.removeAllListeners();

    try {
      this.kinect.closeDepthReader();
    } catch {
      // Reader may already be closed.
    }

    try {
      this.kinect.closeColorReader();
    } catch {
      // Reader may already be closed.
    }

    try {
      this.kinect.closeBodyReader();
    } catch {
      // Reader may already be closed.
    }

    try {
      this.kinect.close();
    } catch {
      // Device may already be closed.
    }

    this.kinect = null;
  }

  public getSensorInfo(): SensorInfoMessage {
    return {
      type: "sensorInfo",
      version: this.sensorVersion,
      title: this.title,
      features: [
        "Depth stream (512x424)",
        "Color stream (1920x1080)",
        "Skeleton tracking (25 joints, up to 6 people)",
        "Basic hand-state gesture signals",
      ],
      notes: [
        "Requires Windows and Kinect for Windows SDK 2.0.",
        "Kinect v2 must be connected to USB 3.0.",
      ],
    };
  }

  private mapJoints(joints: Kinect2Joint[]): BodyJoint[] {
    return joints.map((joint, index) => ({
      name: JOINT_NAMES[index] ?? `joint-${index}`,
      x: joint.depthX,
      y: joint.depthY,
      z: joint.cameraZ,
      tracked: joint.trackingState > 0,
    }));
  }
}

function loadKinect2Module(): (new () => Kinect2RuntimeInstance) | null {
  try {
    return require("kinect2") as new () => Kinect2RuntimeInstance;
  } catch {
    return null;
  }
}
