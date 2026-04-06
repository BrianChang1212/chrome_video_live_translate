/**
 * Map storage `vltTranslateEngine` + legacy `vltSkipMyMemory` to "ollama" | "none".
 * Loaded via importScripts (service worker) or <script> before popup/options.
 */
(function initVltTranslateEngine(global) {
  /**
   * @param {string} [te] raw vltTranslateEngine
   * @param {boolean} [skipLegacy] vltSkipMyMemory
   * @returns {"ollama"|"none"}
   */
  function vltNormalizeTranslateEngine(te, skipLegacy) {
    if (skipLegacy) {
      return "none";
    }
    const s = String(te || "").trim().toLowerCase();
    if (s === "none") {
      return "none";
    }
    return "ollama";
  }

  global.vltNormalizeTranslateEngine = vltNormalizeTranslateEngine;
})(typeof self !== "undefined" ? self : globalThis);
