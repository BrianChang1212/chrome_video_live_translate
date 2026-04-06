/**
 * Offscreen: tab MediaStream, level meter; local whisper-server ASR + Ollama → zh-TW.
 */

/* global VLTConstants, VLTMessages, vltNormalizeTranslateEngine, vltNormalizeAsrSourceLang, vltSourceLangBadge, vltNormalizeTranslateTargetLang */

let audioContext = null;
let mediaStream = null;
/** @type {ReturnType<typeof setInterval> | null} */
let meterIntervalId = null;
let analyser = null;
let sourceNode = null;
/** Pass-through to AudioContext.destination so the user still hears the tab (capture often mutes the tab). */
let tabMonitorGain = null;

/** @type {AudioWorkletNode | null} */
let asrWorkletNode = null;
/** @type {GainNode | null} */
let asrOutGain = null;

let asrBusy = false;
/** @type {Float32Array[]} */
let asrAccChunks = [];
let asrAccLength = 0;
let asrTargetSamples = 48000 * 4;
/** @type {string} */
let localWhisperUrlActive = "";
/** ollama | none */
let translateEngineActive = "ollama";
let ollamaUrlActive = VLTConstants.DEFAULT_OLLAMA_URL;
let ollamaModelActive = VLTConstants.DEFAULT_OLLAMA_MODEL;
/** auto | en | ja */
let asrSourceLangActive = "auto";
/** follow | auto | en | ja（字串原樣送 service worker） */
let translateSourceLangActive = "";
/** zh-TW | zh-CN | en | ja */
let translateTargetLangActive = "zh-TW";

const METER_INTERVAL_MS = 50;

function stopMeter() {
  if (meterIntervalId != null) {
    clearInterval(meterIntervalId);
    meterIntervalId = null;
  }
}

function startMeter() {
  stopMeter();
  const tick = () => {
    if (!analyser) {
      return;
    }
    const size = analyser.fftSize;
    const buf = new Uint8Array(size);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    chrome.runtime.sendMessage({ type: "CAPTURE_LEVEL", level: rms }).catch(() => {});
  };
  tick();
  meterIntervalId = setInterval(tick, METER_INTERVAL_MS);
}

function stopFreeAsrPipeline() {
  localWhisperUrlActive = "";
  translateEngineActive = "ollama";
  ollamaUrlActive = VLTConstants.DEFAULT_OLLAMA_URL;
  ollamaModelActive = VLTConstants.DEFAULT_OLLAMA_MODEL;
  asrSourceLangActive = "auto";
  translateSourceLangActive = "";
  translateTargetLangActive = "zh-TW";
  asrBusy = false;
  asrAccChunks = [];
  asrAccLength = 0;
  if (asrWorkletNode) {
    try {
      asrWorkletNode.port.onmessage = null;
      asrWorkletNode.disconnect();
    } catch (_) {}
    asrWorkletNode = null;
  }
  if (asrOutGain) {
    try {
      asrOutGain.disconnect();
    } catch (_) {}
    asrOutGain = null;
  }
}

function mergeFloatChunks(chunks) {
  let len = 0;
  for (const c of chunks) {
    len += c.length;
  }
  const out = new Float32Array(len);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * @param {Float32Array} float32Mono
 */
async function runAsrFreeFlush(float32Mono) {
  const V = globalThis.VLTAsrFree;
  if (!V || !audioContext) {
    return;
  }
  try {
    if (V.rmsFloat32(float32Mono) < 0.0025) {
      return;
    }
    const wav = V.encodeWavMono16(float32Mono, audioContext.sampleRate);
    const wavBase64 = arrayBufferToBase64(wav);
    const resp = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "VLT_RUN_ASR_CHUNK",
          wavBase64,
          localWhisperUrl: localWhisperUrlActive,
          translateEngine: translateEngineActive,
          skipMyMemory: translateEngineActive === "none",
          ollamaUrl: ollamaUrlActive,
          ollamaModel: ollamaModelActive,
          asrSourceLang: asrSourceLangActive,
          translateSourceLang: translateSourceLangActive,
          translateTargetLang: translateTargetLangActive,
        },
        (r) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(r);
        },
      );
    });
    if (!resp?.ok) {
      throw new Error(resp?.error || VLTMessages.errRunAsrChunkFallback());
    }
    const en = resp.en || "";
    if (!en) {
      return;
    }
    const zh = resp.zh || `[${en}]`;
    chrome.runtime
      .sendMessage({
        type: "PIPELINE_SUBTITLE",
        lines: [
          {
            text: zh,
            lang: translateTargetLangActive,
            sourceLine: en,
            sourceLang: vltSourceLangBadge(asrSourceLangActive),
          },
        ],
      })
      .catch(() => {});
  } catch (err) {
    chrome.runtime
      .sendMessage({
        type: "PIPELINE_NOTE",
        text: String(err?.message || err).slice(0, 220),
      })
      .catch(() => {});
  }
}

