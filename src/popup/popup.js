/* global VLTConstants, VLTLocaleMeta, VLTMessages, vltNormalizeTranslateEngine, vltNormalizeAsrSourceLang, vltNormalizeTranslateTargetLang */

const DEBUG_KEY = VLTConstants.KEY_DEBUG_HUD;
const ASR_CONFIG_STORAGE_KEYS = [
  VLTConstants.KEY_HF_CHUNK_SEC,
  VLTConstants.KEY_VLT_LOCAL_WHISPER_URL,
  VLTConstants.KEY_VLT_SKIP_MY_MEMORY,
  VLTConstants.KEY_VLT_TRANSLATE_ENGINE,
  VLTConstants.KEY_VLT_OLLAMA_URL,
  VLTConstants.KEY_VLT_OLLAMA_MODEL,
  VLTConstants.KEY_VLT_ASR_SOURCE_LANG,
  VLTConstants.KEY_VLT_TRANSLATE_SOURCE_LANG,
  VLTConstants.KEY_VLT_TRANSLATE_TARGET_LANG,
];

const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
const btnDemo = document.getElementById("btnDemoLine");
const btnSettings = document.getElementById("btnSettings");
const debugHud = document.getElementById("debugHud");
const statusEl = document.getElementById("status");
const whisperEndpointEl = document.getElementById("whisperEndpoint");
const elPopupChunkSec = document.getElementById("popupChunkSec");
const elPopupChunkSecVal = document.getElementById("popupChunkSecVal");
const translatorInfoEl = document.getElementById("translatorInfo");
const pipelineBadgeEl = document.getElementById("pipelineBadge");
const elPopupAsr = document.getElementById("popupAsrSourceLang");
const elPopupTgt = document.getElementById("popupTranslateTargetLang");
const btnPopupLangAxisSwap = document.getElementById("popupLangAxisSwap");
const popupLangAxisHintEl = document.getElementById("popupLangAxisHint");
const linkWhisper = document.getElementById("linkWhisper");
const linkOllama = document.getElementById("linkOllama");

const storageLocal = chrome.storage?.local;

function clampPopupChunkSec(n) {
  const lo = VLTConstants.CHUNK_SEC_MIN;
  const hi = VLTConstants.CHUNK_SEC_MAX;
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) {
    return VLTConstants.CHUNK_SEC_DEFAULT;
  }
  return Math.max(lo, Math.min(hi, v));
}

function applyPopupChunkSecToUi(sec) {
  const s = clampPopupChunkSec(sec);
  if (elPopupChunkSec) {
    elPopupChunkSec.value = String(s);
  }
  if (elPopupChunkSecVal) {
    elPopupChunkSecVal.textContent = `${s}s`;
  }
}

function initPopupChunkSecControl() {
  if (!elPopupChunkSec) {
    return;
  }
  elPopupChunkSec.min = String(VLTConstants.CHUNK_SEC_MIN);
  elPopupChunkSec.max = String(VLTConstants.CHUNK_SEC_MAX);
  elPopupChunkSec.step = String(VLTConstants.CHUNK_SEC_STEP);
  elPopupChunkSec.setAttribute(
    "aria-label",
    VLTMessages.popupChunkSecRangeLabel(),
  );
  elPopupChunkSec.title = VLTMessages.popupChunkSecRangeTitle();
}

function persistPopupChunkSecFromControl() {
  if (!storageLocal || !elPopupChunkSec) {
    return;
  }
  const sec = clampPopupChunkSec(elPopupChunkSec.value);
  elPopupChunkSec.value = String(sec);
  if (elPopupChunkSecVal) {
    elPopupChunkSecVal.textContent = `${sec}s`;
  }
  storageLocal.set({ [VLTConstants.KEY_HF_CHUNK_SEC]: sec });
}

