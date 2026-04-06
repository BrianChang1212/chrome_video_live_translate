/**
 * Optional integration tests against local whisper-server and Ollama.
 *
 * Disabled unless VLT_INTEGRATION is set to 1 or true (see package.json / scripts).
 * Each test probes reachability first and calls t.skip() if the service is down
 * (so CI and laptops without services still get exit 0).
 *
 * Env (all optional except the gate):
 *   VLT_INTEGRATION=1|true     — enable this suite
 *   VLT_WHISPER_URL            — default http://127.0.0.1:8080
 *   VLT_OLLAMA_URL             — default http://127.0.0.1:11434
 *   VLT_OLLAMA_MODEL           — default translategemma:4b (falls back to OLLAMA_MODEL)
 *   VLT_INTEGRATION_SENTENCE   — English sentence for Ollama chat test
 *   VLT_INTEGRATION_WAV_BASE64 — optional: replace synthetic silence WAV for ASR tests
 */
import assert from "node:assert/strict";
import { describe, test, before } from "node:test";
import { loadPipelineStack } from "../helpers/load_pipeline_stack.mjs";
import { buildSilentWavPcm16Mono } from "../helpers/minimal_wav.mjs";

const INTEGRATION_ENABLED =
  process.env.VLT_INTEGRATION === "1" ||
  process.env.VLT_INTEGRATION === "true";

const WHISPER_BASE = (
  process.env.VLT_WHISPER_URL || "http://127.0.0.1:8080"
).replace(/\/+$/, "");

const OLLAMA_BASE = (
  process.env.VLT_OLLAMA_URL || "http://127.0.0.1:11434"
).replace(/\/+$/, "");

const OLLAMA_MODEL =
  process.env.VLT_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "translategemma:4b";

/** @type {boolean} */
let whisperUp = false;
/** @type {boolean} */
let ollamaUp = false;

/**
 * Any HTTP response (including 4xx) means something accepted the connection.
 * @param {string} base
 * @returns {Promise<boolean>}
 */
async function probeWhisperInference(base) {
  const url = `${base}/inference`;
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    return typeof res.status === "number";
  } catch {
    return false;
  }
}

/**
 * @param {string} base
 * @returns {Promise<boolean>}
 */
async function probeOllamaTags(base) {
  try {
    const res = await fetch(`${base}/api/tags`, {
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * @param {string} content
 * @returns {string}
 */
function stripThinkBlocks(content) {
  const ot = "<" + "think" + ">";
  const ct = "<" + "/" + "think" + ">";
  const re = new RegExp(ot + "[\\s\\S]*?" + ct, "gi");
  return String(content || "").replace(re, "").trim();
}

describe(
  "integration: whisper-server & Ollama (optional)",
  { skip: !INTEGRATION_ENABLED },
  () => {
    before(async () => {
      [whisperUp, ollamaUp] = await Promise.all([
        probeWhisperInference(WHISPER_BASE),
        probeOllamaTags(OLLAMA_BASE),
      ]);
    });

    test("Ollama: GET /api/tags", async (t) => {
      if (!ollamaUp) {
        t.skip(`Ollama not reachable at ${OLLAMA_BASE} (skip)`);
        return;
      }
      const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
        signal: AbortSignal.timeout(8000),
      });
      assert.ok(res.ok, `expected 200 from /api/tags, got ${res.status}`);
      const data = await res.json();
      assert.ok(data && Array.isArray(data.models), "tags payload has models[]");
    });

    test("Ollama: POST /api/chat EN→zh-TW (smoke, matches extension)", async (t) => {
      if (!ollamaUp) {
        t.skip(`Ollama not reachable at ${OLLAMA_BASE} (skip)`);
        return;
      }
      const sentence =
        process.env.VLT_INTEGRATION_SENTENCE || "Hello from VLT integration test.";
      const userText =
        "You are a professional English (en) to Traditional Chinese (zh-TW) translator. " +
        "Your goal is to accurately convey the meaning and nuances of the original English text " +
        "while adhering to Traditional Chinese grammar, vocabulary, and cultural sensitivities.\n" +
        "Produce only the Traditional Chinese translation, without any additional explanations or commentary. " +
        "Please translate the following English text into Traditional Chinese (zh-TW):\n\n\n" +
        sentence;

      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          think: false,
          stream: false,
          messages: [{ role: "user", content: userText }],
          options: { temperature: 0.2, num_predict: 768 },
        }),
        signal: AbortSignal.timeout(120000),
      });
      const raw = await res.text();
      assert.ok(res.ok, `chat HTTP ${res.status}: ${raw.slice(0, 200)}`);
      let parsed;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(raw);
      });
      const rawContent =
        typeof parsed?.message?.content === "string"
          ? parsed.message.content
          : "";
      const zh = stripThinkBlocks(rawContent);
      assert.ok(
        zh.length > 0,
        "non-empty translated content (after stripping think blocks)",
      );
    });

    function integrationWavBase64() {
      const b64 = process.env.VLT_INTEGRATION_WAV_BASE64;
      if (b64 && String(b64).trim()) {
        return String(b64).trim();
      }
      const wav = buildSilentWavPcm16Mono(16000, 1.0);
      return Buffer.from(wav).toString("base64");
    }

    test("whisper-server: ASR only via vltRunAsrChunk (translate off)", async (t) => {
      if (!whisperUp) {
        t.skip(`whisper-server not reachable at ${WHISPER_BASE}/inference (skip)`);
        return;
      }
      const g = loadPipelineStack();
      const wavBase64 = integrationWavBase64();

      const out = await g.vltLocalPipeline.vltRunAsrChunk({
        wavBase64,
        localWhisperUrl: WHISPER_BASE,
        translateEngine: "none",
        skipMyMemory: false,
        asrSourceLang: "auto",
        translateSourceLang: "follow",
        translateTargetLang: "zh-TW",
      });

      assert.equal(typeof out.en, "string");
      assert.equal(typeof out.zh, "string");
      assert.equal(out.zh, out.en);
    });

    test("full local pipeline: whisper ASR + Ollama translate", async (t) => {
      if (!whisperUp) {
        t.skip(`whisper-server not reachable at ${WHISPER_BASE} (skip)`);
        return;
      }
      if (!ollamaUp) {
        t.skip(`Ollama not reachable at ${OLLAMA_BASE} (skip)`);
        return;
      }

      const g = loadPipelineStack();
      const wavBase64 = integrationWavBase64();

      const out = await g.vltLocalPipeline.vltRunAsrChunk({
        wavBase64,
        localWhisperUrl: WHISPER_BASE,
        translateEngine: "ollama",
        skipMyMemory: false,
        ollamaUrl: OLLAMA_BASE,
        ollamaModel: OLLAMA_MODEL,
        asrSourceLang: "en",
        translateSourceLang: "follow",
        translateTargetLang: "zh-TW",
      });

      assert.equal(typeof out.en, "string");
      assert.equal(typeof out.zh, "string");
      if (!out.en.trim()) {
        t.skip(
          "whisper returned empty text for sample audio; set VLT_INTEGRATION_WAV_BASE64 to a real chunk to validate ASR+Ollama",
        );
        return;
      }
      if (out.translateNote) {
        assert.ok(
          out.zh.startsWith("[") && out.zh.includes("]"),
          "on translate failure, zh is bracketed ASR",
        );
      } else {
        assert.ok(
          out.zh.length > 0,
          "when translate succeeds, zh is non-empty",
        );
      }
    });
  },
);
