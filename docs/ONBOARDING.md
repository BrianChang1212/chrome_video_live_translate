# Onboarding (Video Live Translate)

Aligned with **`manifest.json` → `version` (currently 0.7.3)**. Full index: **[`DOC_SYNC.md`](DOC_SYNC.md)**. **Local-only** whisper-server (ASR) and Ollama (translation); direction and chunking sync with Popup / Options.

---

## 1. What this project is

| Layer | Description |
|-------|-------------|
| Product | Chrome **MV3** extension: capture **active tab** audio → chunk → **local ASR** (whisper-server) → **local Ollama** multi-pair translation (optional off) → **overlay subtitles**; **Popup** adjusts direction, ⇄ swap, chunk seconds (synced with Options). |
| Difference | Audio and inference stay on services you run locally—not a “sign up + remote API” extension. |

**Terms:** **ASR** = speech → text (recognition; language from settings / auto-detect); **translation** = Ollama to target language (optional).

---

## 2. Tree & roles

```
chrome_video_live_translate/
  LICENSE
  manifest.json
  README.md
  README.zh-TW.md
  icons/
  docs/
    DOC_SYNC.md / .zh-TW.md
    LOCAL_SETUP.md / .zh-TW.md
    DEVELOPMENT_PROGRESS.md / .zh-TW.md
    PRODUCT_DESIGN_FRAMEWORK.md / .zh-TW.md
    OPTIMIZATION_NOTES.md / .zh-TW.md
    PHASE_REPORT_TRANSLATION_PIPELINE.md / .zh-TW.md
  scripts/
  src/
    shared/
    background/
      service_worker.js
      local_pipeline.js
    content/
    options/
    popup/
    offscreen/
      offscreen.js
      asr_free.js
      pcm-worklet.js
```

`asr_free.js` does **not** issue HTTP; requests run in the service worker’s `local_pipeline.js`.

---

## 3. Runtime data flow

1. **Popup:** `tabCapture` → `START_CAPTURE` (`hfChunkSec`, `localWhisperUrl`, direction keys, `translateEngine`, Ollama fields; direction/chunk may be written to `chrome.storage` first).
2. **Service worker:** create offscreen → `INIT_CAPTURE`.
3. **Offscreen:** accumulate PCM → WAV → `VLT_RUN_ASR_CHUNK`.
4. **Service worker** → **`vltLocalPipeline.vltRunAsrChunk`:** `POST` whisper-server `/inference`, then Ollama per options.

---

## 4. Environment checklist

- [ ] **whisper-server** running; Options URL correct (default `http://127.0.0.1:8080`).
- [ ] **Ollama** running if not “no translation”; model pulled (e.g. **`translategemma:4b`**, see [TranslateGemma](https://ollama.com/library/translategemma)).
- [ ] **OLLAMA_ORIGINS:** extension calls need `chrome-extension://…` allowed or you get **403** (see README).
- [ ] After option changes: **stop and start** capture; after manifest changes: **reload extension**.

The extension **cannot** one-click start local executables—manual or scheduled tasks (see README).

---

## 5. vs `whisper_transcribe_test_repo`

| This extension | That repo (if used) |
|----------------|---------------------|
| **whisper-server** HTTP, streaming chunks | **whisper-cli**, whole-file output |

No need to merge codebases.

---

## 6. Suggested reading order

1. **`README.md`** (English) or **`README.zh-TW.md`**
2. **`docs/DOC_SYNC.md`** (version map—**read before a release bump**)
3. **`docs/LOCAL_SETUP.md`** (if services not installed yet)
4. **`docs/ONBOARDING.md`** (this file)
5. **`docs/DEVELOPMENT_PROGRESS.md`**
6. **`docs/PRODUCT_DESIGN_FRAMEWORK.md`** (optional)
7. **`docs/OPTIMIZATION_NOTES.md`** (optional)
8. **`docs/PHASE_REPORT_TRANSLATION_PIPELINE.md`** (historical v0.5.6—see file header)

---

## 7. Verification

- `scripts\ollama_translate_smoke_test.bat` (or `.ps1`): `POST /api/chat`, `think=false`, prompt shape matches `local_pipeline.js`; default model **`translategemma:4b`**.
- `scripts\start_whisper_server_example.bat`: start ASR (edit paths).

---

*Scanned: `src/`, `scripts/`, `manifest.json`; version = `manifest.json` **`version`**; doc map = **`docs/DOC_SYNC.md`**.*

---

## Languages

- [English](ONBOARDING.md)
- [繁體中文](ONBOARDING.zh-TW.md)