function fillPopupLocaleSelects() {
  const M = globalThis.VLTLocaleMeta;
  if (!M || !Array.isArray(M.LIST)) {
    return;
  }
  const L = M.LIST;
  if (elPopupAsr) {
    elPopupAsr.innerHTML =
      '<option value="auto">自動偵測</option>' +
      L.map((x) => `<option value="${x.code}">${x.labelZh}</option>`).join("");
  }
  if (elPopupTgt) {
    elPopupTgt.innerHTML = L.map(
      (x) => `<option value="${x.code}">${x.labelZh}</option>`,
    ).join("");
  }
}

function applyPopupLangFromRecord(r) {
  if (!r) {
    return;
  }
  const srcLang = vltNormalizeAsrSourceLang(r[VLTConstants.KEY_VLT_ASR_SOURCE_LANG]);
  if (
    elPopupAsr &&
    [...elPopupAsr.options].some((o) => o.value === srcLang)
  ) {
    elPopupAsr.value = srcLang;
  }
  const trTgt = vltNormalizeTranslateTargetLang(
    r[VLTConstants.KEY_VLT_TRANSLATE_TARGET_LANG],
  );
  if (
    elPopupTgt &&
    [...elPopupTgt.options].some((o) => o.value === trTgt)
  ) {
    elPopupTgt.value = trTgt;
  }
  updatePopupLangAxisSwapButton();
}

function updatePopupLangAxisSwapButton() {
  if (!btnPopupLangAxisSwap || !elPopupAsr) {
    return;
  }
  const auto = vltNormalizeAsrSourceLang(elPopupAsr.value) === "auto";
  btnPopupLangAxisSwap.disabled = auto;
  btnPopupLangAxisSwap.setAttribute(
    "aria-label",
    VLTMessages.langAxisSwapTitle(),
  );
  btnPopupLangAxisSwap.title = auto
    ? VLTMessages.langAxisSwapNeedConcreteSource()
    : VLTMessages.langAxisSwapTitle();
}

function swapPopupLangAxis() {
  if (!storageLocal || !elPopupAsr || !elPopupTgt) {
    return;
  }
  const asr = vltNormalizeAsrSourceLang(elPopupAsr.value);
  if (asr === "auto") {
    return;
  }
  const tgt = vltNormalizeTranslateTargetLang(elPopupTgt.value);
  elPopupAsr.value = tgt;
  elPopupTgt.value = asr;
  persistPopupAsrSourceWithFollow();
  updatePopupLangAxisSwapButton();
}

/** 與選項頁一致：改聽譯來源時，進階「翻譯提示詞來源」回到跟隨辨識。 */
function persistPopupAsrSourceWithFollow() {
  if (!storageLocal) {
    return;
  }
  const asr = vltNormalizeAsrSourceLang(elPopupAsr?.value);
  const tgt = vltNormalizeTranslateTargetLang(elPopupTgt?.value);
  storageLocal.set({
    [VLTConstants.KEY_VLT_ASR_SOURCE_LANG]: asr,
    [VLTConstants.KEY_VLT_TRANSLATE_TARGET_LANG]: tgt,
    [VLTConstants.KEY_VLT_TRANSLATE_SOURCE_LANG]: "follow",
  });
}

/** 僅更新譯為語言，不覆寫進階的翻譯提示詞來源（與選項頁僅改目標時相同）。 */
function persistPopupTranslateTargetOnly() {
  if (!storageLocal) {
    return;
  }
  const tgt = vltNormalizeTranslateTargetLang(elPopupTgt?.value);
  storageLocal.set({
    [VLTConstants.KEY_VLT_TRANSLATE_TARGET_LANG]: tgt,
  });
}

initPopupChunkSecControl();
fillPopupLocaleSelects();
updatePopupLangAxisSwapButton();
if (popupLangAxisHintEl) {
  popupLangAxisHintEl.textContent = VLTMessages.popupLangAxisHint();
}

