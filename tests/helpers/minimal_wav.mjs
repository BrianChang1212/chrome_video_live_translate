/**
 * Build a tiny valid PCM16 mono WAV in memory (for optional whisper-server integration tests).
 * @param {number} sampleRate
 * @param {number} durationSec
 * @returns {ArrayBuffer}
 */
export function buildSilentWavPcm16Mono(sampleRate, durationSec) {
  const n = Math.max(1, Math.floor(sampleRate * durationSec));
  const samples = new Int16Array(n);
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(offset, s) {
    for (let i = 0; i < s.length; i += 1) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  }

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const out = new Uint8Array(buffer, 44);
  out.set(new Uint8Array(samples.buffer));

  return buffer;
}
