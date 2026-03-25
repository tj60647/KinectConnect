/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

(function attachSketch(global) {
  const STAGE_CONFIGS = {
    free: {
      label: "Free Play",
      defaultSensor: "2",
      canSwitchSensor: true,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: null,
      frameRate: 30,
      quality: "full",
    },
    "0": {
      label: "Stage 0 - Setup and Mock Mode",
      defaultSensor: "mock",
      canSwitchSensor: false,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: "mock",
      frameRate: 15,
      quality: "medium",
    },
    "1": {
      label: "Stage 1 - Color Stream",
      defaultSensor: "2",
      canSwitchSensor: false,
      showColor: true,
      showDepth: false,
      showSkeleton: false,
      forcedSensor: "2",
      frameRate: 15,
      quality: "medium",
    },
    "2": {
      label: "Stage 2 - Depth Stream",
      defaultSensor: "2",
      canSwitchSensor: false,
      showColor: false,
      showDepth: true,
      showSkeleton: false,
      forcedSensor: "2",
      frameRate: 15,
      quality: "medium",
    },
    "3": {
      label: "Stage 3 - Skeleton and Gesture",
      defaultSensor: "2",
      canSwitchSensor: false,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: "2",
      frameRate: 15,
      quality: "medium",
    },
    "4": {
      label: "Stage 4 - Sensor Toggle and Capability Compare",
      defaultSensor: "2",
      canSwitchSensor: true,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: null,
      frameRate: 30,
      quality: "full",
    },
  };

  const params = new URLSearchParams(window.location.search);
  const stageKey = params.get("stage") || "free";
  const stageConfig = STAGE_CONFIGS[stageKey] || STAGE_CONFIGS.free;

  // URL params override STAGE_CONFIGS values for one-off sessions.
  const rawFps = parseInt(params.get("fps") || "", 10);
  const effectiveFps = rawFps >= 1 && rawFps <= 120 ? rawFps : stageConfig.frameRate;
  const frameInterval = 1000 / effectiveFps;

  const rawQuality = params.get("quality");
  const effectiveQuality =
    rawQuality === "low" || rawQuality === "medium" || rawQuality === "full"
      ? rawQuality
      : stageConfig.quality;

  const state = {
    ws: null,
    activeButtonVersion: stageConfig.defaultSensor,
    currentSensorVersion: "unknown",
    sensorTitle: "Waiting for sensor info...",
    features: [],
    notes: [],
    latestDepthFrame: null,
    latestColorFrame: null,
    latestBodyFrame: null,
    gestureLabel: "none",
    depthCache: {},
    colorCache: {},
    protocolChecked: false,
    lastDepthTime: 0,
    lastColorTime: 0,
    lastBodyTime: 0,
  };

  // Diagnostics state — updated from WS events and message handling.
  const diag = {
    wsConnected: false,
    sensorDetected: false,
    protocolOk: null,
  };

  // Recording state.
  const recording = {
    active: false,
    frames: [],
    startTime: 0,
  };

  // -------------------------------------------------------------------------
  // Diagnostics panel
  // -------------------------------------------------------------------------

  function updateDiagPanel() {
    const diagWs = document.getElementById("diagWs");
    const diagSensor = document.getElementById("diagSensor");
    const diagProto = document.getElementById("diagProto");
    const diagRec = document.getElementById("diagRec");

    if (diagWs) {
      diagWs.textContent = diag.wsConnected ? "✓ WS: Connected" : "⏳ WS: Connecting…";
    }

    if (diagSensor) {
      diagSensor.textContent = diag.sensorDetected
        ? `✓ Sensor: ${state.currentSensorVersion}`
        : "– Sensor: none";
    }

    if (diagProto) {
      const KinectProtocol = global.KinectProtocol;
      if (diag.protocolOk === null) {
        diagProto.textContent = "– Protocol: checking…";
      } else if (diag.protocolOk) {
        diagProto.textContent = `✓ Protocol: ${KinectProtocol ? KinectProtocol.PROTOCOL_VERSION : "ok"}`;
      } else {
        diagProto.textContent = "⚠ Protocol: mismatch";
      }
    }

    if (diagRec) {
      diagRec.style.display = recording.active ? "" : "none";
    }
  }

  // -------------------------------------------------------------------------
  // Recording helpers
  // -------------------------------------------------------------------------

  function startRecording() {
    recording.active = true;
    recording.frames = [];
    recording.startTime = Date.now();
    updateDiagPanel();
  }

  function stopRecording() {
    recording.active = false;
    updateDiagPanel();
    if (recording.frames.length === 0) {
      return;
    }

    const payload = {
      version: global.KinectProtocol ? global.KinectProtocol.PROTOCOL_VERSION : "unknown",
      stage: stageKey,
      recordedAt: new Date().toISOString(),
      fps: effectiveFps,
      quality: effectiveQuality,
      frames: recording.frames,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kinectconnect-recording-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recording.frames = [];
  }

  function captureFrame(msg) {
    if (!recording.active) {
      return;
    }
    // Cap at 600 entries to keep the download size manageable.
    if (recording.frames.length >= 600) {
      return;
    }
    const t = Date.now() - recording.startTime;
    if (msg.type === "bodyFrame") {
      recording.frames.push({ t, type: msg.type, sensorVersion: msg.sensorVersion, bodies: msg.bodies });
    } else {
      // Store metadata only for large pixel-data frames to keep file size reasonable.
      recording.frames.push({
        t,
        type: msg.type,
        sensorVersion: msg.sensorVersion,
        width: msg.width,
        height: msg.height,
      });
    }
  }

  // -------------------------------------------------------------------------
  // DOM helpers (unchanged)
  // -------------------------------------------------------------------------

  function setBadge(text) {
    const badge = document.getElementById("connectionBadge");
    if (badge) {
      badge.textContent = text;
    }
  }

  function setStageLabel() {
    const stageLabel = document.getElementById("stageLabel");
    if (stageLabel) {
      stageLabel.textContent = `Stage: ${stageConfig.label}`;
    }
  }

  function setSensorText() {
    const title = document.getElementById("sensorTitle");
    const featureList = document.getElementById("featureList");
    const noteList = document.getElementById("noteList");
    const gesture = document.getElementById("gestureStatus");

    if (title) {
      title.textContent = `${state.sensorTitle} (active: ${state.currentSensorVersion})`;
    }

    if (gesture) {
      gesture.textContent = `Gesture: ${state.gestureLabel}`;
    }

    if (featureList) {
      featureList.innerHTML = "";
      for (const item of state.features) {
        const li = document.createElement("li");
        li.textContent = item;
        featureList.appendChild(li);
      }
    }

    if (noteList) {
      noteList.innerHTML = "";
      for (const item of state.notes) {
        const li = document.createElement("li");
        li.textContent = item;
        noteList.appendChild(li);
      }
    }
  }

  function updateActiveButtons(version) {
    state.activeButtonVersion = version;
    const allButtons = document.querySelectorAll("button[data-version]");
    for (const button of allButtons) {
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }

      button.classList.toggle("is-active", button.dataset.version === version);
    }
  }

  function setupButtons() {
    const allButtons = document.querySelectorAll("button[data-version]");
    for (const button of allButtons) {
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }

      button.disabled = !stageConfig.canSwitchSensor;

      button.addEventListener("click", () => {
        if (!stageConfig.canSwitchSensor) {
          return;
        }

        const version = button.dataset.version;
        if (!version) {
          return;
        }

        updateActiveButtons(version);
        sendSwitchMessage(version);
      });
    }
  }

  function getServerUrl() {
    const stored = localStorage.getItem("kinectServerUrl");
    if (stored) {
      return stored;
    }
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}`;
  }

  function connectSocket() {
    const ws = new WebSocket(getServerUrl());
    state.ws = ws;

    ws.addEventListener("open", () => {
      setBadge("Connected");
      diag.wsConnected = true;
      updateDiagPanel();

      const target = stageConfig.forcedSensor || state.activeButtonVersion;
      updateActiveButtons(target);
      sendSwitchMessage(target);
      sendQualityMessage(effectiveQuality);
    });

    ws.addEventListener("close", () => {
      setBadge("Disconnected - retrying...");
      diag.wsConnected = false;
      diag.sensorDetected = false;
      diag.protocolOk = null;
      updateDiagPanel();
      setTimeout(connectSocket, 2000);
    });

    ws.addEventListener("error", () => {
      setBadge("Socket error");
    });

    ws.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      // Check protocol version on the first stamped message so students can
      // spot server/client mismatches quickly in the browser console.
      if (!state.protocolChecked && msg.protocolVersion) {
        state.protocolChecked = true;
        const KinectProtocol = global.KinectProtocol;
        if (KinectProtocol) {
          const match = msg.protocolVersion === KinectProtocol.PROTOCOL_VERSION;
          diag.protocolOk = match;
          if (!match) {
            console.warn(
              `[KinectConnect] Protocol version mismatch: server=${msg.protocolVersion}, client=${KinectProtocol.PROTOCOL_VERSION}. Some features may not work as expected.`
            );
          }
        } else {
          diag.protocolOk = true;
        }
        updateDiagPanel();
      }

      if (msg.type === "sensorInfo") {
        state.currentSensorVersion = String(msg.version);
        state.sensorTitle = msg.title;
        state.features = Array.isArray(msg.features) ? msg.features : [];
        state.notes = Array.isArray(msg.notes) ? msg.notes : [];
        diag.sensorDetected = true;
        updateDiagPanel();
        setSensorText();
        return;
      }

      if (msg.type === "error") {
        state.notes = [msg.message];
        setSensorText();
        return;
      }

      const now = Date.now();

      if (msg.type === "depthFrame") {
        if (now - state.lastDepthTime < frameInterval) {
          return;
        }
        state.lastDepthTime = now;
        state.latestDepthFrame = {
          sensorVersion: msg.sensorVersion,
          width: msg.width,
          height: msg.height,
          dataBytes: decodeBase64(msg.data),
        };
        captureFrame(msg);
        return;
      }

      if (msg.type === "colorFrame") {
        if (now - state.lastColorTime < frameInterval) {
          return;
        }
        state.lastColorTime = now;
        state.latestColorFrame = {
          sensorVersion: msg.sensorVersion,
          width: msg.width,
          height: msg.height,
          dataBytes: decodeBase64(msg.data),
        };
        captureFrame(msg);
        return;
      }

      if (msg.type === "bodyFrame") {
        if (now - state.lastBodyTime < frameInterval) {
          return;
        }
        state.lastBodyTime = now;
        state.latestBodyFrame = msg;
        captureFrame(msg);
      }
    });
  }

  function sendSwitchMessage(version) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    state.ws.send(
      JSON.stringify({
        type: "switchSensor",
        version,
      })
    );
  }

  function sendQualityMessage(quality) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    state.ws.send(
      JSON.stringify({
        type: "setQuality",
        quality,
      })
    );
  }

  function decodeBase64(value) {
    const raw = atob(value);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      bytes[i] = raw.charCodeAt(i);
    }
    return bytes;
  }

  // We define p5 in instance mode so the global namespace stays cleaner for beginners.
  new p5((p) => {
    p.setup = () => {
      const wrap = document.getElementById("canvasWrap");
      const width = wrap ? Math.max(360, wrap.clientWidth - 8) : 900;
      const height = Math.max(320, Math.floor(width * 0.56));
      const canvas = p.createCanvas(width, height);
      if (wrap) {
        canvas.parent(wrap);
      }

      setupButtons();
      setStageLabel();
      connectSocket();
      setSensorText();
      updateDiagPanel();
    };

    p.windowResized = () => {
      const wrap = document.getElementById("canvasWrap");
      if (!wrap) {
        return;
      }

      const width = Math.max(360, wrap.clientWidth - 8);
      const height = Math.max(320, Math.floor(width * 0.56));
      p.resizeCanvas(width, height);
    };

    p.keyPressed = () => {
      if (p.key === "r" || p.key === "R") {
        if (recording.active) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    p.draw = () => {
      p.background(7, 16, 24);

      // We split the canvas in two halves to show color + depth side by side.
      const half = {
        left: { x: 0, y: 0, w: p.width / 2, h: p.height },
        right: { x: p.width / 2, y: 0, w: p.width / 2, h: p.height },
      };

      if (stageConfig.showColor && state.latestColorFrame) {
        global.ColorRenderer.drawColorFrame(p, state.latestColorFrame, half.left, state.colorCache);
      } else {
        drawPlaceholderPanel(
          p,
          half.left,
          stageConfig.showColor ? "No color frame yet" : "Color hidden in this stage"
        );
      }

      if (stageConfig.showDepth && state.latestDepthFrame) {
        global.DepthRenderer.drawDepthFrame(p, state.latestDepthFrame, half.right, state.depthCache);
      } else {
        drawPlaceholderPanel(
          p,
          half.right,
          stageConfig.showDepth ? "No depth frame yet" : "Depth hidden in this stage"
        );
      }

      if (stageConfig.showSkeleton && state.latestBodyFrame) {
        // For simplicity, we draw skeleton over the left panel (color side).
        global.SkeletonRenderer.drawBodies(p, state.latestBodyFrame, half.left);
        state.gestureLabel = global.SkeletonRenderer.detectGestureLabel(state.latestBodyFrame);
      } else {
        state.gestureLabel = "none";
      }

      // Update gesture text in DOM each frame so students can observe interaction quickly.
      const gesture = document.getElementById("gestureStatus");
      if (gesture) {
        gesture.textContent = `Gesture: ${state.gestureLabel}`;
      }

      p.noStroke();
      p.fill(255, 230);
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text(stageConfig.showSkeleton ? "Color + Skeleton" : "Color", 8, 8);
      p.text("Depth", p.width / 2 + 8, 8);
    };
  });

  function drawPlaceholderPanel(p, rect, label) {
    p.push();
    p.noStroke();
    p.fill(22, 35, 46);
    p.rect(rect.x, rect.y, rect.w, rect.h);
    p.fill(200, 220, 235);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    p.pop();
  }
})(window);