if (elPopupAsr) {
  elPopupAsr.addEventListener("change", () => {
    persistPopupAsrSourceWithFollow();
    updatePopupLangAxisSwapButton();
  });
}
if (elPopupTgt) {
  elPopupTgt.addEventListener("change", () => {
    persistPopupTranslateTargetOnly();
  });
}
if (btnPopupLangAxisSwap) {
  btnPopupLangAxisSwap.addEventListener("click", () => {
    swapPopupLangAxis();
  });
}
if (elPopupChunkSec) {
  elPopupChunkSec.addEventListener("input", () => {
    const sec = clampPopupChunkSec(elPopupChunkSec.value);
    if (elPopupChunkSecVal) {
      elPopupChunkSecVal.textContent = `${sec}s`;
    }
  });
  elPopupChunkSec.addEventListener("change", () => {
    persistPopupChunkSecFromControl();
  });
}

function openOptionsFromEvent(e) {
  if (e) {
    e.preventDefault();
  }
  chrome.runtime.openOptionsPage();
}

if (btnSettings) {
  btnSettings.addEventListener("click", () => openOptionsFromEvent());
}
if (linkWhisper) {
  linkWhisper.addEventListener("click", openOptionsFromEvent);
}
if (linkOllama) {
  linkOllama.addEventListener("click", openOptionsFromEvent);
}

function refreshAsrSummary() {
  if (!storageLocal) {
    return;
  }
  storageLocal.get(ASR_CONFIG_STORAGE_KEYS, (r) => {
      if (chrome.runtime.lastError) {
        return;
      }
      const secRaw = Number(r?.[VLTConstants.KEY_HF_CHUNK_SEC]);
      const sec = Number.isFinite(secRaw)
        ? Math.max(
            VLTConstants.CHUNK_SEC_MIN,
            Math.min(VLTConstants.CHUNK_SEC_MAX, secRaw),
          )
        : VLTConstants.CHUNK_SEC_DEFAULT;
      const localU = String(
        r?.[VLTConstants.KEY_VLT_LOCAL_WHISPER_URL] || "",
      ).trim();
      const te = vltNormalizeTranslateEngine(
        r?.[VLTConstants.KEY_VLT_TRANSLATE_ENGINE],
        Boolean(r?.[VLTConstants.KEY_VLT_SKIP_MY_MEMORY]),
      );

      applyPopupLangFromRecord(r);

      if (whisperEndpointEl) {
        whisperEndpointEl.textContent =
          localU || VLTMessages.popupWhisperUnset();
        whisperEndpointEl.classList.toggle("kv__v--mono", Boolean(localU));
        whisperEndpointEl.classList.toggle("kv__v--missing", !localU);
      }
      applyPopupChunkSecToUi(sec);
      if (translatorInfoEl) {
        translatorInfoEl.textContent =
          te === "none"
            ? VLTMessages.popupTranslatorOff()
            : VLTMessages.popupTranslatorOllama();
      }
      if (pipelineBadgeEl) {
        if (localU) {
          pipelineBadgeEl.textContent = "READY";
          pipelineBadgeEl.classList.remove("badge--warn");
        } else {
          pipelineBadgeEl.textContent = "SETUP";
          pipelineBadgeEl.classList.add("badge--warn");
        }
      }
    },
  );
}

if (storageLocal) {
  storageLocal.get([DEBUG_KEY], (r) => {
    if (chrome.runtime.lastError) {
      return;
    }
    debugHud.checked = r[DEBUG_KEY] === true;
  });
  debugHud.addEventListener("change", () => {
    storageLocal.set({ [DEBUG_KEY]: debugHud.checked });
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
      return;
    }
    refreshAsrSummary();
    if (Object.prototype.hasOwnProperty.call(changes, DEBUG_KEY) && debugHud) {
      debugHud.checked = changes[DEBUG_KEY].newValue === true;
    }
  });
  refreshAsrSummary();
} else {
  debugHud.disabled = true;
}

function loadAsrConfigFromStorage() {
  return new Promise((resolve) => {
    if (!storageLocal) {
      resolve({});
      return;
    }
    storageLocal.get(ASR_CONFIG_STORAGE_KEYS, (r) => {
        if (chrome.runtime.lastError) {
          resolve({});
          return;
        }
        resolve(r || {});
      },
    );
  });
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", Boolean(isError));
}

