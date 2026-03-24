/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

(function attachDepthRenderer(global) {
  function ensureImageCache(cache, p, width, height) {
    if (!cache.image || cache.width !== width || cache.height !== height) {
      cache.image = p.createImage(width, height);
      cache.width = width;
      cache.height = height;
    }

    return cache.image;
  }

  function drawDepthFrame(p, frame, canvasRect, cache) {
    if (!frame || !frame.dataBytes) {
      return;
    }

    const image = ensureImageCache(cache, p, frame.width, frame.height);
    image.loadPixels();

    for (let i = 0; i < frame.width * frame.height; i += 1) {
      const source = i * 2;
      const depthMm = frame.dataBytes[source] | (frame.dataBytes[source + 1] << 8);
      const normalized = mapDepthTo01(depthMm);
      const color = depthColorMap(normalized);
      const dest = i * 4;
      image.pixels[dest] = color.r;
      image.pixels[dest + 1] = color.g;
      image.pixels[dest + 2] = color.b;
      image.pixels[dest + 3] = 255;
    }

    image.updatePixels();
    p.image(image, canvasRect.x, canvasRect.y, canvasRect.w, canvasRect.h);
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
