/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

declare module "kinect2" {
  namespace Kinect2 {
    enum JointType {
      spineBase = 0,
      spineMid = 1,
      neck = 2,
      head = 3,
      shoulderLeft = 4,
      elbowLeft = 5,
      wristLeft = 6,
      handLeft = 7,
      shoulderRight = 8,
      elbowRight = 9,
      wristRight = 10,
      handRight = 11,
      hipLeft = 12,
      kneeLeft = 13,
      ankleLeft = 14,
      footLeft = 15,
      hipRight = 16,
      kneeRight = 17,
      ankleRight = 18,
      footRight = 19,
      spineShoulder = 20,
      handTipLeft = 21,
      thumbLeft = 22,
      handTipRight = 23,
      thumbRight = 24
    }

    interface Joint {
      depthX: number;
      depthY: number;
      colorX: number;
      colorY: number;
      cameraX: number;
      cameraY: number;
      cameraZ: number;
      orientationW: number;
      orientationX: number;
      orientationY: number;
      orientationZ: number;
      trackingState: number;
    }

    interface Body {
      tracked: boolean;
      trackingId: number;
      handLeftState: number;
      handRightState: number;
      joints: Joint[];
    }

    interface BodyFrame {
      bodies: Body[];
      floorClipPlane: { x: number; y: number; z: number; w: number };
    }
  }

  class Kinect2 {
    static JointType: typeof Kinect2.JointType;
    open(): boolean;
    close(): void;
    openBodyReader(): void;
    openColorReader(): void;
    openDepthReader(): void;
    closeBodyReader(): void;
    closeColorReader(): void;
    closeDepthReader(): void;
    on(event: "bodyFrame", cb: (frame: Kinect2.BodyFrame) => void): this;
    on(event: "colorFrame", cb: (frame: Buffer) => void): this;
    on(event: "depthFrame", cb: (frame: Buffer) => void): this;
    removeAllListeners(event?: string): this;
  }

  export = Kinect2;
}
