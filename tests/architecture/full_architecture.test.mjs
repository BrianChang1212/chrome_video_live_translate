/**
 * Full-architecture contract tests (Node 18+): manifest, message routing surface,
 * shared stack load order, and local pipeline with mocked fetch (no real whisper/Ollama).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import { loadPipelineStack, REPO_ROOT } from "../helpers/load_pipeline_stack.mjs";

const manifestPath = join(REPO_ROOT, "manifest.json");

function readServiceWorkerMessageTypes() {
  const swPath = join(REPO_ROOT, "src", "background", "service_worker.js");
  const src = readFileSync(swPath, "utf8");
  const re = /message\?\.type === ["']([^"']+)["']/g;
  /** @type {string[]} */
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function readOffscreenSendMessageTypes() {
  const p = join(REPO_ROOT, "src", "offscreen", "offscreen.js");
  const src = readFileSync(p, "utf8");
  const re = /type:\s*["']([^"']+)["']/g;
  /** @type {Set<string>} */
  const set = new Set();
  let m;
  while ((m = re.exec(src)) !== null) {
    set.add(m[1]);
  }
  return set;
}

describe("manifest architecture", () => {
  test("MV3 shape and referenced entry files exist", () => {
    const raw = readFileSync(manifestPath, "utf8");
    const m = JSON.parse(raw);
    assert.equal(m.manifest_version, 3);
    assert.equal(typeof m.version, "string");
    assert.match(m.version, /^\d+\.\d+\.\d+$/);

    assert.ok(Array.isArray(m.permissions));
    assert.ok(m.permissions.includes("tabCapture"));
    assert.ok(m.permissions.includes("offscreen"));

    const sw = m.background?.service_worker;
    assert.equal(typeof sw, "string");
    assert.ok(existsSync(join(REPO_ROOT, sw)));

    const opt = m.options_ui?.page;
    assert.equal(typeof opt, "string");
    assert.ok(existsSync(join(REPO_ROOT, opt)));

    const popup = m.action?.default_popup;
    assert.equal(typeof popup, "string");
    assert.ok(existsSync(join(REPO_ROOT, popup)));

    const cs = m.content_scripts?.[0];
    assert.ok(cs?.js?.length >= 1);
    for (const rel of cs.js) {
      assert.ok(existsSync(join(REPO_ROOT, rel)), `missing ${rel}`);
    }
    const css = cs.css?.[0];
    assert.equal(typeof css, "string");
    assert.ok(existsSync(join(REPO_ROOT, css)));
  });
});

describe("message routing contract (static)", () => {
  test("service_worker inbound types are stable set", () => {
    const found = readServiceWorkerMessageTypes();
    const unique = [...new Set(found)].sort();
    const expected = [
      "CAPTURE_DEBUG",
      "CAPTURE_LEVEL",
      "PIPELINE_NOTE",
      "PIPELINE_SUBTITLE",
      "START_CAPTURE",
      "STOP_CAPTURE",
      "VLT_RUN_ASR_CHUNK",
      "VLT_SUBTITLE",
    ];
    assert.deepEqual(unique, expected);
  });

  test("offscreen emits types that background handles or forwards", () => {
    const off = readOffscreenSendMessageTypes();
    assert.ok(off.has("INIT_CAPTURE") === false);
    assert.ok(off.has("VLT_RUN_ASR_CHUNK"));
    assert.ok(off.has("PIPELINE_SUBTITLE"));
    assert.ok(off.has("PIPELINE_NOTE"));
    assert.ok(off.has("CAPTURE_LEVEL"));
    assert.ok(off.has("CAPTURE_DEBUG"));
  });
});

