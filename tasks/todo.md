# Video Live Translate — 任務與進度

**對照**：詳細快照見 [`docs/DEVELOPMENT_PROGRESS.zh-TW.md`](../docs/DEVELOPMENT_PROGRESS.zh-TW.md)；優化構想見 [`docs/OPTIMIZATION_NOTES.zh-TW.md`](../docs/OPTIMIZATION_NOTES.zh-TW.md)。**版號與各 doc 對齊**見 [`docs/DOC_SYNC.zh-TW.md`](../docs/DOC_SYNC.zh-TW.md)。權威版號：根目錄 `manifest.json` → **`version`**（目前 **0.7.3**）。

## 現況（v0.7.3）

- [x] MV3 分頁擷音 → offscreen 切段 → whisper-server ASR
- [x] Ollama **多語向**翻譯（可關閉）與 403／`OLLAMA_ORIGINS` 支援路徑
- [x] 浮層字幕、選項頁、煙測與啟動輔助腳本
- [x] README、ONBOARDING、開發進度快照文件
- [x] **v0.6.2**：Popup／選項頁 UI、除錯儀表板、深色字幕列、不透明度滑桿與 `manifest` 圖示
- [x] **v0.7.3**：語音翻譯語向（Popup／選項同步）、⇄ 交換、Popup 切段秒數滑桿、`vlt_locale_meta` 語系表、**`DOC_SYNC.zh-TW.md`** 索引

## 待辦（依優先度自行調整）

- [ ] 整段／累積 **SRT 匯出**
- [ ] **隱私與資料處理**專頁（商店／M6）
- [ ] Phase 2：雙語對照、本機歷史、網站捷徑、TTS 等（見產品框架）
- [ ] 效能／管線：見 **`docs/OPTIMIZATION_NOTES.zh-TW.md`**（含 **§6** 本機服務自動啟動／Native Messaging）

## 檢閱

- **2026-04-06**：建立本檔與 `docs/DEVELOPMENT_PROGRESS.zh-TW.md`，與 manifest **0.6.0** 對齊。
- **2026-04-06**：優化構想已併入本 repo **`docs/OPTIMIZATION_NOTES.zh-TW.md`**（不另開 optimization repo）。
- **2026-04-06**：**v0.6.1** `LOCAL_SETUP.zh-TW.md`、選項頁首次使用與複製指令。
- **2026-04-06**：**v0.6.2** 文件與 manifest 對齊；UI／圖示／透明度等見 `docs/DEVELOPMENT_PROGRESS.zh-TW.md`。
- **2026-04-06**：**v0.7.3** 文件掃描：README／ONBOARDING／DEVELOPMENT_PROGRESS／本檔 對齊多語向與 Popup 切段、交換功能。
- **2026-04-06**：**文件完整同步**：`docs/DOC_SYNC.zh-TW.md`、README 頂部版號與 `docs/` 樹、全系交叉引用 **manifest 0.7.3**。
