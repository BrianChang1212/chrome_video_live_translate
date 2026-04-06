# Documentation & version sync (Video Live Translate)

## Languages

- [English](DOC_SYNC.md)
- [繁體中文](DOC_SYNC.zh-TW.md)

---

**Authoritative app version:** the **`"version"`** field in root `manifest.json`.

| Field | Current value |
|-------|----------------|
| `manifest.json` → `version` | **0.7.3** |

**Maintenance:** On release or bump: (1) update `manifest.json` `version`; (2) update “Current value” in this table; (3) update `docs/DEVELOPMENT_PROGRESS.md` header and §5 review rows (and the `.zh-TW` twin if present); (4) update the version line at the top of `README.md` and `README.zh-TW.md`; (5) update the “current status” heading in `tasks/todo.md`; (6) skim other rows below that must reflect the current build.

---

## `docs/` index (keep in sync with the release)

| File | Purpose | Must reflect current build |
|------|---------|----------------------------|
| [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md) / [`.zh-TW`](DEVELOPMENT_PROGRESS.zh-TW.md) | Snapshot: done / backlog | Header manifest version, summary, §5 |
| [`ONBOARDING.md`](ONBOARDING.md) / [`.zh-TW`](ONBOARDING.zh-TW.md) | Onboarding, tree, data flow | Opening version line, product blurb |
| [`LOCAL_SETUP.md`](LOCAL_SETUP.md) / [`.zh-TW`](LOCAL_SETUP.zh-TW.md) | Local whisper-server / Ollama | “Per manifest” note, service steps |
| [`OPTIMIZATION_NOTES.md`](OPTIMIZATION_NOTES.md) / [`.zh-TW`](OPTIMIZATION_NOTES.zh-TW.md) | Performance & platform ideas | Last updated, pipeline description |
| [`PRODUCT_DESIGN_FRAMEWORK.md`](PRODUCT_DESIGN_FRAMEWORK.md) / [`.zh-TW`](PRODUCT_DESIGN_FRAMEWORK.zh-TW.md) | Product framework draft | “Maps to code” table |
| [`PHASE_REPORT_TRANSLATION_PIPELINE.md`](PHASE_REPORT_TRANSLATION_PIPELINE.md) / [`.zh-TW`](PHASE_REPORT_TRANSLATION_PIPELINE.zh-TW.md) | **Historical** (anchored 0.5.6) | Header points to current docs only; **do not rewrite** body for new versions |
| **This file** `DOC_SYNC.md` | Version + doc map | “Current value” table |

---

## Narrative baseline beyond version numbers (avoid doc drift)

- **Languages / direction:** Multi-pair; Popup and Options “speech translation direction” stay in sync; ⇄ swap; ASR source can auto-detect.
- **Chunking:** 2–12 s; Options and **Popup slider** both persist `hfChunkSec`.
- **Authoritative behavior:** `src/background/local_pipeline.js`, `src/shared/vlt_locale_meta.js`, `vlt_llm_config.js`, etc.

---

*Review alongside `manifest.json` **0.7.3**; bump the table when the version changes.*
