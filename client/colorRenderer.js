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
  function drawColorStream(p, imgElement, canvasRect) {
    if (!imgElement || imgElement.naturalWidth === 0) {
      return false;
    }

    p.drawingContext.drawImage(
      imgElement,
      canvasRect.x,
      canvasRect.y,
      canvasRect.w,
      canvasRect.h
    );
    return true;
  }

  global.ColorRenderer = {
    drawColorStream,
  };
})(window);
