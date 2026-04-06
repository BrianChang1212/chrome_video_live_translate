/* global VLTConstants, VLTLocaleMeta, VLTMessages, vltNormalizeTranslateEngine, vltNormalizeAsrSourceLang, vltNormalizeTranslateSourcePreference, vltNormalizeTranslateTargetLang */

/** 舊版字幕專用不透明度；儲存時會移除，改由 debugPanelOpacityPct 統一 */
const LEGACY_CAPTION_OPACITY_KEY = VLTConstants.KEY_LEGACY_CAPTION_OPACITY;

const KEYS = {
  hfChunkSec: VLTConstants.KEY_HF_CHUNK_SEC,
  vltLocalWhisperUrl: VLTConstants.KEY_VLT_LOCAL_WHISPER_URL,
  vltSkipMyMemory: VLTConstants.KEY_VLT_SKIP_MY_MEMORY,
  vltTranslateEngine: VLTConstants.KEY_VLT_TRANSLATE_ENGINE,
  vltOllamaUrl: VLTConstants.KEY_VLT_OLLAMA_URL,
  vltOllamaModel: VLTConstants.KEY_VLT_OLLAMA_MODEL,
  vltAsrSourceLang: VLTConstants.KEY_VLT_ASR_SOURCE_LANG,
  vltTranslateSourceLang: VLTConstants.KEY_VLT_TRANSLATE_SOURCE_LANG,
  vltTranslateTargetLang: VLTConstants.KEY_VLT_TRANSLATE_TARGET_LANG,
  captionFontFamily: VLTConstants.KEY_CAPTION_FONT_FAMILY,
  captionFontDynamic: VLTConstants.KEY_CAPTION_FONT_DYNAMIC,
  captionFontMinPx: VLTConstants.KEY_CAPTION_FONT_MIN_PX,
  captionFontMaxPx: VLTConstants.KEY_CAPTION_FONT_MAX_PX,
  captionFontVw: VLTConstants.KEY_CAPTION_FONT_VW,
  captionFontPx: VLTConstants.KEY_CAPTION_FONT_PX,
  captionBoxWidthPx: VLTConstants.KEY_CAPTION_BOX_WIDTH_PX,
  debugPanelOpacityPct: VLTConstants.KEY_DEBUG_PANEL_OPACITY,
};

const elChunk = document.getElementById("hfChunkSec");
const chunkSecLabel = document.getElementById("chunkSecLabel");
const captionWidthLabel = document.getElementById("captionWidthLabel");
const firstUsePanel = document.getElementById("firstUsePanel");
const btnFirstUseTutorial = document.getElementById("btnFirstUseTutorial");
const elLocalWhisperUrl = document.getElementById("vltLocalWhisperUrl");
const elAsrSourceLang = document.getElementById("vltAsrSourceLang");
const elTranslateSourceLang = document.getElementById("vltTranslateSourceLang");
const elTranslateTargetLang = document.getElementById("vltTranslateTargetLang");
const btnLangAxisSwap = document.getElementById("vltLangAxisSwap");
const elTranslateEngine = document.getElementById("vltTranslateEngine");

function fillLocaleSelects() {
  const M = globalThis.VLTLocaleMeta;
  if (!M || !Array.isArray(M.LIST)) {
    return;
  }
  const L = M.LIST;
  if (elAsrSourceLang) {
    elAsrSourceLang.innerHTML =
      '<option value="auto">自動偵測</option>' +
      L.map(
        (x) =>
          `<option value="${x.code}">${x.labelZh}</option>`,
      ).join("");
  }
  if (elTranslateTargetLang) {
    elTranslateTargetLang.innerHTML = L.map(
      (x) => `<option value="${x.code}">${x.labelZh}</option>`,
    ).join("");
  }
  if (elTranslateSourceLang) {
    elTranslateSourceLang.innerHTML =
      '<option value="follow">與辨識語言相同（預設）</option>' +
      '<option value="auto">自動偵測（多語混合稿）</option>' +
      L.map(
        (x) =>
          `<option value="${x.code}">${x.labelZh}（翻譯提示詞）</option>`,
      ).join("");
  }
}