/**
 * @param {number} chunkSec
 * @param {{
 *   localWhisperUrl?: string,
 *   translateEngine?: string,
 *   ollamaUrl?: string,
 *   ollamaModel?: string,
 *   asrSourceLang?: string,
 *   translateSourceLang?: string,
 *   translateTargetLang?: string,
 * }} [extra] translateEngine 建議已由上游 vltNormalizeTranslateEngine 正規化為 ollama|none
 */
async function startFreeAsrPipeline(chunkSec, extra) {
  stopFreeAsrPipeline();
  const localUrl = String(extra?.localWhisperUrl || "").trim();
  const tEngine = vltNormalizeTranslateEngine(extra?.translateEngine, false);
  const srcLang = vltNormalizeAsrSourceLang(extra?.asrSourceLang);
  const trTgt = vltNormalizeTranslateTargetLang(extra?.translateTargetLang);
  const oUrl = String(
    extra?.ollamaUrl || VLTConstants.DEFAULT_OLLAMA_URL,
  ).trim();
  const oModel = String(
    extra?.ollamaModel || VLTConstants.DEFAULT_OLLAMA_MODEL,
  ).trim();
  if (!sourceNode || !audioContext) {
    return;
  }
  if (!localUrl) {
    return;
  }
  localWhisperUrlActive = localUrl;
  translateEngineActive = tEngine;
  ollamaUrlActive = oUrl;
  ollamaModelActive = oModel;
  asrSourceLangActive = srcLang;
  translateSourceLangActive = String(extra?.translateSourceLang ?? "");
  translateTargetLangActive = trTgt;
  asrTargetSamples = Math.floor(audioContext.sampleRate * chunkSec);

  try {
    await audioContext.audioWorklet.addModule(
      chrome.runtime.getURL("src/offscreen/pcm-worklet.js"),
    );
  } catch (e) {
    chrome.runtime
      .sendMessage({
        type: "PIPELINE_NOTE",
        text: VLTMessages.errAudioWorkletLoad(String(e?.message || e)),
      })
      .catch(() => {});
    return;
  }

  asrWorkletNode = new AudioWorkletNode(audioContext, "vlt-pcm-capture");
  asrOutGain = audioContext.createGain();
  asrOutGain.gain.value = 0;

  asrWorkletNode.port.onmessage = (ev) => {
    if (!audioContext) {
      return;
    }
    if (!localWhisperUrlActive) {
      return;
    }
    const data = ev.data;
    if (!(data instanceof Float32Array) || data.length === 0) {
      return;
    }
    const copy = new Float32Array(data.length);
    copy.set(data);
    asrAccChunks.push(copy);
    asrAccLength += copy.length;

    if (asrBusy && asrAccLength >= asrTargetSamples * 2) {
      asrAccChunks = [];
      asrAccLength = 0;
      return;
    }
    if (asrAccLength < asrTargetSamples || asrBusy) {
      return;
    }

    const merged = mergeFloatChunks(asrAccChunks);
    asrAccChunks = [];
    asrAccLength = 0;
    asrBusy = true;
    runAsrFreeFlush(merged).finally(() => {
      asrBusy = false;
    });
  };

  sourceNode.connect(asrWorkletNode);
  asrWorkletNode.connect(asrOutGain);
  asrOutGain.connect(audioContext.destination);
}

/**
 * Config from popup → service worker → INIT_CAPTURE (offscreen has no storage).
 * @param {{
 *   hfChunkSec?: number,
 *   localWhisperUrl?: string,
 *   translateEngine?: string,
 *   skipMyMemory?: boolean,
 *   ollamaUrl?: string,
 *   ollamaModel?: string,
 *   asrSourceLang?: string,
 *   translateSourceLang?: string,
 *   translateTargetLang?: string,
 * }} asrCfg
 */
