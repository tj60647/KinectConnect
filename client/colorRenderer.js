/*
 * KinectConnect
 * Copyright (c) 2026 Thomas J McLeish
 * Licensed under the MIT License.
 */

(function attachColorRenderer(global) {
  // Color frames are delivered as MJPEG — a continuous HTTP stream of JPEG images
  // that the browser decodes natively inside a plain <img> element. We only need
  // to draw that element onto the p5 canvas each frame. No pixel loops required.
  //
  // Note: a streaming <img> never sets .complete = true (the connection stays open
  // indefinitely), so we check naturalWidth > 0 instead to detect the first frame.

  // Compute a centered destination rect that fits srcW×srcH inside dst while
  // preserving the source aspect ratio (letterbox / pillarbox as needed).
  function fitRect(srcW, srcH, dst) {
    const scale = Math.min(dst.w / srcW, dst.h / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    return {
      x: dst.x + (dst.w - drawW) / 2,
      y: dst.y + (dst.h - drawH) / 2,
      w: drawW,
      h: drawH,
    };
  }

  function drawColorStream(p, imgElement, canvasRect) {
    if (!imgElement || imgElement.naturalWidth === 0) {
      return false;
    }

    const dest = fitRect(imgElement.naturalWidth, imgElement.naturalHeight, canvasRect);
    p.drawingContext.drawImage(imgElement, dest.x, dest.y, dest.w, dest.h);
    return true;
  }

  global.ColorRenderer = {
    drawColorStream,
  };
})(window);
