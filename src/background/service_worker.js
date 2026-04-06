/**
 * MV3 service worker: offscreen lifecycle + message routing.
 * Tab audio capture is initiated from the popup (user gesture) via streamId.
 */
/* global vltNormalizeAsrSourceLang, vltSourceLangBadge, vltNormalizeTranslateSourcePreference, vltNormalizeTranslateTargetLang, vltTranslateTargetBadge */

importScripts(
  "../shared/vlt_constants.js",
  "../shared/vlt_locale_meta.js",
  "../shared/vlt_messages.js",
  "../shared/vlt_llm_config.js",
  "../shared/vlt_translate_engine.js",
  "../shared/vlt_source_lang.js",
  "local_pipeline.js",
);

const OFFSCREEN_URL = "src/offscreen/offscreen.html";
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") {
    return;
  }
  chrome.storage.local.set({ [VLTConstants.KEY_DEBUG_HUD]: false });
});

/** @type {number | null} */
let captureTabId = null;

async function ensureOffscreen() {
  try {
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL(OFFSCREEN_URL),
      reasons: ["USER_MEDIA"],
      justification: "Capture tab audio for local speech-to-text pipeline.",
    });
  } catch (e) {
    const msg = String(e?.message || e);
    if (/single|already|exist|Only one/i.test(msg)) {
      return;
    }
    throw e;
  }
}

async function closeOffscreenIfOpen() {
  try {
    await chrome.offscreen.closeDocument();
  } catch (_) {
    /* ignore */
  }
}

function notifyTab(tabId, message) {
  if (tabId == null) {
    return;
  }
  chrome.tabs.sendMessage(tabId, message).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "START_CAPTURE") {
    (async () => {
      try {
        captureTabId = message.tabId ?? null;
        await ensureOffscreen();
        await new Promise((r) => setTimeout(r, 150));
        const fwd = await chrome.runtime.sendMessage({
          type: "INIT_CAPTURE",
          streamId: message.streamId,
          hfChunkSec: message.hfChunkSec,
          localWhisperUrl: message.localWhisperUrl,
          translateEngine: message.translateEngine,
          ollamaUrl: message.ollamaUrl,
          ollamaModel: message.ollamaModel,
          skipMyMemory: message.skipMyMemory,
          asrSourceLang: message.asrSourceLang,
          translateSourceLang: message.translateSourceLang,
          translateTargetLang: message.translateTargetLang,
        });
        if (fwd && fwd.ok === false) {
          throw new Error(fwd.error || VLTMessages.errInitCaptureFallback());
        }
        const srcNorm = vltNormalizeAsrSourceLang(message.asrSourceLang);
        const trPref = vltNormalizeTranslateSourcePreference(
          message.translateSourceLang,
        );
        const trTgt = vltNormalizeTranslateTargetLang(message.translateTargetLang);
        notifyTab(captureTabId, {
          type: "VLT_OVERLAY_STATE",
          state: "capturing",
          detail: VLTMessages.overlayCapturingDetail(srcNorm, trPref, trTgt),
          sourceBadge: vltSourceLangBadge(srcNorm),
          targetBadge: vltTranslateTargetBadge(trTgt),
        });
        sendResponse({ ok: true });
      } catch (err) {
        captureTabId = null;
        sendResponse({ ok: false, error: String(err?.message || err) });
      }
    })();
    return true;
  }

  if (message?.type === "STOP_CAPTURE") {
    (async () => {
      try {
        const tabId = captureTabId;
        try {
          await chrome.runtime.sendMessage({ type: "TEARDOWN_CAPTURE" });
        } catch (_) {
          /* offscreen 可能已關閉或未建立 */
        }
        await closeOffscreenIfOpen();
        captureTabId = null;
        notifyTab(tabId, {
          type: "VLT_OVERLAY_STATE",
          state: "idle",
          detail: "",
        });
        sendResponse({ ok: true });
      } catch (err) {
        captureTabId = null;
        sendResponse({ ok: false, error: String(err?.message || err) });
      }
    })();
    return true;
  }

  if (message?.type === "VLT_SUBTITLE") {
    notifyTab(captureTabId, message);
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "CAPTURE_LEVEL") {
    notifyTab(captureTabId, {
      type: "VLT_AUDIO_LEVEL",
      level: message.level,
    });
    return false;
  }

  if (message?.type === "CAPTURE_DEBUG") {
    notifyTab(captureTabId, {
      type: "VLT_CAPTURE_DEBUG",
      payload: {
        tag: message.tag,
        audioContextState: message.audioContextState,
        sampleRate: message.sampleRate,
        tracks: message.tracks,
      },
    });
    return false;
  }

  if (message?.type === "PIPELINE_SUBTITLE") {
    notifyTab(captureTabId, {
      type: "VLT_SUBTITLE",
      lines: message.lines,
    });
    return false;
  }

  if (message?.type === "PIPELINE_NOTE") {
    notifyTab(captureTabId, {
      type: "VLT_PIPELINE_NOTE",
      text: message.text,
    });
    return false;
  }

  if (message?.type === "VLT_RUN_ASR_CHUNK") {
    (async () => {
      try {
        const {
          wavBase64,
          localWhisperUrl,
          translateEngine,
          skipMyMemory,
          ollamaUrl,
          ollamaModel,
          asrSourceLang,
          translateSourceLang,
          translateTargetLang,
        } = message;
        if (!wavBase64) {
          sendResponse({ ok: false, error: "Missing wav" });
          return;
        }
        const out = await self.vltLocalPipeline.vltRunAsrChunk({
          wavBase64,
          localWhisperUrl: String(localWhisperUrl || ""),
          translateEngine: String(translateEngine || ""),
          skipMyMemory: Boolean(skipMyMemory),
          ollamaUrl: String(ollamaUrl || ""),
          ollamaModel: String(ollamaModel || ""),
          asrSourceLang: String(asrSourceLang || ""),
          translateSourceLang: String(translateSourceLang || ""),
          translateTargetLang: String(translateTargetLang || ""),
        });
        if (out.translateNote && captureTabId != null) {
          notifyTab(captureTabId, {
            type: "VLT_PIPELINE_NOTE",
            text: out.translateNote,
          });
        }
        sendResponse({ ok: true, en: out.en, zh: out.zh });
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }

  return false;
});
