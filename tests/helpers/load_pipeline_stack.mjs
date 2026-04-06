/**
 * Load extension scripts in the same order as service_worker importScripts
 * (minus the service worker itself) into the given global object.
 * For Node architecture tests only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, "..", "..");

/** @type {string[]} */
const PIPELINE_STACK = [
  "src/shared/vlt_constants.js",
  "src/shared/vlt_locale_meta.js",
  "src/shared/vlt_messages.js",
  "src/shared/vlt_llm_config.js",
  "src/shared/vlt_translate_engine.js",
  "src/shared/vlt_source_lang.js",
  "src/background/local_pipeline.js",
];

/**
 * @param {object} [sandbox] defaults to a fresh object with Web API shims from globalThis
 * @returns {object} the sandbox (mutated) with VLTConstants, vltLocalPipeline, etc.
 */
export function loadPipelineStack(sandbox) {
  const g =
    sandbox ||
    {
      console,
      atob: globalThis.atob,
      btoa: globalThis.btoa,
      fetch: globalThis.fetch,
      Blob: globalThis.Blob,
      FormData: globalThis.FormData,
      Response: globalThis.Response,
      Request: globalThis.Request,
      Headers: globalThis.Headers,
      URL: globalThis.URL,
      URLSearchParams: globalThis.URLSearchParams,
      TextEncoder: globalThis.TextEncoder,
      TextDecoder: globalThis.TextDecoder,
      Uint8Array,
      ArrayBuffer,
      JSON,
      RegExp,
      String,
      Number,
      Boolean,
      Object,
      Error,
      TypeError,
      Promise,
      setTimeout,
      clearTimeout,
    };
  g.self = g;
  const ctx = vm.createContext(g);
  for (const rel of PIPELINE_STACK) {
    const abs = join(REPO_ROOT, rel);
    const code = readFileSync(abs, "utf8");
    vm.runInContext(code, ctx, { filename: rel });
  }
  return g;
}