fillLocaleSelects();
updateOptionsLangAxisSwapButton();

const LANG_SYNC_KEYS = [
  KEYS.vltAsrSourceLang,
  KEYS.vltTranslateSourceLang,
  KEYS.vltTranslateTargetLang,
];

function applyLangFieldsFromRecord(r) {
  if (!r) {
    return;
  }
  const srcLang = vltNormalizeAsrSourceLang(r[KEYS.vltAsrSourceLang]);
  if (
    elAsrSourceLang &&
    [...elAsrSourceLang.options].some((o) => o.value === srcLang)
  ) {
    elAsrSourceLang.value = srcLang;
  }
  const trSrcPref = vltNormalizeTranslateSourcePreference(
    r[KEYS.vltTranslateSourceLang],
  );
  if (
    elTranslateSourceLang &&
    [...elTranslateSourceLang.options].some((o) => o.value === trSrcPref)
  ) {
    elTranslateSourceLang.value = trSrcPref;
  }
  const trTgt = vltNormalizeTranslateTargetLang(r[KEYS.vltTranslateTargetLang]);
  if (
    elTranslateTargetLang &&
    [...elTranslateTargetLang.options].some((o) => o.value === trTgt)
  ) {
    elTranslateTargetLang.value = trTgt;
  }
  updateOptionsLangAxisSwapButton();
}

function updateOptionsLangAxisSwapButton() {
  if (!btnLangAxisSwap || !elAsrSourceLang) {
    return;
  }
  const auto = vltNormalizeAsrSourceLang(elAsrSourceLang.value) === "auto";
  btnLangAxisSwap.disabled = auto;
  btnLangAxisSwap.setAttribute(
    "aria-label",
    VLTMessages.langAxisSwapTitle(),
  );
  btnLangAxisSwap.title = auto
    ? VLTMessages.langAxisSwapNeedConcreteSource()
    : VLTMessages.langAxisSwapTitle();
}

function swapOptionsLangAxis() {
  if (!elAsrSourceLang || !elTranslateTargetLang) {
    return;
  }
  const asr = vltNormalizeAsrSourceLang(elAsrSourceLang.value);
  if (asr === "auto") {
    return;
  }
  const tgt = vltNormalizeTranslateTargetLang(elTranslateTargetLang.value);
  elAsrSourceLang.value = tgt;
  elTranslateTargetLang.value = asr;
  onOptionsPrimaryAsrChange();
}

function persistLangAxisToStorage() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }
  const asr = vltNormalizeAsrSourceLang(elAsrSourceLang?.value);
  const tgt = vltNormalizeTranslateTargetLang(elTranslateTargetLang?.value);
  const trPref = vltNormalizeTranslateSourcePreference(
    elTranslateSourceLang?.value,
  );
  chrome.storage.local.set({
    [KEYS.vltAsrSourceLang]: asr,
    [KEYS.vltTranslateTargetLang]: tgt,
    [KEYS.vltTranslateSourceLang]: trPref,
  });
}

function onOptionsPrimaryAsrChange() {
  if (elTranslateSourceLang) {
    elTranslateSourceLang.value = "follow";
  }
  persistLangAxisToStorage();
  updateOptionsLangAxisSwapButton();
}

if (elAsrSourceLang) {
  elAsrSourceLang.addEventListener("change", onOptionsPrimaryAsrChange);
}
if (elTranslateTargetLang) {
  elTranslateTargetLang.addEventListener("change", () => {
    persistLangAxisToStorage();
    updateOptionsLangAxisSwapButton();
  });
}
if (btnLangAxisSwap) {
  btnLangAxisSwap.addEventListener("click", () => {
    swapOptionsLangAxis();
  });
}
if (elTranslateSourceLang) {
  elTranslateSourceLang.addEventListener("change", () => {
    persistLangAxisToStorage();
  });
}

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
      return;
    }
    if (!LANG_SYNC_KEYS.some((k) => Object.prototype.hasOwnProperty.call(changes, k))) {
      return;
    }
    chrome.storage.local.get(LANG_SYNC_KEYS, (full) => {
      if (chrome.runtime.lastError) {
        return;
      }
      applyLangFieldsFromRecord(full);
    });
  });
}

