/**
 * Local-only pipeline in the service worker: whisper-server ASR + Ollama translation.
 * Loaded via importScripts from service_worker.js.
 */
/* global VLTConstants, VLTLLM, VLTMessages, vltWhisperLanguageParam, vltNormalizeAsrSourceLang, vltNormalizeTranslateSourcePreference, vltEffectiveTranslateSourceForPrompt, vltNormalizeTranslateTargetLang */

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * whisper.cpp HTTP server: POST multipart to {base}/inference.
 * @param {ArrayBuffer} wavBuffer
 * @param {string} baseUrl e.g. http://127.0.0.1:8080
 * @param {string} [language] whisper `language`：auto、en、ja 等
 * @returns {Promise<string>}
 */
async function transcribeWhisperCppServerWav(wavBuffer, baseUrl, language) {
  const root = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(root)) {
    throw new Error(VLTMessages.errWhisperUrlScheme());
  }
  const url = `${root}/inference`;
  const blob = new Blob([wavBuffer], { type: "audio/wav" });
  const fd = new FormData();
  fd.append("file", blob, "chunk.wav");
  fd.append("response_format", "json");
  fd.append("language", String(language || "auto"));
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      body: fd,
      cache: "no-store",
    });
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    throw new Error(VLTMessages.errWhisperConnect(msg));
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      VLTMessages.errWhisperHttp(res.status, text.slice(0, 220)),
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    throw new Error(VLTMessages.errWhisperNotJson(text.slice(0, 120)));
  }
  if (parsed && typeof parsed.error === "string") {
    throw new Error(parsed.error);
  }
  if (parsed && typeof parsed.text === "string") {
    return parsed.text.trim();
  }
  return "";
}

function stripThinkBlocks(s) {
  const ot = "<" + "think" + ">";
  const ct = "<" + "/" + "think" + ">";
  const re = new RegExp(ot + "[\\s\\S]*?" + ct, "gi");
  return String(s || "").replace(re, "").trim();
}

function parseOllamaJsonResponse(raw) {
  const t = String(raw || "").trim();
  if (!t) {
    throw new Error(VLTMessages.errOllamaResponseEmpty());
  }
  try {
    return JSON.parse(t);
  } catch (_) {
    const lines = t.split("\n");
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i].trim();
      if (!line.startsWith("{")) {
        continue;
      }
      try {
        return JSON.parse(line);
      } catch (_) {
        /* continue */
      }
    }
    throw new Error(VLTMessages.errOllamaJsonParse(t.slice(0, 100)));
  }
}

function ollamaChatContentToString(content) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const parts = [];
    for (const p of content) {
      if (typeof p === "string") {
        parts.push(p);
      } else if (p && typeof p === "object") {
        const o = /** @type {{ text?: string, content?: string }} */ (p);
        if (typeof o.text === "string") {
          parts.push(o.text);
        } else if (typeof o.content === "string") {
          parts.push(o.content);
        }
      }
    }
    return parts.join("");
  }
  return "";
}

function ollamaHttpError(label, res, raw) {
  const snippet = String(raw || "").slice(0, 120);
  if (res.status === 403) {
    return new Error(VLTMessages.errOllamaForbidden(label, snippet));
  }
  return new Error(VLTMessages.errOllamaHttpLine(label, res.status, snippet));
}

/**
 * @param {string} root
 * @param {string} model
 * @param {string} userContent
 */
