# Phase report: English speech → Traditional Chinese subtitles (translation pipeline & Ollama)

> **Historical document (v0.5.x archive):** May **not** match today’s code/settings. **Current state:** [`docs/DOC_SYNC.md`](DOC_SYNC.md) (version index), [`docs/DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md), root **README.md**, [`docs/ONBOARDING.md`](ONBOARDING.md), and **`src/background/local_pipeline.js`** (local whisper-server + Ollama; **multi-pair** and UI: README / `src/shared/vlt_locale_meta.js`).

| Item | Content |
|------|---------|
| Project | Video Live Translate (Chrome MV3 extension) |
| Report version | **0.5.6** (`manifest.json`) |
| Report date | 2026-04-05 |

---

## 1. Executive summary

Goal: on the existing “tab capture → ASR → translate → overlay” pipeline, make **Traditional Chinese via local Ollama** reliable and remove common causes of subtitles showing only **`[English]`**. After implementation and checks, **in-extension Ollama translation succeeds**. Key findings: **thinking models like Qwen3 need thinking disabled and prefer the chat API**; **Ollama must allow `chrome-extension://` via `OLLAMA_ORIGINS`** or the service worker `fetch` returns **HTTP 403**.

---

## 2. Objectives & status

| Objective | Status | Notes |
|-----------|--------|--------|
| Multi-engine translation (older; later simplified) | Done | Today: `normalizeTranslateEngine`: `ollama`, `none` |
| Local whisper-server ASR | Already in place | `local_pipeline.js` multipart `POST …/inference` |
| Stable Ollama translation (incl. thinking models) | Done | `think: false`; **try `/api/chat` then `/api/generate`** |
| Extension → local Ollama 403 | Done | Docs + `start_ollama_allow_extensions.bat`; errors mention `OLLAMA_ORIGINS` |
| Repeatable CLI verification | Done | `scripts/ollama_translate_smoke_test.ps1` (+ `.bat`) |
| Discoverable settings | Done | `options.html`, README troubleshooting |

---

## 3. Symptoms vs root causes

### 3.1 Subtitles show `[English source]`

- **Symptom:** Main line is English in brackets, same as recognition; meta may still show `EN · … → zh-TW`.  
- **Code:** Outer `catch` in translation path sets `zh` to `` `[${en}]` `` with optional `translateNote`.  
- **Meaning:** **Translation failed end-to-end** (not “translation exists but UI hides it”).

### 3.2 Ollama: empty `response` (PowerShell `/api/generate` test)

- **Symptom:** `qwen3:8b` etc. return **empty `response`** on **`/api/generate`**, long `thinking`, `done_reason` may be `length`.  
- **Cause:** Thinking tokens fill `num_predict` when thinking isn’t disabled.  
- **Fix:** Send **`think: false`**; prefer **`/api/chat`**, fallback **`/api/generate`**; slightly raise `num_predict`.

### 3.3 Ollama: Gin log **403 Forbidden**, ~0s latency

- **Symptom:** CLI tests **200**, extension gets **403**.  
- **Cause:** Extension `fetch` from the **service worker** uses **`chrome-extension://…`**; Ollama rejects unknown origins by default.  
- **Fix:** Set **`OLLAMA_ORIGINS=chrome-extension://*`** (or broader `*`), **fully restart Ollama**, or use **`scripts/start_ollama_allow_extensions.bat`**.

---

## 4. Technical summary

### 4.1 Translation pipeline (`src/background/local_pipeline.js`)

- **`vltRunAsrChunk`:** branches on `translateEngine`; today **`ollama`** or **`none`**.  
- **Ollama:**  
  - **`parseOllamaJsonResponse`:** single JSON or NDJSON lines.  
  - **`ollamaChatContentToString`:** string or array `message.content`.  
  - **`ollamaChatTranslateEnZh` / `ollamaGenerateTranslateEnZh`:** both pass **`think: false`**; non-2xx via **`ollamaHttpError`**; **403** hints **`OLLAMA_ORIGINS`**.  
  - **`translateOllamaEnToZhTW`:** **chat first, then generate**.  
- **`stripThinkBlocks`:** strips embedded thinking tag blocks (string concat avoids tool false positives).

### 4.2 Permissions & settings

- **`manifest.json`:** `host_permissions` include **`http://127.0.0.1/*`**, **`http://localhost/*`**.  
- **Offscreen / Popup / Options:** `translateEngine`, `ollamaUrl`, `ollamaModel` via storage and `START_CAPTURE` / `VLT_RUN_ASR_CHUNK`.

### 4.3 User-facing docs & scripts

- **`README.md`:** Ollama 403 / `[English]` troubleshooting.  
- **`src/options/options.html`:** Ollama section + **403 / `OLLAMA_ORIGINS`**.  
- **`scripts/ollama_translate_smoke_test.ps1`:** `POST /api/chat`, `think=false`, aligned with extension logic; optional `-Model`, `-Sentence`.  
- **`scripts/start_ollama_allow_extensions.bat`:** sets `OLLAMA_ORIGINS` then `ollama serve` (quit tray Ollama first; `ollama` on PATH).

---

## 5. Files touched (this phase)

| Path | Role |
|------|------|
| `manifest.json` | Version, local `host_permissions` |
| `src/background/local_pipeline.js` | ASR/translation core, Ollama, 403 hints |
| `src/background/service_worker.js` | Forward ASR chunk, `translateNote` to tab |
| `src/offscreen/offscreen.js` | Chunking & message fields, `translateEngine` default |
| `src/popup/popup.js` | Read storage, start capture params |
| `src/options/options.html` / `options.js` | Engine UI, Ollama fields, 403 copy |
| `README.md` | Troubleshooting |
| `scripts/ollama_translate_smoke_test.ps1` | Local API smoke test |
| `scripts/ollama_translate_smoke_test.bat` | Wrapper |
| `scripts/start_ollama_allow_extensions.bat` | Ollama with allowed extension origins |

---

## 6. Verification (suggested order)

1. **Local Ollama (no extension)**  
   `.\scripts\ollama_translate_smoke_test.ps1`  
   Expect: **OK** and zh-TW output.

2. **Extension + Ollama**  
   - Set **`OLLAMA_ORIGINS`**, restart Ollama.  
   - Reload extension at `chrome://extensions`.  
   - Enable **Ollama translation** in Options, save, **stop/start** capture.  
   - Expect: zh-TW subtitles, Ollama logs **200**; on failure, `translateNote` should be readable (incl. 403 / `OLLAMA_ORIGINS`).

---

## 7. Known limits & follow-ups

| Topic | Notes |
|-------|--------|
| Security | `OLLAMA_ORIGINS=*` is loose; production can narrow to `chrome-extension://<id>` if supported. |
| Model variance | Non-Qwen3 models: chat→generate order still covers most cases. |
| Later features | Full SRT export, optional bilingual, translation cache—see `docs/PRODUCT_DESIGN_FRAMEWORK.md`. |

---

## 8. External references

- [Ollama docs: Thinking](https://docs.ollama.com/capabilities/thinking) (browser / origin context).  
- Community threads on **`OLLAMA_ORIGINS`**, Chrome extension **403** (GitHub issues, Stack Overflow, blogs)—aligned with §3.2–3.3 and observed responses.

---

## 9. Closing

This phase narrowed **translation failure** to actionable settings (**`think: false`**, chat first, NDJSON parsing, **`OLLAMA_ORIGINS`**) and surfaced them via **Options, README, error strings, launcher scripts, smoke tests**. After users report **“translation works”**, treat this report as a **technical closure** for that milestone; track later work by **version** and **CHANGELOG** if added.

---

## 10. Full-repo scan & onboarding doc (2026-04-05)

Scanned `chrome_video_live_translate` and corrected root **README** tree (`asr_free.js` is **PCM→WAV, RMS** only). Added **`docs/ONBOARDING.zh-TW.md`** (and English twin) as the single entry for structure, data flow, checklist, and verification.

vs **`whisper_transcribe_test_repo`:** **no code merge** (that repo: **whisper-cli** whole-file; extension: **whisper-server** chunks). See ONBOARDING §5 and that repo’s README.

---

*Produced by the project maintenance process for `manifest.json` **0.5.6**. **Current app version:** root `manifest.json` (currently **0.7.3**) and **[`docs/DOC_SYNC.md`](DOC_SYNC.md)**.*

---

## Languages

- [English](PHASE_REPORT_TRANSLATION_PIPELINE.md)
- [繁體中文](PHASE_REPORT_TRANSLATION_PIPELINE.zh-TW.md)
