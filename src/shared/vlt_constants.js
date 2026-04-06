/**
 * Cross-context defaults and chrome.storage.local key names (MV3, no bundler).
 * Load before other shared / feature scripts in each context.
 */
(function initVltConstants(global) {
  const DEFAULT_OLLAMA_MODEL = "translategemma:4b";

  const C = {
    DEFAULT_OLLAMA_URL: "http://127.0.0.1:11434",
    DEFAULT_OLLAMA_MODEL,
    DEFAULT_OLLAMA_PULL_CMD: `ollama pull ${DEFAULT_OLLAMA_MODEL}`,

    KEY_DEBUG_HUD: "vlt_debug_hud",
    KEY_DEBUG_PANEL_OPACITY: "vlt_debug_panel_opacity_pct",
    KEY_LEGACY_CAPTION_OPACITY: "vlt_caption_panel_opacity_pct",

    KEY_HF_CHUNK_SEC: "hfChunkSec",
    KEY_VLT_LOCAL_WHISPER_URL: "vltLocalWhisperUrl",
    KEY_VLT_SKIP_MY_MEMORY: "vltSkipMyMemory",
    KEY_VLT_TRANSLATE_ENGINE: "vltTranslateEngine",
    KEY_VLT_OLLAMA_URL: "vltOllamaUrl",
    KEY_VLT_OLLAMA_MODEL: "vltOllamaModel",
    /** whisper `language`：auto | en | ja（見 vlt_source_lang.js） */
    KEY_VLT_ASR_SOURCE_LANG: "vltAsrSourceLang",
    /** Ollama 提示詞來源：follow | auto | en | ja */
    KEY_VLT_TRANSLATE_SOURCE_LANG: "vltTranslateSourceLang",
    /** Ollama 輸出語言：zh-TW | zh-CN | en | ja */
    KEY_VLT_TRANSLATE_TARGET_LANG: "vltTranslateTargetLang",

    KEY_CAPTION_FONT_FAMILY: "vltCaptionFontFamily",
    KEY_CAPTION_FONT_DYNAMIC: "vltCaptionFontDynamic",
    KEY_CAPTION_FONT_MIN_PX: "vltCaptionFontMinPx",
    KEY_CAPTION_FONT_MAX_PX: "vltCaptionFontMaxPx",
    KEY_CAPTION_FONT_VW: "vltCaptionFontVw",
    KEY_CAPTION_FONT_PX: "vltCaptionFontPx",
    KEY_CAPTION_BOX_WIDTH_PX: "vltCaptionBoxWidthPx",

    CHUNK_SEC_MIN: 2,
    CHUNK_SEC_MAX: 12,
    CHUNK_SEC_DEFAULT: 4,
    CHUNK_SEC_STEP: 1,

    /** 除錯面板／字幕浮層共用不透明度（%） */
    UI_OPACITY_MIN_PCT: 35,
    UI_OPACITY_MAX_PCT: 100,
    UI_OPACITY_DEFAULT_PCT: 100,

    /** 字幕外觀：外框寬度（px），與選項頁 range 一致 */
    UI_CAPTION_BOX_MIN_PX: 280,
    UI_CAPTION_BOX_MAX_PX: 920,
    UI_CAPTION_BOX_DEFAULT_PX: 720,
    UI_CAPTION_BOX_STEP_PX: 10,
    /** 浮層上拖曳縮放允許的即時寬度下限（可低於儲存下限） */
    UI_CAPTION_BOX_DRAG_MIN_PX: 240,

    UI_CAPTION_FONT_MIN_DEFAULT: 13,
    UI_CAPTION_FONT_MAX_DEFAULT: 22,
    UI_CAPTION_FONT_VW_DEFAULT: 3.5,
    UI_CAPTION_FONT_PX_DEFAULT: 16,

    UI_CAPTION_FONT_MIN_CLAMP_LO: 10,
    UI_CAPTION_FONT_MIN_CLAMP_HI: 28,
    UI_CAPTION_FONT_MAX_CLAMP_LO: 14,
    UI_CAPTION_FONT_MAX_CLAMP_HI: 40,
    UI_CAPTION_FONT_PAIR_MIN_GAP_PX: 2,

    UI_CAPTION_FONT_VW_CLAMP_LO: 1.5,
    UI_CAPTION_FONT_VW_CLAMP_HI: 8,
    UI_CAPTION_FONT_VW_STEP: 0.1,

    UI_CAPTION_FONT_PX_CLAMP_LO: 11,
    UI_CAPTION_FONT_PX_CLAMP_HI: 32,

    /** 固定字級時字首列相對主字級比例與下限（px） */
    UI_CAPTION_HEAD_FIXED_SCALE: 0.72,
    UI_CAPTION_HEAD_FIXED_MIN_PX: 10,
  };

  global.VLTConstants = Object.freeze(C);
})(typeof self !== "undefined" ? self : globalThis);
