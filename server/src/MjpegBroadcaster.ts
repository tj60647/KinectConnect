/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

import { Response } from "express";
import { ColorFrameMessage } from "./KinectAdapter";

// jpeg-js is a pure-JavaScript JPEG encoder — no native binary required.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jpeg = require("jpeg-js") as {
  encode: (
    imageData: { data: Buffer; width: number; height: number },
    quality: number
  ) => { data: Buffer };
};

const BOUNDARY = "KinectColorFrame";

// JPEG quality 60 keeps file size low (~80–180 KB at 1080p) which reduces both
// encode time (pure-JS encoder) and per-frame GPU decode work on the client.
const JPEG_QUALITY = 60;

// 10 fps is plenty for a classroom depth/skeleton demo and halves the encode
// CPU cost vs 15 fps. The p5 draw loop is capped to the same rate on the client.
const MIN_FRAME_GAP_MS = 1000 / 10;

export class MjpegBroadcaster {
  private readonly clients = new Set<Response>();
  private lastFrameTime = 0;

  // Register a new HTTP response as a color stream subscriber.
  // The browser keeps this connection open and renders each JPEG as a video frame.
  public addClient(res: Response): void {
    res.writeHead(200, {
      "Content-Type": `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
      "Cache-Control": "no-cache, no-store",
      Connection: "close",
    });

    this.clients.add(res);
    console.log(`[MjpegBroadcaster] Color stream client connected. Total: ${this.clients.size}`);

    res.on("close", () => {
      this.clients.delete(res);
      console.log(
        `[MjpegBroadcaster] Color stream client disconnected. Total: ${this.clients.size}`
      );
    });
  }

  // Called for every color frame from any adapter.
  // Throttles, JPEG-encodes, and pushes to all connected HTTP clients.
  public pushFrame(message: ColorFrameMessage): void {
    if (this.clients.size === 0) return;

    // Drop frames that arrive faster than the target rate.
    const now = Date.now();
    if (now - this.lastFrameTime < MIN_FRAME_GAP_MS) return;
    this.lastFrameTime = now;

    const { width, height, sensorVersion } = message;
    const raw = Buffer.from(message.data, "base64");

    // jpeg-js expects RGBA byte order.
    // Kinect v2 frames are BGRA — swap R and B channels before encoding.
    let rgba: Buffer;
    if (sensorVersion === 2) {
      rgba = Buffer.alloc(raw.length);
      for (let i = 0; i < raw.length; i += 4) {
        rgba[i] = raw[i + 2]; // R ← B
        rgba[i + 1] = raw[i + 1]; // G
        rgba[i + 2] = raw[i]; // B ← R
        rgba[i + 3] = 255;
      }
    } else {
      // Mock and v1 frames are already RGBA.
      rgba = raw;
    }

    let jpegBuf: Buffer;
    try {
      jpegBuf = jpeg.encode({ data: rgba, width, height }, JPEG_QUALITY).data;
    } catch {
      return;
    }

    // Multipart MJPEG frame: boundary + headers + JPEG payload.
    const header = Buffer.from(
      `--${BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpegBuf.length}\r\n\r\n`
    );
    const footer = Buffer.from("\r\n");

    for (const res of this.clients) {
      try {
        res.write(header);
        res.write(jpegBuf);
        res.write(footer);
      } catch {
        this.clients.delete(res);
      }
    }
  }
}
