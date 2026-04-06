/**
 * Ollama / TranslateGemma-style prompt（固定句式 + 多語參數化）。
 * 依賴 VLTLocaleMeta（須先載入 vlt_locale_meta.js）。
 * en／ja／auto → zh-TW 三段原文保留不變；其餘語對走同一套句子模板。
 * @see https://ollama.com/library/translategemma
 */
(function initVltLlmConfig(global) {
  function LM() {
    return global.VLTLocaleMeta;
  }

  const OLLAMA_STREAM_FLAGS = Object.freeze({
    think: false,
    stream: false,
  });

  const OLLAMA_CHAT_OPTIONS = Object.freeze({
    temperature: 0.2,
    num_predict: 768,
  });

  const OLLAMA_GENERATE_OPTIONS = Object.freeze({
    temperature: 0.2,
    num_predict: 1024,
  });

  const TG_LINE1 =
    "You are a professional English (en) to Traditional Chinese (zh-TW) translator. ";
  const TG_LINE2 =
    "Your goal is to accurately convey the meaning and nuances of the original English text ";
  const TG_LINE3 =
    "while adhering to Traditional Chinese grammar, vocabulary, and cultural sensitivities.\n";
  const TG_LINE4 =
    "Produce only the Traditional Chinese translation, without any additional explanations or commentary. ";
  const TG_LINE5 =
    "Please translate the following English text into Traditional Chinese (zh-TW):\n\n\n";

  const JA_LINE1 =
    "You are a professional Japanese (ja) to Traditional Chinese (zh-TW) translator. ";
  const JA_LINE2 =
    "Your goal is to accurately convey the meaning and nuances of the original Japanese text ";
  const JA_LINE3 =
    "while adhering to Traditional Chinese grammar, vocabulary, and cultural sensitivities.\n";
  const JA_LINE4 =
    "Produce only the Traditional Chinese translation, without any additional explanations or commentary. ";
  const JA_LINE5 =
    "Please translate the following Japanese text into Traditional Chinese (zh-TW):\n\n\n";

  const AUTO_LINE1 =
    "You are a professional translator into Traditional Chinese (zh-TW). ";
  const AUTO_LINE2 =
    "The following text may be in English, Japanese, or a mix; translate the full meaning accurately. ";
  const AUTO_LINE3 =
    "Adhere to Traditional Chinese grammar, vocabulary, and cultural sensitivities.\n";
  const AUTO_LINE4 =
    "Produce only the Traditional Chinese translation, without any additional explanations or commentary. ";
  const AUTO_LINE5 =
    "Please translate the following text into Traditional Chinese (zh-TW):\n\n\n";

  /**
   * @param {string} text
   * @param {string} sourceCode
   * @param {string} targetCode
   */
  function buildGenericPairUserContent(text, sourceCode, targetCode) {
    const api = LM();
    if (!api) {
      return TG_LINE1 + TG_LINE2 + TG_LINE3 + TG_LINE4 + TG_LINE5 + text;
    }
    const S = api.metaFor(sourceCode);
    const T = api.metaFor(targetCode);
    return (
      `You are a professional ${S.name} (${S.code}) to ${T.name} (${T.code}) translator. ` +
      `Your goal is to accurately convey the meaning and nuances of the original ${S.adj} text ` +
      `while adhering to ${T.adj} grammar, vocabulary, and cultural sensitivities.\n` +
      `Produce only the ${T.adj} translation, without any additional explanations or commentary. ` +
      `Please translate the following ${S.adj} text into ${T.name} (${T.code}):\n\n\n` +
      text
    );
  }

  /**
   * @param {string} text
   * @param {string} targetCode
   */
  function buildAutoMultilingualUserContent(text, targetCode) {
    const api = LM();
    if (!api) {
      return AUTO_LINE1 + AUTO_LINE2 + AUTO_LINE3 + AUTO_LINE4 + AUTO_LINE5 + text;
    }
    const T = api.metaFor(targetCode);
    return (
      `You are a professional translator into ${T.name} (${T.code}). ` +
      "The following transcript may contain multiple languages (e.g. English, Chinese, Japanese, Korean, Spanish, French, German, Arabic, Hindi, Portuguese, Russian, Thai, Vietnamese, Indonesian, Turkish, Italian, Polish, Dutch, Swedish, Ukrainian, Malay, Filipino, Persian, Hebrew, Czech, Romanian, Greek, Hungarian, Bengali, and other major world languages); detect the meaning and translate accurately into the target language. " +
      `Adhere to ${T.adj} grammar, vocabulary, and cultural sensitivities.\n` +
      `Produce only the ${T.adj} translation, without any additional explanations or commentary. ` +
      `Please translate the following text into ${T.name} (${T.code}):\n\n\n` +
      text
    );
  }

  /**
   * @param {string} [srcText]
   * @param {string} effectiveSourceNorm auto 或 canonical 來源語代碼
   * @param {string} targetCode
   * @returns {string}
   */
  function buildTranslateGemmaUserContent(
    srcText,
    effectiveSourceNorm,
    targetCode,
  ) {
    const text = String(srcText || "");
    const api = LM();
    const tk = api ? api.normalizeLangCode(targetCode) : "zh-TW";
    const eff =
      effectiveSourceNorm === "auto"
        ? "auto"
        : api
          ? api.metaFor(effectiveSourceNorm).code
          : String(effectiveSourceNorm || "en");

    if (tk === "zh-TW") {
      if (eff === "ja") {
        return JA_LINE1 + JA_LINE2 + JA_LINE3 + JA_LINE4 + JA_LINE5 + text;
      }
      if (eff === "en") {
        return TG_LINE1 + TG_LINE2 + TG_LINE3 + TG_LINE4 + TG_LINE5 + text;
      }
      if (eff === "auto") {
        return AUTO_LINE1 + AUTO_LINE2 + AUTO_LINE3 + AUTO_LINE4 + AUTO_LINE5 + text;
      }
      return buildGenericPairUserContent(text, eff, tk);
    }

    if (eff === "auto") {
      return buildAutoMultilingualUserContent(text, tk);
    }
    return buildGenericPairUserContent(text, eff, tk);
  }

  function buildTranslateGemmaEnZhTwUserContent(src) {
    return buildTranslateGemmaUserContent(src, "en", "zh-TW");
  }

  function buildTranslateGemmaJaZhTwUserContent(src) {
    return buildTranslateGemmaUserContent(src, "ja", "zh-TW");
  }

  function buildTranslateGemmaAutoZhTwUserContent(src) {
    return buildTranslateGemmaUserContent(src, "auto", "zh-TW");
  }

  global.VLTLLM = Object.freeze({
    ollamaStreamFlags: OLLAMA_STREAM_FLAGS,
    ollamaChatOptions: OLLAMA_CHAT_OPTIONS,
    ollamaGenerateOptions: OLLAMA_GENERATE_OPTIONS,
    buildTranslateGemmaUserContent,
    buildTranslateGemmaEnZhTwUserContent,
    buildTranslateGemmaJaZhTwUserContent,
    buildTranslateGemmaAutoZhTwUserContent,
  });
})(typeof self !== "undefined" ? self : globalThis);
