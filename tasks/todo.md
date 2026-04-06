# Video Live Translate — tasks & progress

**References:** snapshot [`docs/DEVELOPMENT_PROGRESS.md`](../docs/DEVELOPMENT_PROGRESS.md) (EN) / [`.zh-TW.md`](../docs/DEVELOPMENT_PROGRESS.zh-TW.md); optimization ideas [`docs/OPTIMIZATION_NOTES.md`](../docs/OPTIMIZATION_NOTES.md) / [`.zh-TW.md`](../docs/OPTIMIZATION_NOTES.zh-TW.md). **Version ↔ docs map:** [`docs/DOC_SYNC.md`](../docs/DOC_SYNC.md) / [`.zh-TW.md`](../docs/DOC_SYNC.zh-TW.md). Canonical version: root `manifest.json` → **`version`** (**0.7.3**).

## Current (v0.7.3)

- [x] MV3 tab capture → offscreen chunking → whisper-server ASR
- [x] Ollama **multi-pair** translation (optional) and 403 / `OLLAMA_ORIGINS` path
- [x] Overlay, options page, smoke scripts, launcher scripts, **`npm test`** / **`npm run test:integration`**
- [x] README (EN/zh-TW), ONBOARDING, development snapshot docs
- [x] **v0.6.2:** Popup/options UI, debug HUD, dark subtitle bar, opacity sliders, `manifest` icons
- [x] **v0.7.3:** Speech direction (Popup/options sync), ⇄ swap, Popup chunk slider, `vlt_locale_meta`, **`DOC_SYNC.*`** index
- [x] **Node automated tests:** `tests/architecture/`, `tests/integration/`, docs in README / ONBOARDING §7 / LOCAL_SETUP §5

## Backlog (prioritize as needed)

- [ ] Full / rolling **SRT export**
- [ ] **Privacy & data handling** page (store / M6)
- [ ] Phase 2: bilingual rows, local history, site shortcuts, TTS, etc. (see product framework)
- [ ] Performance / pipeline: **`docs/OPTIMIZATION_NOTES.md`** (incl. **§6** local auto-start / Native Messaging)

## Review log

- **2026-04-06:** Created this file and `docs/DEVELOPMENT_PROGRESS.*`, aligned with manifest **0.6.0**.
- **2026-04-06:** Optimization notes live in **`docs/OPTIMIZATION_NOTES.*`** (no separate optimization repo).
- **2026-04-06:** **v0.6.1** `LOCAL_SETUP.*`, options first-run + copy commands.
- **2026-04-06:** **v0.6.2** docs ↔ manifest; UI/icons/opacity see `docs/DEVELOPMENT_PROGRESS.*`.
- **2026-04-06:** **v0.7.3** doc pass: README / ONBOARDING / DEVELOPMENT_PROGRESS / this file aligned with multi-pair, Popup chunking, swap.
- **2026-04-06:** **Full doc sync:** `docs/DOC_SYNC.*`, README doc tree, cross-refs to **manifest 0.7.3**.
- **2026-04-07:** **English-primary docs:** root `README.md` + `docs/*.md`; `README.zh-TW.md` + `docs/*.zh-TW.md`; **Languages** section on each (EN ↔ 繁中).
- **2026-04-07:** **Node tests + doc pass:** architecture + optional integration tests; README trees include `package.json` / `tests/`; ONBOARDING §7, LOCAL_SETUP §5, DEVELOPMENT_PROGRESS review row.
