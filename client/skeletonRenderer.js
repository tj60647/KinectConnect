/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

(function attachSkeletonRenderer(global) {
  const BONES = [
    ["head", "neck"],
    ["neck", "spineShoulder"],
    ["spineShoulder", "spineMid"],
    ["spineMid", "spineBase"],
    ["spineShoulder", "shoulderLeft"],
    ["shoulderLeft", "elbowLeft"],
    ["elbowLeft", "wristLeft"],
    ["wristLeft", "handLeft"],
    ["spineShoulder", "shoulderRight"],
    ["shoulderRight", "elbowRight"],
    ["elbowRight", "wristRight"],
    ["wristRight", "handRight"],
    ["spineBase", "hipLeft"],
    ["hipLeft", "kneeLeft"],
    ["kneeLeft", "ankleLeft"],
    ["ankleLeft", "footLeft"],
    ["spineBase", "hipRight"],
    ["hipRight", "kneeRight"],
    ["kneeRight", "ankleRight"],
    ["ankleRight", "footRight"],
  ];

  function drawBodies(p, bodyFrame, canvasRect) {
    if (!bodyFrame || !Array.isArray(bodyFrame.bodies) || bodyFrame.bodies.length === 0) {
      return;
    }

    p.push();
    p.strokeWeight(3);

    for (const body of bodyFrame.bodies) {
      if (!body.tracked) {
        continue;
      }

      const map = buildJointMap(body.joints);

      p.stroke(255, 240, 220);
      for (const [a, b] of BONES) {
        const ja = map.get(a);
        const jb = map.get(b);
        if (!ja || !jb || !ja.tracked || !jb.tracked) {
          continue;
        }

        const ax = canvasRect.x + ja.x * canvasRect.w;
        const ay = canvasRect.y + ja.y * canvasRect.h;
        const bx = canvasRect.x + jb.x * canvasRect.w;
        const by = canvasRect.y + jb.y * canvasRect.h;
        p.line(ax, ay, bx, by);
      }

      for (const joint of body.joints) {
        if (!joint.tracked) {
          continue;
        }

        const x = canvasRect.x + joint.x * canvasRect.w;
        const y = canvasRect.y + joint.y * canvasRect.h;
        p.noStroke();
        p.fill(255, 106, 61);
        p.circle(x, y, 8);
      }

      paintHandState(p, map.get("handLeft"), body.handLeftState, canvasRect);
      paintHandState(p, map.get("handRight"), body.handRightState, canvasRect);
    }

    p.pop();
  }

  function detectGestureLabel(bodyFrame) {
    if (!bodyFrame || !Array.isArray(bodyFrame.bodies)) {
      return "none";
    }

    for (const body of bodyFrame.bodies) {
      if (!body.tracked) {
        continue;
      }

      const map = buildJointMap(body.joints);
      const head = map.get("head");
      const rightHand = map.get("handRight");

      if (head && rightHand && head.tracked && rightHand.tracked && rightHand.y < head.y) {
        return "right hand raised";
      }
    }

    return "none";
  }

  function buildJointMap(joints) {
    const map = new Map();
    for (const joint of joints) {
      map.set(joint.name, joint);
    }
    return map;
  }

  function paintHandState(p, joint, handState, canvasRect) {
    if (!joint || !joint.tracked) {
      return;
    }

    const x = canvasRect.x + joint.x * canvasRect.w;
    const y = canvasRect.y + joint.y * canvasRect.h;

    let color = [255, 255, 255, 220];
    if (handState === 2) {
      color = [66, 199, 120, 220]; // open
    } else if (handState === 3) {
      color = [230, 88, 74, 220]; // closed
    } else if (handState === 4) {
      color = [252, 219, 95, 220]; // lasso
    }

    p.noStroke();
    p.fill(...color);
    p.circle(x, y, 16);
  }

  global.SkeletonRenderer = {
    drawBodies,
    detectGestureLabel,
  };
})(window);
