/**
 * Pulls mono PCM from the tab-capture graph for ASR chunking (replaces ScriptProcessorNode).
 */
class VltPcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length < 1) {
      return true;
    }
    const ch = input[0];
    const n = ch.length;
    if (n === 0) {
      return true;
    }
    const copy = new Float32Array(n);
    copy.set(ch);
    this.port.postMessage(copy, [copy.buffer]);
    return true;
  }
}

registerProcessor("vlt-pcm-capture", VltPcmCaptureProcessor);
