/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

(function attachDepthRenderer(global) {
  // We maintain our own Canvas2D instead of using p5.Image so we can set
  // willReadFrequently: true on the context. This tells the browser to keep
  // the pixel buffer CPU-readable, eliminating the repeated console warning.
  // We then blit the finished canvas onto the p5 canvas with drawImage().
  function ensureCache(cache, width, height) {
    if (!cache.canvas || cache.width !== width || cache.height !== height) {
      cache.canvas = document.createElement("canvas");
      cache.canvas.width = width;
      cache.canvas.height = height;
      cache.ctx = cache.canvas.getContext("2d", { willReadFrequently: true });
      cache.imageData = cache.ctx.createImageData(width, height);
      cache.width = width;
      cache.height = height;
    }

    return cache;
  }

  function drawDepthFrame(p, frame, canvasRect, cache) {
    if (!frame || !frame.dataBytes) {
      return;
    }

    const c = ensureCache(cache, frame.width, frame.height);

    // Only recompute pixels when the frame object itself is new.
    // The draw loop runs at 15fps but depth frames arrive from the server at
    // up to 30fps — and on repeat draw calls with the same frame we'd be doing
    // 217,088 pixel iterations for zero visual change.
    if (frame !== cache.lastFrame) {
      cache.lastFrame = frame;
      const pixels = c.imageData.data;

      for (let i = 0; i < frame.width * frame.height; i += 1) {
        const source = i * 2;
        const depthMm = frame.dataBytes[source] | (frame.dataBytes[source + 1] << 8);
        const normalized = mapDepthTo01(depthMm);
        const color = depthColorMap(normalized);
        const dest = i * 4;
        pixels[dest] = color.r;
        pixels[dest + 1] = color.g;
        pixels[dest + 2] = color.b;
        pixels[dest + 3] = 255;
      }

      c.ctx.putImageData(c.imageData, 0, 0);
    }

    // Preserve source aspect ratio with letterboxing.
    const scale = Math.min(canvasRect.w / frame.width, canvasRect.h / frame.height);
    const destW = frame.width * scale;
    const destH = frame.height * scale;
    const destX = canvasRect.x + (canvasRect.w - destW) / 2;
    const destY = canvasRect.y + (canvasRect.h - destH) / 2;
    p.drawingContext.drawImage(c.canvas, destX, destY, destW, destH);
  }

  function mapDepthTo01(depthMm) {
    const min = 500;
    const max = 4500;
    const clamped = Math.max(min, Math.min(max, depthMm));
    return (clamped - min) / (max - min);
  }

  // A simple warm-to-cool palette makes distance easier to read for beginners.
  function depthColorMap(t) {
    const inv = 1 - t;
    return {
      r: Math.floor(255 * inv),
      g: Math.floor(180 * (1 - Math.abs(t - 0.5) * 2)),
      b: Math.floor(255 * t),
    };
  }

  global.DepthRenderer = {
    drawDepthFrame,
  };
})(window);
