/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

(function attachColorRenderer(global) {
  function ensureImageCache(cache, p, width, height) {
    if (!cache.image || cache.width !== width || cache.height !== height) {
      cache.image = p.createImage(width, height);
      cache.width = width;
      cache.height = height;
    }

    return cache.image;
  }

  function drawColorFrame(p, frame, canvasRect, cache) {
    if (!frame || !frame.dataBytes) {
      return;
    }

    const image = ensureImageCache(cache, p, frame.width, frame.height);
    image.loadPixels();

    // Kinect v2 color is commonly BGRA. Kinect v1 in this demo is treated as RGB.
    if (frame.sensorVersion === 2) {
      for (let i = 0; i < frame.width * frame.height; i += 1) {
        const source = i * 4;
        const dest = i * 4;
        image.pixels[dest] = frame.dataBytes[source + 2];
        image.pixels[dest + 1] = frame.dataBytes[source + 1];
        image.pixels[dest + 2] = frame.dataBytes[source];
        image.pixels[dest + 3] = 255;
      }
    } else {
      for (let i = 0; i < frame.width * frame.height; i += 1) {
        const source = i * 3;
        const dest = i * 4;
        image.pixels[dest] = frame.dataBytes[source];
        image.pixels[dest + 1] = frame.dataBytes[source + 1];
        image.pixels[dest + 2] = frame.dataBytes[source + 2];
        image.pixels[dest + 3] = 255;
      }
    }

    image.updatePixels();
    p.image(image, canvasRect.x, canvasRect.y, canvasRect.w, canvasRect.h);
  }

  global.ColorRenderer = {
    drawColorFrame,
  };
})(window);
