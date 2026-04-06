/**
 * Offscreen helpers: PCM → WAV, RMS. ASR / translation HTTP runs in the service worker.
 */

(function initAsrFree(global) {
  function writeString(view, offset, s) {
    for (let i = 0; i < s.length; i += 1) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  }

  /**
   * @param {Float32Array} float32Mono
   * @param {number} sampleRate
   * @returns {ArrayBuffer}
   */
  function encodeWavMono16(float32Mono, sampleRate) {
    const n = float32Mono.length;
    const buffer = new ArrayBuffer(44 + n * 2);
    const view = new DataView(buffer);
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + n * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, n * 2, true);
    let offset = 44;
    for (let i = 0; i < n; i += 1) {
      const s = Math.max(-1, Math.min(1, float32Mono[i]));
      view.setInt16(
        offset,
        s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff),
        true,
      );
      offset += 2;
    }
    return buffer;
  }

  function rmsFloat32(f) {
    if (!f || !f.length) {
      return 0;
    }
    let sum = 0;
    for (let i = 0; i < f.length; i += 1) {
      sum += f[i] * f[i];
    }
    return Math.sqrt(sum / f.length);
  }

  global.VLTAsrFree = {
    encodeWavMono16,
    rmsFloat32,
  };
})(typeof self !== "undefined" ? self : globalThis);
