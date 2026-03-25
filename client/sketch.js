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
    },
    "0": {
      label: "Stage 0 - Setup and Mock Mode",
      defaultSensor: "mock",
      canSwitchSensor: false,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: "mock",
    },
    "1": {
      label: "Stage 1 - Color Stream",
      defaultSensor: "2",
      canSwitchSensor: false,
      showColor: true,
      showDepth: false,
      showSkeleton: false,
      forcedSensor: "2",
    },
    "2": {
      label: "Stage 2 - Depth Stream",
      defaultSensor: "2",
      canSwitchSensor: false,
      showColor: false,
      showDepth: true,
      showSkeleton: false,
      forcedSensor: "2",
    },
    "3": {
      label: "Stage 3 - Skeleton and Gesture",
      defaultSensor: "2",
      canSwitchSensor: false,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: "2",
    },
    "4": {
      label: "Stage 4 - Sensor Toggle and Capability Compare",
      defaultSensor: "2",
      canSwitchSensor: true,
      showColor: true,
      showDepth: true,
      showSkeleton: true,
      forcedSensor: null,
    },
  };

  const stageKey = new URLSearchParams(window.location.search).get("stage") || "free";
  const stageConfig = STAGE_CONFIGS[stageKey] || STAGE_CONFIGS.free;

  const state = {
    ws: null,
    activeButtonVersion: stageConfig.defaultSensor,
    currentSensorVersion: "unknown",
    sensorTitle: "Waiting for sensor info...",
    features: [],
    notes: [],
    latestDepthFrame: null,
    latestBodyFrame: null,
    gestureLabel: "none",
    depthCache: {},
    colorStreamEl: null,
    protocolChecked: false,
    disconnecting: false,
  };

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

  // Converts the WebSocket server URL to an HTTP URL for the MJPEG color stream.
  function getColorStreamUrl() {
    const wsUrl = getServerUrl();
    const httpUrl = wsUrl.startsWith("wss://")
      ? wsUrl.replace("wss://", "https://")
      : wsUrl.replace("ws://", "http://");
    return `${httpUrl}/stream/color`;
  }

  function connectSocket() {
    const ws = new WebSocket(getServerUrl());
    state.ws = ws;

    ws.addEventListener("open", () => {
      // The server owns the adapter — don't switch it on connect.
      // The server will broadcast sensorInfo immediately, which syncs the UI.
      state.disconnecting = false;
      if (state.colorStreamEl) {
        state.colorStreamEl.src = getColorStreamUrl();
      }
      setBadge("Connected");
    });

    ws.addEventListener("close", () => {
      // Stop the MJPEG stream whenever the socket drops.
      if (state.colorStreamEl) {
        state.colorStreamEl.src = "";
      }
      if (state.disconnecting) {
        // User-initiated disconnect — don't retry.
        setBadge("Disconnected");
        return;
      }
      setBadge("Disconnected - retrying...");
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
        if (KinectProtocol && msg.protocolVersion !== KinectProtocol.PROTOCOL_VERSION) {
          console.warn(
            `[KinectConnect] Protocol version mismatch: server=${msg.protocolVersion}, client=${KinectProtocol.PROTOCOL_VERSION}. Some features may not work as expected.`
          );
        }
      }

      if (msg.type === "sensorInfo") {
        state.currentSensorVersion = String(msg.version);
        state.sensorTitle = msg.title;
        state.features = Array.isArray(msg.features) ? msg.features : [];
        state.notes = Array.isArray(msg.notes) ? msg.notes : [];
        // Sync the sensor toggle buttons to what the server is actually running.
        updateActiveButtons(state.currentSensorVersion);
        setSensorText();
        return;
      }

      if (msg.type === "error") {
        state.notes = [msg.message];
        setSensorText();
        return;
      }

      if (msg.type === "depthFrame") {
        state.latestDepthFrame = {
          sensorVersion: msg.sensorVersion,
          width: msg.width,
          height: msg.height,
          dataBytes: decodeBase64(msg.data),
        };
        return;
      }

      if (msg.type === "bodyFrame") {
        state.latestBodyFrame = msg;
      }
    });
  }

  // Stop all streams immediately and prevent the auto-reconnect timer.
  // The existing "Connect" button reloads the page to reconnect (useful when
  // changing the server URL). For a soft reconnect on the same URL, call
  // reconnect() programmatically.
  function disconnect() {
    state.disconnecting = true;
    if (state.ws) {
      state.ws.close();
    }
    if (state.colorStreamEl) {
      state.colorStreamEl.src = "";
    }
    setBadge("Disconnected");
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

      // Grab the hidden <img> that receives the MJPEG color stream from the server.
      state.colorStreamEl = document.getElementById("colorStream");

      // Cap the draw loop to match the MJPEG stream rate.
      // Running at 60fps just re-blits the same image repeatedly between stream
      // frames and hammers the GPU for no perceptible gain.
      p.frameRate(10);

      setupButtons();
      setStageLabel();
      connectSocket();
      setSensorText();

      // Wire the Disconnect button added in index.html.
      const disconnectBtn = document.getElementById("serverDisconnect");
      if (disconnectBtn) {
        disconnectBtn.addEventListener("click", disconnect);
      }
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

    p.draw = () => {
      p.background(7, 16, 24);

      // We split the canvas in two halves to show color + depth side by side.
      const half = {
        left: { x: 0, y: 0, w: p.width / 2, h: p.height },
        right: { x: p.width / 2, y: 0, w: p.width / 2, h: p.height },
      };

      if (stageConfig.showColor) {
        const drawn = global.ColorRenderer.drawColorStream(p, state.colorStreamEl, half.left);
        if (!drawn) {
          drawPlaceholderPanel(p, half.left, "Waiting for color stream...");
        }
      } else {
        drawPlaceholderPanel(p, half.left, "Color hidden in this stage");
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