const elOllamaUrl = document.getElementById("vltOllamaUrl");
const elOllamaModel = document.getElementById("vltOllamaModel");
const elCaptionFontFamily = document.getElementById("captionFontFamily");
const elCaptionFontDynamic = document.getElementById("captionFontDynamic");
const elCaptionFontMinPx = document.getElementById("captionFontMinPx");
const elCaptionFontMaxPx = document.getElementById("captionFontMaxPx");
const elCaptionFontVw = document.getElementById("captionFontVw");
const elCaptionFontPx = document.getElementById("captionFontPx");
const elCaptionBoxWidthPx = document.getElementById("captionBoxWidthPx");
const elDebugOpacityPct = document.getElementById("vltDebugOpacityPct");
const debugOpacityLabel = document.getElementById("debugOpacityLabel");
const captionDynamicBlock = document.getElementById("captionDynamicBlock");
const captionFixedBlock = document.getElementById("captionFixedBlock");
const btnSave = document.getElementById("btnSave");
const saveStatus = document.getElementById("saveStatus");

const btnCopyOllamaPull = document.getElementById("btnCopyOllamaPull");
if (btnCopyOllamaPull) {
  btnCopyOllamaPull.textContent = `複製：${VLTConstants.DEFAULT_OLLAMA_PULL_CMD}`;
}
if (elChunk) {
  elChunk.min = String(VLTConstants.CHUNK_SEC_MIN);
  elChunk.max = String(VLTConstants.CHUNK_SEC_MAX);
  elChunk.step = String(VLTConstants.CHUNK_SEC_STEP);
  elChunk.setAttribute(
    "aria-valuemin",
    String(VLTConstants.CHUNK_SEC_MIN),
  );
  elChunk.setAttribute(
    "aria-valuemax",
    String(VLTConstants.CHUNK_SEC_MAX),
  );
  elChunk.value = String(VLTConstants.CHUNK_SEC_DEFAULT);
  syncChunkLabel();
}
if (elOllamaUrl) {
  elOllamaUrl.placeholder = VLTConstants.DEFAULT_OLLAMA_URL;
}
if (elOllamaModel) {
  elOllamaModel.placeholder = VLTConstants.DEFAULT_OLLAMA_MODEL;
}

if (elCaptionFontMinPx) {
  elCaptionFontMinPx.min = String(VLTConstants.UI_CAPTION_FONT_MIN_CLAMP_LO);
  elCaptionFontMinPx.max = String(VLTConstants.UI_CAPTION_FONT_MIN_CLAMP_HI);
}
if (elCaptionFontMaxPx) {
  elCaptionFontMaxPx.min = String(VLTConstants.UI_CAPTION_FONT_MAX_CLAMP_LO);
  elCaptionFontMaxPx.max = String(VLTConstants.UI_CAPTION_FONT_MAX_CLAMP_HI);
}
if (elCaptionFontVw) {
  elCaptionFontVw.min = String(VLTConstants.UI_CAPTION_FONT_VW_CLAMP_LO);
  elCaptionFontVw.max = String(VLTConstants.UI_CAPTION_FONT_VW_CLAMP_HI);
  elCaptionFontVw.step = String(VLTConstants.UI_CAPTION_FONT_VW_STEP);
}
if (elCaptionFontPx) {
  elCaptionFontPx.min = String(VLTConstants.UI_CAPTION_FONT_PX_CLAMP_LO);
  elCaptionFontPx.max = String(VLTConstants.UI_CAPTION_FONT_PX_CLAMP_HI);
}
if (elCaptionBoxWidthPx) {
  elCaptionBoxWidthPx.min = String(VLTConstants.UI_CAPTION_BOX_MIN_PX);
  elCaptionBoxWidthPx.max = String(VLTConstants.UI_CAPTION_BOX_MAX_PX);
  elCaptionBoxWidthPx.step = String(VLTConstants.UI_CAPTION_BOX_STEP_PX);
}
if (elDebugOpacityPct) {
  elDebugOpacityPct.min = String(VLTConstants.UI_OPACITY_MIN_PCT);
  elDebugOpacityPct.max = String(VLTConstants.UI_OPACITY_MAX_PCT);
  elDebugOpacityPct.step = "1";
}