describe("shared + local_pipeline stack", () => {
  /** @type {object} */
  let g;
  /** @type {typeof globalThis.fetch} */
  let origFetch;

  beforeEach(() => {
    origFetch = globalThis.fetch;
    g = loadPipelineStack();
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  test("globals exist after load (same order as service worker)", () => {
    assert.ok(g.VLTConstants);
    assert.ok(g.VLTLocaleMeta);
    assert.ok(g.VLTMessages);
    assert.ok(g.VLTLLM);
    assert.equal(typeof g.vltNormalizeTranslateEngine, "function");
    assert.equal(typeof g.vltNormalizeAsrSourceLang, "function");
    assert.equal(typeof g.vltLocalPipeline?.vltRunAsrChunk, "function");
  });

  test("VLTLLM stream flags match extension policy (think off)", () => {
    assert.equal(g.VLTLLM.ollamaStreamFlags.think, false);
    assert.equal(g.VLTLLM.ollamaStreamFlags.stream, false);
  });

  test("translate engine normalization", () => {
    assert.equal(g.vltNormalizeTranslateEngine("ollama", false), "ollama");
    assert.equal(g.vltNormalizeTranslateEngine("none", false), "none");
    assert.equal(g.vltNormalizeTranslateEngine("", false), "ollama");
    assert.equal(g.vltNormalizeTranslateEngine("ollama", true), "none");
  });

  test("ASR / translate prefs and badges", () => {
    assert.equal(g.vltNormalizeAsrSourceLang("ja"), "ja");
    assert.equal(g.vltNormalizeTranslateSourcePreference("follow"), "follow");
    assert.equal(
      g.vltEffectiveTranslateSourceForPrompt("follow", "en"),
      "en",
    );
    assert.equal(
      g.vltEffectiveTranslateSourceForPrompt("follow", "auto"),
      "auto",
    );
    assert.ok(typeof g.vltSourceLangBadge("ja") === "string");
    assert.ok(typeof g.vltTranslateTargetBadge("zh-TW") === "string");
  });

  test("TranslateGemma user prompt includes source text", () => {
    const body = g.VLTLLM.buildTranslateGemmaUserContent(
      "Hello world",
      "en",
      "zh-TW",
    );
    assert.ok(body.includes("Hello world"));
    assert.ok(body.includes("Traditional Chinese"));
  });

  test("vltRunAsrChunk: whisper only (translate engine none)", async () => {
    g.fetch = async (url) => {
      assert.ok(String(url).includes("/inference"));
      return new Response(JSON.stringify({ text: "  asr line  " }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const wavB64 = Buffer.from("fake-wav").toString("base64");
    const out = await g.vltLocalPipeline.vltRunAsrChunk({
      wavBase64: wavB64,
      localWhisperUrl: "http://127.0.0.1:8080",
      translateEngine: "none",
      skipMyMemory: false,
      asrSourceLang: "auto",
      translateSourceLang: "follow",
      translateTargetLang: "zh-TW",
    });
    assert.equal(out.en, "asr line");
    assert.equal(out.zh, "asr line");
    assert.ok(!out.translateNote);
  });

  test("vltRunAsrChunk: whisper + Ollama chat strips think blocks", async () => {
    g.fetch = async (url) => {
      const u = String(url);
      if (u.includes("/inference")) {
        return new Response(JSON.stringify({ text: "hello" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/api/chat")) {
        const wrapped = "你好";
        const raw = JSON.stringify({
          message: {
            content: `<think>\nignore\n</think>\n${wrapped}`,
          },
        });
        return new Response(raw, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      assert.fail(`unexpected fetch ${u}`);
    };

    const wavB64 = Buffer.from("x").toString("base64");
    const out = await g.vltLocalPipeline.vltRunAsrChunk({
      wavBase64: wavB64,
      localWhisperUrl: "http://127.0.0.1:9000/",
      translateEngine: "ollama",
      skipMyMemory: false,
      ollamaUrl: "http://127.0.0.1:11434",
      ollamaModel: "translategemma:4b",
      asrSourceLang: "en",
      translateSourceLang: "follow",
      translateTargetLang: "zh-TW",
    });
    assert.equal(out.en, "hello");
    assert.equal(out.zh, "你好");
  });

  test("vltRunAsrChunk: missing whisper URL uses VLTMessages", async () => {
    await assert.rejects(
      () =>
        g.vltLocalPipeline.vltRunAsrChunk({
          wavBase64: "QQ==",
          localWhisperUrl: "",
          translateEngine: "none",
        }),
      (e) =>
        typeof e.message === "string" &&
        e.message.includes("whisper-server"),
    );
  });

  test("vltRunAsrChunk: Ollama failure returns bracketed ASR + note", async () => {
    g.fetch = async (url) => {
      const u = String(url);
      if (u.includes("/inference")) {
        return new Response(JSON.stringify({ text: "asr-only" }), {
          status: 200,
        });
      }
      return new Response("nope", { status: 403 });
    };

    const out = await g.vltLocalPipeline.vltRunAsrChunk({
      wavBase64: Buffer.from("a").toString("base64"),
      localWhisperUrl: "http://127.0.0.1:8080",
      translateEngine: "ollama",
      ollamaUrl: "http://127.0.0.1:11434",
      ollamaModel: "m",
      asrSourceLang: "auto",
      translateSourceLang: "follow",
      translateTargetLang: "en",
    });
    assert.equal(out.en, "asr-only");
    assert.equal(out.zh, "[asr-only]");
    assert.ok(typeof out.translateNote === "string");
    assert.ok(out.translateNote.length > 0);
  });
});
