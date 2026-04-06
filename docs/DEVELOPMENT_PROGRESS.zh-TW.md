# 開發進度快照（Video Live Translate）

| 項目 | 內容 |
|------|------|
| `manifest.json` 版本 | **0.7.3** |
| 本文件更新日 | **2026-04-06** |
| 狀態摘要 | **本機管線 MVP 可用**：分頁擷音 → whisper-server ASR →（可選）Ollama **多語向**翻譯 → 浮層字幕；Popup／選項 **語向同步**、⇄ 交換、Popup **切段滑桿** |

**權威依據**：版本號以 `manifest.json` 的 **`version`** 為準；行為細節以 `README.md`、`src/background/local_pipeline.js` 為準。  
**文件同步索引**：英文 [`docs/DOC_SYNC.md`](DOC_SYNC.md)、繁中 [`docs/DOC_SYNC.zh-TW.md`](DOC_SYNC.zh-TW.md)（與 **`version`** 一併維護）。

---

## 1. 本階段已完成

- [x] Manifest V3：`tabCapture`、offscreen、service worker、content 字幕浮層
- [x] 音訊切段（2–12 秒可設定，預設 4 秒）與 PCM→WAV
- [x] 本機 **whisper-server** ASR（`POST …/inference`，multipart）
- [x] 本機 **Ollama** 翻譯（`/api/chat` 優先、`think: false`；可選「不翻譯」）
- [x] 403／`OLLAMA_ORIGINS` 文件與啟動腳本、`ollama_translate_smoke_test`
- [x] 選項頁：whisper URL、翻譯引擎、Ollama URL／模型；Popup 除錯浮層（raw RMS）
- [x] 上手文件：`README.md`、`README.zh-TW.md`、`docs/ONBOARDING.*`、`docs/LOCAL_SETUP.*`
- [x] 選項頁「首次使用」：安裝／啟動說明與複製終端機指令（無法代執行本機程式）
- [x] **v0.6.2**：`manifest` **icons**／工具列圖示；Popup／選項頁深色儀表 UI；**VLT DEBUG** 儀表板；字幕浮層雙列；**除錯／字幕**不透明度滑桿
- [x] **v0.7.3**：`src/shared/vlt_locale_meta.js` 等 **多語系**設定；選項與 Popup **語音翻譯語向**即時同步；**⇄ 交換**來源／譯為；Popup **切段時長**滑桿快速調整（`hfChunkSec` 與選項同步）；**`docs/DOC_SYNC.*`** 文件版號索引

**版本錨點**：細節以根目錄 **`manifest.json`** 為準（目前 **0.7.3**）。

---

## 2. 已知限制（文件已載明，非 bug 待修清單）

- DRM 等受保護內容多數無法擷取分頁音訊
- 擴充無法代使用者啟動本機 `whisper-server`／Ollama 程序（**平台限制與變通**見 **`docs/OPTIMIZATION_NOTES.md`**／**`.zh-TW.md` §6**）
- **整段 SRT 匯出**尚未內建（見 `README.md`）

---

## 3. 待辦／後續候選（產品框架對照）

以下取自 `docs/PRODUCT_DESIGN_FRAMEWORK.md`（／繁中 `.zh-TW.md`）之 Phase 2 或 MVP 缺口，**尚未承諾排程**：

- [ ] 整段或累積 **SRT／字幕檔匯出**
- [ ] 專用 **隱私與資料處理**說明頁（上架／M6）
- [ ] 雙語對照、本機歷史、網站捷徑、TTS 等 Phase 2 能力

**效能／管線優化構想**（與本專案**同一 repo**）：[`docs/OPTIMIZATION_NOTES.md`](OPTIMIZATION_NOTES.md)／[繁中](OPTIMIZATION_NOTES.zh-TW.md)。

---

## 4. 歷史階段文件

- `docs/PHASE_REPORT_TRANSLATION_PIPELINE.md`／`.zh-TW.md`：以 **v0.5.6** 為錨點之翻譯管線結案紀錄；細節若與現版衝突，以上文第 0 節之權威來源為準。

---

## 5. 檢閱紀錄

| 日期 | 說明 |
|------|------|
| 2026-04-06 | 初版快照：對齊 manifest **0.6.0**，彙整 README／ONBOARDING／產品框架 |
| 2026-04-06 | 曾於同層建立獨立 optimization 目錄；後**併入**本 repo `docs/OPTIMIZATION_NOTES.zh-TW.md`，**不**另開 repo |
| 2026-04-06 | Optimization notes **§6**：「網頁／擴充無法自動啟動本機服務」與變通；本文件 §2 已連結 |
| 2026-04-06 | **v0.6.1**：`docs/LOCAL_SETUP.zh-TW.md`、選項頁「首次使用」與複製啟動指令 |
| 2026-04-06 | **v0.6.2**：圖示資源、`manifest` icons；Popup／選項／除錯 HUD／字幕浮層 UI 與不透明度設定；文件版本對齊 |
| 2026-04-06 | **v0.7.3**：多語向 UI、Popup／選項語向同步與交換、Popup 切段滑桿；README／ONBOARDING／本快照／`tasks/todo.md` 對齊 |
| 2026-04-06 | **文件完整同步**：新增 **`docs/DOC_SYNC.*`**；README／ONBOARDING 專案樹補齊 `docs/` 全檔；全系文件與 **manifest `version` 0.7.3** 交叉引用 |

---

## Languages

- [English](DEVELOPMENT_PROGRESS.md)
- [繁體中文](DEVELOPMENT_PROGRESS.zh-TW.md)