function setSaveStatus(text, kind) {
  if (!saveStatus) {
    return;
  }
  saveStatus.textContent = text;
  saveStatus.classList.remove("ok", "err");
  if (kind === "ok") {
    saveStatus.classList.add("ok");
  }
  if (kind === "err") {
    saveStatus.classList.add("err");
  }
}

function wireClipboardButton(buttonEl, textOrGetter) {
  if (!buttonEl) {
    return;
  }
  buttonEl.addEventListener("click", () => {
    const text =
      typeof textOrGetter === "function"
        ? textOrGetter()
        : String(textOrGetter);
    navigator.clipboard.writeText(text).then(
      () => setSaveStatus(VLTMessages.clipboardCopied(), "ok"),
      () => setSaveStatus(VLTMessages.clipboardFailed(), "err"),
    );
  });
}

function syncCaptionModeUi() {
  const dyn = Boolean(elCaptionFontDynamic?.checked);
  if (captionDynamicBlock) {
    captionDynamicBlock.hidden = !dyn;
  }
  if (captionFixedBlock) {
    captionFixedBlock.hidden = dyn;
  }
}

function syncChunkLabel() {
  if (!chunkSecLabel || !elChunk) {
    return;
  }
  const v = Math.round(Number(elChunk.value));
  chunkSecLabel.textContent = `${Number.isFinite(v) ? v : VLTConstants.CHUNK_SEC_DEFAULT}s`;
}

function syncCaptionWidthLabel() {
  if (!captionWidthLabel || !elCaptionBoxWidthPx) {
    return;
  }
  const v = Math.round(Number(elCaptionBoxWidthPx.value));
  captionWidthLabel.textContent = `${Number.isFinite(v) ? v : VLTConstants.UI_CAPTION_BOX_DEFAULT_PX}px`;
}

function syncDebugOpacityLabel() {
  if (!debugOpacityLabel || !elDebugOpacityPct) {
    return;
  }
  const v = Math.round(Number(elDebugOpacityPct.value));
  debugOpacityLabel.textContent = `${Number.isFinite(v) ? v : VLTConstants.UI_OPACITY_DEFAULT_PCT}%`;
}

if (elCaptionFontDynamic) {
  elCaptionFontDynamic.addEventListener("change", syncCaptionModeUi);
}

if (elChunk) {
  elChunk.addEventListener("input", syncChunkLabel);
}

if (elCaptionBoxWidthPx) {
  elCaptionBoxWidthPx.addEventListener("input", syncCaptionWidthLabel);
}

if (elDebugOpacityPct) {
  elDebugOpacityPct.addEventListener("input", syncDebugOpacityLabel);
}