function startFreePipelineFromConfig(asrCfg) {
  const localUrl = String(asrCfg?.localWhisperUrl || "").trim();
  if (!localUrl) {
    return;
  }
  const sec = Math.max(
    VLTConstants.CHUNK_SEC_MIN,
    Math.min(
      VLTConstants.CHUNK_SEC_MAX,
      Number(asrCfg.hfChunkSec) || VLTConstants.CHUNK_SEC_DEFAULT,
    ),
  );
  const translateEngine = vltNormalizeTranslateEngine(
    asrCfg?.translateEngine,
    Boolean(asrCfg?.skipMyMemory),
  );
  void startFreeAsrPipeline(sec, {
    localWhisperUrl: localUrl,
    translateEngine,
    ollamaUrl: String(
      asrCfg?.ollamaUrl || VLTConstants.DEFAULT_OLLAMA_URL,
    ).trim(),
    ollamaModel: String(
      asrCfg?.ollamaModel || VLTConstants.DEFAULT_OLLAMA_MODEL,
    ).trim(),
    asrSourceLang: asrCfg?.asrSourceLang,
    translateSourceLang: asrCfg?.translateSourceLang,
    translateTargetLang: asrCfg?.translateTargetLang,
  }).catch((e) => {
    chrome.runtime
      .sendMessage({
        type: "PIPELINE_NOTE",
        text: String(e?.message || e).slice(0, 220),
      })
      .catch(() => {});
  });
}

async function teardown() {
  stopFreeAsrPipeline();
  stopMeter();
  if (tabMonitorGain) {
    try {
      tabMonitorGain.disconnect();
    } catch (_) {}
    tabMonitorGain = null;
  }
  if (sourceNode) {
    try {
      sourceNode.disconnect();
    } catch (_) {}
    sourceNode = null;
  }
  if (analyser) {
    try {
      analyser.disconnect();
    } catch (_) {}
    analyser = null;
  }
  if (mediaStream) {
    for (const t of mediaStream.getTracks()) {
      t.stop();
    }
    mediaStream = null;
  }
  if (audioContext) {
    await audioContext.close().catch(() => {});
    audioContext = null;
  }
}

/**
 * @param {string} streamId
 * @param {{
 *   hfChunkSec?: number,
 *   localWhisperUrl?: string,
 *   skipMyMemory?: boolean,
 *   translateEngine?: string,
 *   ollamaUrl?: string,
 *   ollamaModel?: string,
 *   asrSourceLang?: string,
 *   translateSourceLang?: string,
 *   translateTargetLang?: string,
 * }} [asrCfg]
 */
async function initCapture(streamId, asrCfg) {
  await teardown();
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  audioContext = new AudioContext();
  await audioContext.resume();

  sourceNode = audioContext.createMediaStreamSource(mediaStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.35;
  sourceNode.connect(analyser);
  const mute = audioContext.createGain();
  mute.gain.value = 0;
  analyser.connect(mute);
  mute.connect(audioContext.destination);

  tabMonitorGain = audioContext.createGain();
  tabMonitorGain.gain.value = 1;
  sourceNode.connect(tabMonitorGain);
  tabMonitorGain.connect(audioContext.destination);

  startMeter();
  sendCaptureDebug("after_init");
  setTimeout(() => sendCaptureDebug("t_plus_500ms"), 500);
  startFreePipelineFromConfig(asrCfg || {});
}

function sendCaptureDebug(tag) {
  const tracks = mediaStream
    ? mediaStream.getAudioTracks().map((t) => ({
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState,
        label: t.label,
      }))
    : [];
  chrome.runtime
    .sendMessage({
      type: "CAPTURE_DEBUG",
      tag,
      audioContextState: audioContext ? audioContext.state : "none",
      sampleRate: audioContext ? audioContext.sampleRate : 0,
      tracks,
    })
    .catch(() => {});
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "INIT_CAPTURE") {
    (async () => {
      try {
        await initCapture(message.streamId, {
          hfChunkSec: message.hfChunkSec,
          localWhisperUrl: message.localWhisperUrl,
          skipMyMemory: message.skipMyMemory,
          translateEngine: message.translateEngine,
          ollamaUrl: message.ollamaUrl,
          ollamaModel: message.ollamaModel,
          asrSourceLang: message.asrSourceLang,
          translateSourceLang: message.translateSourceLang,
          translateTargetLang: message.translateTargetLang,
        });
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: String(err?.message || err) });
      }
    })();
    return true;
  }
  if (message?.type === "TEARDOWN_CAPTURE") {
    (async () => {
      await teardown();
      sendResponse({ ok: true });
    })();
    return true;
  }
  return false;
});
