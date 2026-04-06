/**
 * 熱門語系：Whisper 參數、Ollama 提示詞英文名稱、繁中 UI 標籤。
 * 須於 vlt_messages.js、vlt_source_lang.js、vlt_llm_config.js 之前載入。
 */
(function initVltLocaleMeta(global) {
  /** @typedef {{ code: string, whisper: string, name: string, adj: string, labelZh: string }} VltLangRow */

  /** @type {VltLangRow[]} */
  const LIST = [
    {
      code: "zh-TW",
      whisper: "zh",
      name: "Traditional Chinese",
      adj: "Traditional Chinese",
      labelZh: "繁體中文（台灣）",
    },
    {
      code: "zh-CN",
      whisper: "zh",
      name: "Simplified Chinese",
      adj: "Simplified Chinese",
      labelZh: "簡體中文",
    },
    {
      code: "en",
      whisper: "en",
      name: "English",
      adj: "English",
      labelZh: "英文",
    },
    {
      code: "ja",
      whisper: "ja",
      name: "Japanese",
      adj: "Japanese",
      labelZh: "日文",
    },
    {
      code: "ko",
      whisper: "ko",
      name: "Korean",
      adj: "Korean",
      labelZh: "韓文",
    },
    {
      code: "es",
      whisper: "es",
      name: "Spanish",
      adj: "Spanish",
      labelZh: "西班牙文",
    },
    {
      code: "fr",
      whisper: "fr",
      name: "French",
      adj: "French",
      labelZh: "法文",
    },
    {
      code: "de",
      whisper: "de",
      name: "German",
      adj: "German",
      labelZh: "德文",
    },
    {
      code: "pt",
      whisper: "pt",
      name: "Portuguese",
      adj: "Portuguese",
      labelZh: "葡萄牙文",
    },
    {
      code: "ru",
      whisper: "ru",
      name: "Russian",
      adj: "Russian",
      labelZh: "俄文",
    },
    {
      code: "ar",
      whisper: "ar",
      name: "Arabic",
      adj: "Arabic",
      labelZh: "阿拉伯文",
    },
    {
      code: "hi",
      whisper: "hi",
      name: "Hindi",
      adj: "Hindi",
      labelZh: "印地語（印度）",
    },
    {
      code: "th",
      whisper: "th",
      name: "Thai",
      adj: "Thai",
      labelZh: "泰文",
    },
    {
      code: "vi",
      whisper: "vi",
      name: "Vietnamese",
      adj: "Vietnamese",
      labelZh: "越南文",
    },
    {
      code: "id",
      whisper: "id",
      name: "Indonesian",
      adj: "Indonesian",
      labelZh: "印尼文",
    },
    {
      code: "it",
      whisper: "it",
      name: "Italian",
      adj: "Italian",
      labelZh: "義大利文",
    },
    {
      code: "tr",
      whisper: "tr",
      name: "Turkish",
      adj: "Turkish",
      labelZh: "土耳其文",
    },
    {
      code: "pl",
      whisper: "pl",
      name: "Polish",
      adj: "Polish",
      labelZh: "波蘭文",
    },
    {
      code: "nl",
      whisper: "nl",
      name: "Dutch",
      adj: "Dutch",
      labelZh: "荷蘭文",
    },
    {
      code: "sv",
      whisper: "sv",
      name: "Swedish",
      adj: "Swedish",
      labelZh: "瑞典文",
    },
    {
      code: "uk",
      whisper: "uk",
      name: "Ukrainian",
      adj: "Ukrainian",
      labelZh: "烏克蘭文",
    },
    {
      code: "ms",
      whisper: "ms",
      name: "Malay",
      adj: "Malay",
      labelZh: "馬來文",
    },
    {
      code: "fil",
      whisper: "tl",
      name: "Filipino",
      adj: "Filipino",
      labelZh: "菲律賓文（他加祿）",
    },
    {
      code: "fa",
      whisper: "fa",
      name: "Persian",
      adj: "Persian",
      labelZh: "波斯文",
    },
    {
      code: "he",
      whisper: "he",
      name: "Hebrew",
      adj: "Hebrew",
      labelZh: "希伯來文",
    },
    {
      code: "cs",
      whisper: "cs",
      name: "Czech",
      adj: "Czech",
      labelZh: "捷克文",
    },
    {
      code: "ro",
      whisper: "ro",
      name: "Romanian",
      adj: "Romanian",
      labelZh: "羅馬尼亞文",
    },
    {
      code: "el",
      whisper: "el",
      name: "Greek",
      adj: "Greek",
      labelZh: "希臘文",
    },
    {
      code: "hu",
      whisper: "hu",
      name: "Hungarian",
      adj: "Hungarian",
      labelZh: "匈牙利文",
    },
    {
      code: "bn",
      whisper: "bn",
      name: "Bengali",
      adj: "Bengali",
      labelZh: "孟加拉文",
    },
  ];

  /** @type {Record<string, VltLangRow>} */
  const BY_CODE = {};
  for (const row of LIST) {
    BY_CODE[row.code] = row;
  }

  const ALIASES = Object.freeze({
    jp: "ja",
    kr: "ko",
    zhtw: "zh-TW",
    zhcn: "zh-CN",
    cmn: "zh-CN",
    "zh-hans": "zh-CN",
    "zh-hant": "zh-TW",
    tl: "fil",
    filipino: "fil",
    tagalog: "fil",
    in: "id",
    ind: "id",
    spa: "es",
    fra: "fr",
    deu: "de",
    por: "pt",
    rus: "ru",
    ara: "ar",
    hin: "hi",
    vie: "vi",
    may: "ms",
    fas: "fa",
    pes: "fa",
    iw: "he",
    ell: "el",
    gre: "el",
  });

  /**
   * 辨識語言下拉值 → canonical；無法辨識則 auto（不把未知當成繁中）。
   * @param {unknown} raw
   * @returns {string}
   */
  function normalizeAsrSelection(raw) {
    const t = String(raw || "").trim();
    if (!t) {
      return "auto";
    }
    const low = t.toLowerCase();
    if (low === "auto") {
      return "auto";
    }
    if (BY_CODE[t]) {
      return t;
    }
    for (const row of LIST) {
      if (row.code.toLowerCase() === low) {
        return row.code;
      }
    }
    const a = ALIASES[low];
    if (a && BY_CODE[a]) {
      return a;
    }
    return "auto";
  }

  /**
   * 使用者輸入是否為已知語系（翻譯來源／目標）。
   * @param {unknown} raw
   * @returns {string | null}
   */
  function canonicalFromUserInput(raw) {
    const t = String(raw || "").trim().toLowerCase();
    if (!t) {
      return null;
    }
    for (const row of LIST) {
      if (row.code.toLowerCase() === t) {
        return row.code;
      }
    }
    const a = ALIASES[t];
    if (a && BY_CODE[a]) {
      return a;
    }
    return null;
  }

  /**
   * @param {unknown} raw
   * @returns {string} 內部 canonical code（預設 zh-TW）
   */
  function normalizeLangCode(raw) {
    let s = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    if (!s) {
      return "zh-TW";
    }
    if (ALIASES[s]) {
      s = ALIASES[s];
    }
    if (BY_CODE[s]) {
      return s;
    }
    const cand = s.slice(0, 2) + s.slice(2).replace(/^-/, "");
    if (BY_CODE[cand]) {
      return cand;
    }
    const two = s.slice(0, 2);
    const match = LIST.find((r) => r.code.toLowerCase() === s || r.whisper === two);
    if (match) {
      return match.code;
    }
    return "zh-TW";
  }

  /**
   * @param {string} code
   * @returns {VltLangRow}
   */
  function metaFor(code) {
    const c = normalizeLangCode(code);
    return BY_CODE[c] || BY_CODE["zh-TW"];
  }

  /**
   * @param {string} code
   * @returns {boolean}
   */
  function isKnownLangCode(code) {
    return canonicalFromUserInput(code) != null;
  }

  /**
   * @param {unknown} raw
   * @returns {string}
   */
  function vltLangLabelZh(raw) {
    const m = metaFor(raw);
    return m.labelZh;
  }

  /**
   * ASR 選項值（canonical）→ whisper-server `language`
   * @param {string} asrCanonical
   * @returns {string}
   */
  function whisperParamForAsr(asrCanonical) {
    if (!asrCanonical || asrCanonical === "auto") {
      return "auto";
    }
    const m = metaFor(asrCanonical);
    return m.whisper || "auto";
  }

  /**
   * 浮層／摘要用短徽章
   * @param {string} code
   * @returns {string}
   */
  function langBadge(code) {
    const c = metaFor(code).code;
    if (c === "zh-CN" || c === "zh-TW") {
      return c.toUpperCase();
    }
    const base = c.split("-")[0] || c;
    return base.length <= 3 ? base.toUpperCase() : base.slice(0, 3).toUpperCase();
  }

  global.VLTLocaleMeta = Object.freeze({
    LIST,
    BY_CODE,
    normalizeLangCode,
    normalizeAsrSelection,
    canonicalFromUserInput,
    metaFor,
    isKnownLangCode,
    whisperParamForAsr,
    langBadge,
  });
  global.vltLangLabelZh = vltLangLabelZh;
})(typeof self !== "undefined" ? self : globalThis);
