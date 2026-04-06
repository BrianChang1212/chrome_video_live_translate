/**
 * ASR / 翻譯語系偏好（Whisper、Ollama 提示、浮層徽章）。
 * 依賴 VLTLocaleMeta（須先載入 vlt_locale_meta.js）。
 */
(function initVltSourceLang(global) {
  function M() {
    return global.VLTLocaleMeta;
  }

  /**
   * @param {unknown} raw
   * @returns {string}
   */
  function vltNormalizeAsrSourceLang(raw) {
    const api = M();
    if (!api) {
      const s = String(raw || "")
        .trim()
        .toLowerCase();
      if (s === "ja" || s === "jp") {
        return "ja";
      }
      if (s === "en") {
        return "en";
      }
      return "auto";
    }
    return api.normalizeAsrSelection(raw);
  }

  /**
   * @param {unknown} raw
   * @returns {string} follow | auto | canonical code
   */
  function vltNormalizeTranslateSourcePreference(raw) {
    const s = String(raw == null ? "" : raw)
      .trim()
      .toLowerCase();
    if (s === "" || s === "follow" || s === "asr" || s === "sync") {
      return "follow";
    }
    if (s === "auto") {
      return "auto";
    }
    const api = M();
    if (!api) {
      if (s === "ja" || s === "jp") {
        return "ja";
      }
      if (s === "en") {
        return "en";
      }
      return "auto";
    }
    const c = api.canonicalFromUserInput(raw);
    return c != null ? c : "auto";
  }

  /**
   * @param {string} pref
   * @param {string} asrNorm
   * @returns {string}
   */
  function vltEffectiveTranslateSourceForPrompt(pref, asrNorm) {
    if (pref === "follow") {
      return asrNorm === "auto" ? "auto" : asrNorm;
    }
    return pref;
  }

  /**
   * @param {unknown} raw
   * @returns {string}
   */
  function vltNormalizeTranslateTargetLang(raw) {
    const api = M();
    if (!api) {
      const s = String(raw || "")
        .trim()
        .toLowerCase();
      if (s === "zh-cn" || s === "zhcn" || s === "cn") {
        return "zh-CN";
      }
      if (s === "en") {
        return "en";
      }
      if (s === "ja" || s === "jp") {
        return "ja";
      }
      return "zh-TW";
    }
    return api.normalizeLangCode(raw);
  }

  /**
   * @param {string} asrNorm
   * @returns {string}
   */
  function vltWhisperLanguageParam(asrNorm) {
    if (!asrNorm || asrNorm === "auto") {
      return "auto";
    }
    const api = M();
    if (!api) {
      return asrNorm;
    }
    return api.whisperParamForAsr(asrNorm);
  }

  /**
   * @param {string} asrNorm
   * @returns {string}
   */
  function vltSourceLangBadge(asrNorm) {
    if (!asrNorm || asrNorm === "auto") {
      return "AUTO";
    }
    const api = M();
    if (!api) {
      return String(asrNorm).toUpperCase().slice(0, 8);
    }
    return api.langBadge(asrNorm);
  }

  /**
   * @param {string} code
   * @returns {string}
   */
  function vltTranslateTargetBadge(code) {
    const api = M();
    const c = vltNormalizeTranslateTargetLang(code);
    if (!api) {
      return String(c).toUpperCase().slice(0, 10);
    }
    return api.langBadge(c);
  }

  global.vltNormalizeAsrSourceLang = vltNormalizeAsrSourceLang;
  global.vltNormalizeTranslateSourcePreference =
    vltNormalizeTranslateSourcePreference;
  global.vltEffectiveTranslateSourceForPrompt =
    vltEffectiveTranslateSourceForPrompt;
  global.vltNormalizeTranslateTargetLang = vltNormalizeTranslateTargetLang;
  global.vltWhisperLanguageParam = vltWhisperLanguageParam;
  global.vltSourceLangBadge = vltSourceLangBadge;
  global.vltTranslateTargetBadge = vltTranslateTargetBadge;
})(typeof self !== "undefined" ? self : globalThis);