async function ollamaChatTranslate(root, model, userContent) {
  const body = {
    model,
    ...VLTLLM.ollamaStreamFlags,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    options: { ...VLTLLM.ollamaChatOptions },
  };
  const res = await fetch(`${root}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const raw = await res.text();
  if (!res.ok) {
    throw ollamaHttpError(VLTMessages.labelOllamaChat, res, raw);
  }
  const parsed = parseOllamaJsonResponse(raw);
  if (parsed?.error) {
    throw new Error(
      VLTMessages.errOllamaServer(String(parsed.error).slice(0, 200)),
    );
  }
  let out = ollamaChatContentToString(parsed?.message?.content);
  out = stripThinkBlocks(out);
  if (!out.trim() && typeof parsed?.message?.thinking === "string") {
    out = stripThinkBlocks(parsed.message.thinking);
  }
  return out.trim().replace(/^["「]|["」]$/g, "").trim();
}

/**
 * @param {string} root
 * @param {string} model
 * @param {string} userContent
 */
async function ollamaGenerateTranslate(root, model, userContent) {
  const body = {
    model,
    ...VLTLLM.ollamaStreamFlags,
    prompt: userContent,
    options: { ...VLTLLM.ollamaGenerateOptions },
  };
  const res = await fetch(`${root}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const raw = await res.text();
  if (!res.ok) {
    throw ollamaHttpError(VLTMessages.labelOllamaGenerate, res, raw);
  }
  const parsed = parseOllamaJsonResponse(raw);
  if (parsed?.error) {
    throw new Error(
      VLTMessages.errOllamaServer(String(parsed.error).slice(0, 200)),
    );
  }
  const out =
    typeof parsed?.response === "string" ? stripThinkBlocks(parsed.response).trim() : "";
  if (!out) {
    throw new Error(VLTMessages.errOllamaGenerateEmpty());
  }
  return out.replace(/^["「]|["」]$/g, "").trim();
}

async function translateOllamaToTarget(
  text,
  baseUrl,
  modelName,
  effectiveSourceNorm,
  targetLangNorm,
) {
  const root = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(root)) {
    throw new Error(VLTMessages.errOllamaUrlScheme());
  }
  const model = String(modelName || "").trim();
  if (!model) {
    throw new Error(VLTMessages.errOllamaModelMissing());
  }
  const src = text.slice(0, 8000);
  const userContent = VLTLLM.buildTranslateGemmaUserContent(
    src,
    effectiveSourceNorm,
    targetLangNorm,
  );
  let firstErr = null;
  let out = "";
  try {
    out = await ollamaChatTranslate(root, model, userContent);
  } catch (e) {
    firstErr = e;
  }
  if (!out) {
    try {
      out = await ollamaGenerateTranslate(root, model, userContent);
    } catch (e2) {
      const a = firstErr ? String(firstErr?.message || firstErr) : "";
      const b = String(e2?.message || e2);
      throw new Error(VLTMessages.errOllamaChatAndGenerateFail(a, b));
    }
  }
  return out;
}

/**
 * @param {{
 *   wavBase64: string,
 *   localWhisperUrl?: string,
 *   translateEngine?: string,
 *   skipMyMemory?: boolean,
 *   ollamaUrl?: string,
 *   ollamaModel?: string,
 *   asrSourceLang?: string,
 *   translateSourceLang?: string,
 *   translateTargetLang?: string,
 * }} m
 * @returns {Promise<{ en: string, zh: string, translateNote?: string }>}
 */
async function vltRunAsrChunk(m) {
  const wavBuffer = base64ToArrayBuffer(m.wavBase64);
  const localUrl = String(m.localWhisperUrl || "").trim().replace(/\/+$/, "");
  if (!localUrl) {
    throw new Error(VLTMessages.errWhisperServerNotConfigured());
  }
  const engine = self.vltNormalizeTranslateEngine(
    m.translateEngine,
    Boolean(m.skipMyMemory),
  );
  const normSrc = vltNormalizeAsrSourceLang(m.asrSourceLang);
  const whisperLang = vltWhisperLanguageParam(normSrc);
  const trPref = vltNormalizeTranslateSourcePreference(m.translateSourceLang);
  const effectiveTrSrc = vltEffectiveTranslateSourceForPrompt(trPref, normSrc);
  const targetLangNorm = vltNormalizeTranslateTargetLang(m.translateTargetLang);
  const ollamaUrl = String(m.ollamaUrl || VLTConstants.DEFAULT_OLLAMA_URL)
    .trim()
    .replace(/\/+$/, "");
  const ollamaModel = String(
    m.ollamaModel || VLTConstants.DEFAULT_OLLAMA_MODEL,
  ).trim();

  const en = await transcribeWhisperCppServerWav(
    wavBuffer,
    localUrl,
    whisperLang,
  );
  if (!en) {
    return { en: "", zh: "" };
  }
  if (engine === "none") {
    return { en, zh: en };
  }

  let zh = en;
  let translateNote = "";
  try {
    zh = await translateOllamaToTarget(
      en,
      ollamaUrl,
      ollamaModel,
      effectiveTrSrc,
      targetLangNorm,
    );
  } catch (e) {
    zh = `[${en}]`;
    translateNote = VLTMessages.translateFailureNote(
      String(e?.message || e),
    );
  }
  return translateNote ? { en, zh, translateNote } : { en, zh };
}

self.vltLocalPipeline = {
  vltRunAsrChunk,
};