if (btnFirstUseTutorial && firstUsePanel) {
  btnFirstUseTutorial.addEventListener("click", () => {
    const open = firstUsePanel.hidden;
    firstUsePanel.hidden = !open;
    btnFirstUseTutorial.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      firstUsePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

function wirePreCopy(buttonId, preId) {
  const btn = document.getElementById(buttonId);
  const pre = document.getElementById(preId);
  if (!btn || !pre) {
    return;
  }
  wireClipboardButton(btn, () => (pre.textContent || "").trim());
}

wirePreCopy("btnCopyWhisperQuick", "preWhisperQuick");
wirePreCopy("btnCopyOllamaPsQuick", "preOllamaPsQuick");

if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
  const linkDocumentation = document.getElementById("linkDocumentation");
  const linkOptimization = document.getElementById("linkOptimization");
  try {
    if (linkDocumentation) {
      linkDocumentation.href = chrome.runtime.getURL("docs/ONBOARDING.zh-TW.md");
    }
    if (linkOptimization) {
      linkOptimization.href = chrome.runtime.getURL("docs/LOCAL_SETUP.zh-TW.md");
    }
  } catch {
    /* ignore */
  }
}

const CAPTION_LOAD_KEYS = [
  KEYS.captionFontFamily,
  KEYS.captionFontDynamic,
  KEYS.captionFontMinPx,
  KEYS.captionFontMaxPx,
  KEYS.captionFontVw,
  KEYS.captionFontPx,
  KEYS.captionBoxWidthPx,
  KEYS.debugPanelOpacityPct,
  LEGACY_CAPTION_OPACITY_KEY,
];

chrome.storage.local.get(
  [
    KEYS.hfChunkSec,
    KEYS.vltLocalWhisperUrl,
    KEYS.vltSkipMyMemory,
    KEYS.vltTranslateEngine,
    KEYS.vltOllamaUrl,
    KEYS.vltOllamaModel,
    KEYS.vltAsrSourceLang,
    KEYS.vltTranslateSourceLang,
    KEYS.vltTranslateTargetLang,
    ...CAPTION_LOAD_KEYS,
  ],
  (r) => {
    elLocalWhisperUrl.value = r[KEYS.vltLocalWhisperUrl] || "";
    const sec = Number(r[KEYS.hfChunkSec]);
    elChunk.value = Number.isFinite(sec) ? sec : VLTConstants.CHUNK_SEC_DEFAULT;

    const te = vltNormalizeTranslateEngine(
      r[KEYS.vltTranslateEngine],
      Boolean(r[KEYS.vltSkipMyMemory]),
    );
    if (elTranslateEngine && [...elTranslateEngine.options].some((o) => o.value === te)) {
      elTranslateEngine.value = te;
    }
    applyLangFieldsFromRecord(r);
    elOllamaUrl.value = r[KEYS.vltOllamaUrl] || VLTConstants.DEFAULT_OLLAMA_URL;
    elOllamaModel.value =
      r[KEYS.vltOllamaModel] || VLTConstants.DEFAULT_OLLAMA_MODEL;

    const fam = r[KEYS.captionFontFamily] || "system";
    if (elCaptionFontFamily && [...elCaptionFontFamily.options].some((o) => o.value === fam)) {
      elCaptionFontFamily.value = fam;
    }
    elCaptionFontDynamic.checked = r[KEYS.captionFontDynamic] !== false;
    elCaptionFontMinPx.value = Number.isFinite(Number(r[KEYS.captionFontMinPx]))
      ? r[KEYS.captionFontMinPx]
      : VLTConstants.UI_CAPTION_FONT_MIN_DEFAULT;
    elCaptionFontMaxPx.value = Number.isFinite(Number(r[KEYS.captionFontMaxPx]))
      ? r[KEYS.captionFontMaxPx]
      : VLTConstants.UI_CAPTION_FONT_MAX_DEFAULT;
    elCaptionFontVw.value = Number.isFinite(Number(r[KEYS.captionFontVw]))
      ? r[KEYS.captionFontVw]
      : VLTConstants.UI_CAPTION_FONT_VW_DEFAULT;
    elCaptionFontPx.value = Number.isFinite(Number(r[KEYS.captionFontPx]))
      ? r[KEYS.captionFontPx]
      : VLTConstants.UI_CAPTION_FONT_PX_DEFAULT;
    elCaptionBoxWidthPx.value = Number.isFinite(Number(r[KEYS.captionBoxWidthPx]))
      ? r[KEYS.captionBoxWidthPx]
      : VLTConstants.UI_CAPTION_BOX_DEFAULT_PX;
    if (elDebugOpacityPct) {
      const dOp = Math.round(Number(r[KEYS.debugPanelOpacityPct]));
      const cOp = Math.round(Number(r[LEGACY_CAPTION_OPACITY_KEY]));
      let op = VLTConstants.UI_OPACITY_DEFAULT_PCT;
      if (Number.isFinite(dOp)) {
        op = Math.max(
          VLTConstants.UI_OPACITY_MIN_PCT,
          Math.min(VLTConstants.UI_OPACITY_MAX_PCT, dOp),
        );
      } else if (Number.isFinite(cOp)) {
        op = Math.max(
          VLTConstants.UI_OPACITY_MIN_PCT,
          Math.min(VLTConstants.UI_OPACITY_MAX_PCT, cOp),
        );
      }
      elDebugOpacityPct.value = op;
    }
    syncCaptionModeUi();
    syncChunkLabel();
    syncCaptionWidthLabel();
    syncDebugOpacityLabel();
  },
);

const SETUP_CLIPBOARD = [
  ["btnCopyOllamaPull", VLTConstants.DEFAULT_OLLAMA_PULL_CMD],
  ["btnCopyOllamaServe", "ollama serve"],
  [
    "btnCopyOllamaServeCmd",
    "set OLLAMA_ORIGINS=chrome-extension://* && ollama serve",
  ],
];

for (const [id, text] of SETUP_CLIPBOARD) {
  wireClipboardButton(document.getElementById(id), text);
}

btnSave.addEventListener("click", () => {
  const localWhisperUrl = elLocalWhisperUrl?.value.trim() || "";
  const translateEngine = elTranslateEngine?.value || "ollama";
  const asrSourceLang = vltNormalizeAsrSourceLang(elAsrSourceLang?.value);
  const translateSourcePref = vltNormalizeTranslateSourcePreference(
    elTranslateSourceLang?.value,
  );
  const translateTargetLang = vltNormalizeTranslateTargetLang(
    elTranslateTargetLang?.value,
  );
  const ollamaUrl =
    elOllamaUrl?.value.trim() || VLTConstants.DEFAULT_OLLAMA_URL;
  const ollamaModel =
    elOllamaModel?.value.trim() || VLTConstants.DEFAULT_OLLAMA_MODEL;
  let sec = Math.round(Number(elChunk.value));
  if (!Number.isFinite(sec)) {
    sec = VLTConstants.CHUNK_SEC_DEFAULT;
  }
  sec = Math.max(
    VLTConstants.CHUNK_SEC_MIN,
    Math.min(VLTConstants.CHUNK_SEC_MAX, sec),
  );

  const captionFontFamily = elCaptionFontFamily?.value || "system";
  const captionFontDynamic = Boolean(elCaptionFontDynamic?.checked);
  let captionFontMinPx = Math.round(Number(elCaptionFontMinPx?.value));
  let captionFontMaxPx = Math.round(Number(elCaptionFontMaxPx?.value));
  let captionFontVw = Number(elCaptionFontVw?.value);
  let captionFontPx = Math.round(Number(elCaptionFontPx?.value));
  let captionBoxWidthPx = Math.round(Number(elCaptionBoxWidthPx?.value));

  if (!Number.isFinite(captionFontMinPx)) {
    captionFontMinPx = VLTConstants.UI_CAPTION_FONT_MIN_DEFAULT;
  }
  if (!Number.isFinite(captionFontMaxPx)) {
    captionFontMaxPx = VLTConstants.UI_CAPTION_FONT_MAX_DEFAULT;
  }
  if (!Number.isFinite(captionFontVw)) {
    captionFontVw = VLTConstants.UI_CAPTION_FONT_VW_DEFAULT;
  }
  if (!Number.isFinite(captionFontPx)) {
    captionFontPx = VLTConstants.UI_CAPTION_FONT_PX_DEFAULT;
  }
  if (!Number.isFinite(captionBoxWidthPx)) {
    captionBoxWidthPx = VLTConstants.UI_CAPTION_BOX_DEFAULT_PX;
  }

  captionFontMinPx = Math.max(
    VLTConstants.UI_CAPTION_FONT_MIN_CLAMP_LO,
    Math.min(VLTConstants.UI_CAPTION_FONT_MIN_CLAMP_HI, captionFontMinPx),
  );
  captionFontMaxPx = Math.max(
    VLTConstants.UI_CAPTION_FONT_MAX_CLAMP_LO,
    Math.min(VLTConstants.UI_CAPTION_FONT_MAX_CLAMP_HI, captionFontMaxPx),
  );
  if (
    captionFontMaxPx <
    captionFontMinPx + VLTConstants.UI_CAPTION_FONT_PAIR_MIN_GAP_PX
  ) {
    captionFontMaxPx =
      captionFontMinPx + VLTConstants.UI_CAPTION_FONT_PAIR_MIN_GAP_PX;
  }
  captionFontVw = Math.max(
    VLTConstants.UI_CAPTION_FONT_VW_CLAMP_LO,
    Math.min(VLTConstants.UI_CAPTION_FONT_VW_CLAMP_HI, captionFontVw),
  );
  captionFontPx = Math.max(
    VLTConstants.UI_CAPTION_FONT_PX_CLAMP_LO,
    Math.min(VLTConstants.UI_CAPTION_FONT_PX_CLAMP_HI, captionFontPx),
  );
  captionBoxWidthPx = Math.max(
    VLTConstants.UI_CAPTION_BOX_MIN_PX,
    Math.min(VLTConstants.UI_CAPTION_BOX_MAX_PX, captionBoxWidthPx),
  );

  let debugOpacityPct = Math.round(Number(elDebugOpacityPct?.value));
  if (!Number.isFinite(debugOpacityPct)) {
    debugOpacityPct = VLTConstants.UI_OPACITY_DEFAULT_PCT;
  }
  debugOpacityPct = Math.max(
    VLTConstants.UI_OPACITY_MIN_PCT,
    Math.min(VLTConstants.UI_OPACITY_MAX_PCT, debugOpacityPct),
  );

  chrome.storage.local.set(
    {
      [KEYS.hfChunkSec]: sec,
      [KEYS.vltLocalWhisperUrl]: localWhisperUrl,
      [KEYS.vltTranslateEngine]: translateEngine,
      [KEYS.vltOllamaUrl]: ollamaUrl,
      [KEYS.vltOllamaModel]: ollamaModel,
      [KEYS.vltAsrSourceLang]: asrSourceLang,
      [KEYS.vltTranslateSourceLang]: translateSourcePref,
      [KEYS.vltTranslateTargetLang]: translateTargetLang,
      [KEYS.vltSkipMyMemory]: translateEngine === "none",
      [KEYS.captionFontFamily]: captionFontFamily,
      [KEYS.captionFontDynamic]: captionFontDynamic,
      [KEYS.captionFontMinPx]: captionFontMinPx,
      [KEYS.captionFontMaxPx]: captionFontMaxPx,
      [KEYS.captionFontVw]: captionFontVw,
      [KEYS.captionFontPx]: captionFontPx,
      [KEYS.captionBoxWidthPx]: captionBoxWidthPx,
      [KEYS.debugPanelOpacityPct]: debugOpacityPct,
    },
    () => {
      const err = chrome.runtime.lastError;
      if (err) {
        setSaveStatus(err.message, "err");
        return;
      }
      chrome.storage.local.remove(LEGACY_CAPTION_OPACITY_KEY, () => {
        /* ignore lastError */
      });
      setSaveStatus(VLTMessages.optionsSaveOk(), "ok");
    },
  );
});
