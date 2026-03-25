/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

export type SensorVersion = 1 | 2 | "mock";

export interface SensorInfoMessage {
  type: "sensorInfo";
  version: SensorVersion;
  title: string;
  features: string[];
  notes: string[];
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface DepthFrameMessage {
  type: "depthFrame";
  sensorVersion: SensorVersion;
  width: number;
  height: number;
  data: string;
}

export interface ColorFrameMessage {
  type: "colorFrame";
  sensorVersion: SensorVersion;
  width: number;
  height: number;
  data: string;
}

export interface BodyJoint {
  name: string;
  x: number;
  y: number;
  z: number;
  tracked: boolean;
}

export interface BodyData {
  tracked: boolean;
  trackingId?: number;
  handLeftState?: number;
  handRightState?: number;
  joints: BodyJoint[];
}

export interface BodyFrameMessage {
  type: "bodyFrame";
  sensorVersion: SensorVersion;
  bodies: BodyData[];
}

export type OutgoingMessage =
  | SensorInfoMessage
  | ErrorMessage
  | DepthFrameMessage
  | ColorFrameMessage
  | BodyFrameMessage;

export type BroadcastFn = (message: OutgoingMessage) => void;

export interface KinectAdapter {
  readonly sensorVersion: SensorVersion;
  readonly title: string;
  open(): boolean;
  start(broadcast: BroadcastFn): void;
  stop(): void;
  getSensorInfo(): SensorInfoMessage;
  setQuality?(quality: string): void;
}
