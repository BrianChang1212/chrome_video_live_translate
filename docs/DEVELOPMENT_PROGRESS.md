# Development snapshot (Video Live Translate)

| Item | Detail |
|------|--------|
| `manifest.json` version | **0.7.3** |
| Last updated (this doc) | **2026-04-06** |
| Summary | **Local pipeline MVP works:** tab capture → whisper-server ASR → (optional) Ollama **multi-pair** translation → overlay subtitles; Popup / Options **direction sync**, ⇄ swap, Popup **chunk slider** |

**Sources of truth:** version from `manifest.json` **`version`**; behavior from `README.md`, `src/background/local_pipeline.js`.  
**Doc map:** [`docs/DOC_SYNC.md`](DOC_SYNC.md) (maintained with **`version`**).

---

## 1. Done in this phase

- [x] Manifest V3: `tabCapture`, offscreen, service worker, content overlay
- [x] Audio chunking (2–12 s, default 4 s) and PCM→WAV
- [x] Local **whisper-server** ASR (`POST …/inference`, multipart)
- [x] Local **Ollama** translation (`/api/chat` first, `think: false`; optional “no translation”)
- [x] 403 / `OLLAMA_ORIGINS` docs and launcher scripts, `ollama_translate_smoke_test`
- [x] Options: whisper URL, engine, Ollama URL/model; Popup debug overlay (raw RMS)
- [x] Docs: `README.md`, `README.zh-TW.md`, `docs/ONBOARDING.*`, `docs/LOCAL_SETUP.*`
- [x] Options “first run”: install/start notes and copy-paste commands (extension cannot run local binaries)
- [x] **v0.6.2:** `manifest` **icons** / toolbar; Popup/Options dark UI; **VLT DEBUG** HUD; dual-row overlay; debug/subtitle opacity sliders
- [x] **v0.7.3:** `src/shared/vlt_locale_meta.js` and **locale** wiring; Options ↔ Popup **speech direction** sync; **⇄** swap source/target; Popup **chunk duration** slider (`hfChunkSec` synced with Options); **`docs/DOC_SYNC.*`** version index

**Version anchor:** details follow root **`manifest.json`** (currently **0.7.3**).

---

## 2. Known limits (documented—not an open bug list)

- DRM-protected content usually cannot expose tab audio
- The extension cannot start `whisper-server` / Ollama for the user (**platform limits & workarounds** in **`docs/OPTIMIZATION_NOTES.md` §6**)
- **Full-session SRT export** not built in (see `README.md`)

---

## 3. Backlog / candidates (from product framework)

From `docs/PRODUCT_DESIGN_FRAMEWORK.md` Phase 2 or MVP gaps—**no committed schedule**:

- [ ] Full or rolling **SRT / subtitle file export**
- [ ] Dedicated **privacy & data handling** page (store / M6)
- [ ] Bilingual rows, local history, site shortcuts, TTS, etc.

**Performance / pipeline ideas (same repo):** [`docs/OPTIMIZATION_NOTES.md`](OPTIMIZATION_NOTES.md).

---

## 4. Historical docs

- `docs/PHASE_REPORT_TRANSLATION_PIPELINE.md`: translation pipeline closure notes anchored at **v0.5.6**; if details conflict with the current app, trust §0 sources above.

---

## 5. Review log

| Date | Note |
|------|------|
| 2026-04-06 | First snapshot: manifest **0.6.0**, rolled up README / ONBOARDING / framework |
| 2026-04-06 | Optimization notes merged into **`docs/OPTIMIZATION_NOTES.*`** (no separate repo) |
| 2026-04-06 | Optimization **§6:** “pages/extensions cannot auto-start local services” + workarounds; linked from §2 here |
| 2026-04-06 | **v0.6.1:** `LOCAL_SETUP.*`, Options first-run + copy commands |
| 2026-04-06 | **v0.6.2:** icons, `manifest` icons; Popup/Options/HUD/overlay UI and opacity; doc version alignment |
| 2026-04-06 | **v0.7.3:** multi-pair UI, direction sync & swap, Popup chunk slider; README / ONBOARDING / this snapshot / `tasks/todo.md` aligned |
| 2026-04-06 | **Full doc sync:** `docs/DOC_SYNC.*`, README trees, cross-refs to **manifest `version` 0.7.3** |

---

## Languages

- [English](DEVELOPMENT_PROGRESS.md)
- [繁體中文](DEVELOPMENT_PROGRESS.zh-TW.md)