function setCapturingUi(capturing) {
  if (btnStart) {
    btnStart.hidden = capturing;
    btnStart.disabled = false;
  }
  if (btnStop) {
    btnStop.hidden = !capturing;
    btnStop.disabled = !capturing;
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) {
    throw new Error(VLTMessages.errPopupNoActiveTab());
  }
  const url = tab.url || "";
  if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    throw new Error(VLTMessages.errPopupRestrictedPage());
  }
  return tab;
}

async function stopCaptureSilently() {
  try {
    await chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
  } catch (_) {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 280));
}

btnStart.addEventListener("click", async () => {
  setStatus("");
  btnStart.disabled = true;
  try {
    await stopCaptureSilently();
    const tab = await getActiveTab();
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id,
    });
    const asrCfg = await loadAsrConfigFromStorage();
    const translateEngine = vltNormalizeTranslateEngine(
      asrCfg[VLTConstants.KEY_VLT_TRANSLATE_ENGINE],
      Boolean(asrCfg[VLTConstants.KEY_VLT_SKIP_MY_MEMORY]),
    );
    const asrSourceLang = vltNormalizeAsrSourceLang(
      asrCfg[VLTConstants.KEY_VLT_ASR_SOURCE_LANG],
    );
    const rawTrSrc = asrCfg[VLTConstants.KEY_VLT_TRANSLATE_SOURCE_LANG];
    const translateSourceLang =
      rawTrSrc != null && String(rawTrSrc).trim() !== ""
        ? String(rawTrSrc).trim()
        : "";
    const rawTrTgt = asrCfg[VLTConstants.KEY_VLT_TRANSLATE_TARGET_LANG];
    const translateTargetLang =
      rawTrTgt != null && String(rawTrTgt).trim() !== ""
        ? String(rawTrTgt).trim()
        : "";
    const res = await chrome.runtime.sendMessage({
      type: "START_CAPTURE",
      streamId,
      tabId: tab.id,
      hfChunkSec: asrCfg[VLTConstants.KEY_HF_CHUNK_SEC],
      localWhisperUrl:
        asrCfg[VLTConstants.KEY_VLT_LOCAL_WHISPER_URL] || "",
      skipMyMemory: Boolean(asrCfg[VLTConstants.KEY_VLT_SKIP_MY_MEMORY]),
      translateEngine,
      asrSourceLang,
      translateSourceLang,
      translateTargetLang,
      ollamaUrl: String(
        asrCfg[VLTConstants.KEY_VLT_OLLAMA_URL] ||
          VLTConstants.DEFAULT_OLLAMA_URL,
      ).trim(),
      ollamaModel: String(
        asrCfg[VLTConstants.KEY_VLT_OLLAMA_MODEL] ||
          VLTConstants.DEFAULT_OLLAMA_MODEL,
      ).trim(),
    });
    if (!res?.ok) {
      throw new Error(res?.error || VLTMessages.errStartCaptureFallback());
    }
    setCapturingUi(true);
    btnDemo.disabled = false;
    setStatus(VLTMessages.statusPopupCapturing());
  } catch (err) {
    setStatus(String(err?.message || err), true);
    btnStart.disabled = false;
  }
});

btnStop.addEventListener("click", async () => {
  setStatus("");
  btnStop.disabled = true;
  try {
    const res = await chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
    if (!res?.ok) {
      throw new Error(res?.error || VLTMessages.errStopCaptureFallback());
    }
    btnDemo.disabled = true;
    setCapturingUi(false);
    setStatus(VLTMessages.statusPopupStopped());
  } catch (err) {
    setStatus(String(err?.message || err), true);
  } finally {
    if (btnStop) {
      btnStop.disabled = false;
    }
  }
});

btnDemo.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "VLT_SUBTITLE",
    lines: [
      { text: VLTMessages.demoSubtitleLine(), lang: "zh-TW" },
    ],
  });
});
