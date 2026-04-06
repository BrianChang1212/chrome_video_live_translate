# 階段性完成報告：英文語音 → 繁中字幕（翻譯管線與 Ollama 整合）

## Languages

- [English](PHASE_REPORT_TRANSLATION_PIPELINE.md)
- [繁體中文](PHASE_REPORT_TRANSLATION_PIPELINE.zh-TW.md)

---

> **歷史文件（v0.5.x 存檔）：** 與現行程式與設定**可能不一致**。**現況**請以 **`docs/DOC_SYNC.md`**／**`.zh-TW.md`**（版號索引）、**`docs/DEVELOPMENT_PROGRESS.*`**、根目錄 **README**、**`docs/ONBOARDING.*`** 與 **`src/background/local_pipeline.js`** 為準（本機 whisper-server + Ollama；**多語向**與 UI 行為見 README／`src/shared/vlt_locale_meta.js` 等）。

| 項目 | 內容 |
|------|------|
| 專案 | Video Live Translate（Chrome MV3 擴充） |
| 程式根目錄 | `d:\Brian\dev\chrome_video_live_translate` |
| 報告對應版本 | **0.5.6**（`manifest.json`） |
| 報告日期 | 2026-04-05 |

---

## 1. 執行摘要

本階段目標為：**在既有「分頁擷音 → ASR → 翻譯 → 浮層字幕」管線上，讓繁中翻譯能穩定走本機 **Ollama**，並排除開發／使用者環境中導致「字幕僅顯示 `[英文]`」的幾類根因。經實作與驗證，**擴充內對 Ollama 的翻譯已可成功**；關鍵除錯結論為：**Qwen3 等思考型模型需關閉 thinking 並優先使用 chat API**，以及 **Ollama 須以 `OLLAMA_ORIGINS` 允許 `chrome-extension://` 來源**，否則 service worker 的 `fetch` 會收到 **HTTP 403**。

---

## 2. 階段目標與完成度

| 目標 | 狀態 | 說明 |
|------|------|------|
| 多引擎翻譯路線（舊版，後已簡化） | 完成 | 現行見 `normalizeTranslateEngine`：`ollama`、`none` |
| 本機 whisper-server ASR 路徑 | 先前已具備 | `local_pipeline.js` 內 multipart `POST …/inference` |
| Ollama 翻譯穩定（含思考模型） | 完成 | `think: false`；**先 `/api/chat` 再 `/api/generate`** |
| 擴充對本機 Ollama 403 | 完成 | 文件與 `start_ollama_allow_extensions.bat`；錯誤訊息提示 `OLLAMA_ORIGINS` |
| 可重複的指令列驗證 | 完成 | `scripts/ollama_translate_smoke_test.ps1`（及 `.bat` 包裝） |
| 使用者可發現的設定說明 | 完成 | `options.html` 段落、`README.md` 疑難章節 |

---

## 3. 問題現象與根因對照

### 3.1 字幕顯示 `[英文原文]`

- **現象**：浮層主文為方括號包住的英文，與辨識稿相同；meta 仍可能顯示 `EN · … → zh-TW`。
- **程式行為**：`vltRunAsrChunk` 內翻譯區塊外層 `catch` 將 `zh` 設為 `` `[${en}]` ``，並可附 `translateNote`。
- **意義**：**翻譯步驟整體失敗**（非「有譯文但 UI 沒顯示」）。

### 3.2 Ollama：`response` 空白（PowerShell `/api/generate` 測試）

- **現象**：`qwen3:8b` 等模型在 **`/api/generate`** 下 **`response` 為空字串**，`thinking` 很長，`done_reason` 可為 `length`。
- **根因**：思考 token 佔滿 `num_predict`，未關閉 thinking 時常見。
- **對策**：請求加上 **`think: false`**；翻譯主路徑改為 **先 `/api/chat`**，必要時再 **fallback `/api/generate`**；並略為調高 `num_predict`。

### 3.3 Ollama：Gin 日誌 **403 Forbidden**、延遲約 0s

- **現象**：同機器上，命令列測試 **200**，擴充使用時 **403**。
- **根因**：Chrome 擴充在 **service worker** 中 `fetch` 本機 Ollama 時，來源為 **`chrome-extension://…`**；Ollama 預設拒絕未列入允許清單的來源。
- **對策**：設定環境變數 **`OLLAMA_ORIGINS=chrome-extension://*`**（或寬鬆 `*`），**完全重啟 Ollama**；或使用專案內 **`scripts/start_ollama_allow_extensions.bat`** 以正確變數啟動 `ollama serve`。

---

## 4. 技術實作摘要

### 4.1 翻譯管線（`src/background/local_pipeline.js`）

- **`vltRunAsrChunk`**：依 `translateEngine` 分支；現行為 **`ollama`** 或 **`none`**（與選項／popup／offscreen 對齊）。
- **Ollama**：
  - **`parseOllamaJsonResponse`**：支援單一 JSON 與多行 NDJSON。
  - **`ollamaChatContentToString`**：`message.content` 為字串或陣列時皆可抽出文字。
  - **`ollamaChatTranslateEnZh` / `ollamaGenerateTranslateEnZh`**：皆帶 **`think: false`**；非 2xx 時經 **`ollamaHttpError`**，**403** 時錯誤字串開頭即提示 **`OLLAMA_ORIGINS`**。
  - **`translateOllamaEnToZhTW`**：**先 chat，再 generate**。
- **`stripThinkBlocks`**：移除模型內嵌之 thinking 標記區塊（字串拼接標籤以避免工具誤判）。

### 4.2 權限與設定傳遞

- **`manifest.json`**：`host_permissions` 含 **`http://127.0.0.1/*`、`http://localhost/*`**，利於本機 Ollama／whisper-server。
- **Offscreen／Popup／Options**：`translateEngine`、`ollamaUrl`、`ollamaModel` 由 storage 讀寫並於 `START_CAPTURE`／`VLT_RUN_ASR_CHUNK` 傳遞（細節見各檔）。

### 4.3 使用者可見文件與腳本

- **`README.md`**：新增「Ollama 403／`[英文]`」疑難段落。
- **`src/options/options.html`**：Ollama 區塊下方說明 **403 與 `OLLAMA_ORIGINS`**。
- **`scripts/ollama_translate_smoke_test.ps1`**：`POST /api/chat`、`think=false`，與擴充邏輯一致；可選 `-Model`、`-Sentence`。
- **`scripts/start_ollama_allow_extensions.bat`**：設定 `OLLAMA_ORIGINS` 後執行 `ollama serve`（需先關閉工作列 Ollama、且 `ollama` 在 PATH）。

---

## 5. 變更檔案一覽（本階段相關）

| 路徑 | 角色 |
|------|------|
| `manifest.json` | 版本號、本機 host_permissions |
| `src/background/local_pipeline.js` | ASR/翻譯核心、Ollama、403 提示 |
| `src/background/service_worker.js` | 轉發 ASR chunk、`translateNote` 通知分頁 |
| `src/offscreen/offscreen.js` | 切段與訊息欄位、`translateEngine` 預設 |
| `src/popup/popup.js` | 讀 storage、啟動擷取參數 |
| `src/options/options.html` / `options.js` | 翻譯引擎 UI、Ollama 欄位、403 說明 |
| `README.md` | 疑難與 Ollama 來源設定 |
| `scripts/ollama_translate_smoke_test.ps1` | 本機 API 驗證 |
| `scripts/ollama_translate_smoke_test.bat` | 呼叫上述 ps1 |
| `scripts/start_ollama_allow_extensions.bat` | 允許擴充來源後啟動 serve |

---

## 6. 驗證方式（建議順序）

1. **本機 Ollama（與擴充無關）**  
   `.\scripts\ollama_translate_smoke_test.ps1`  
   預期：印出 **OK** 與繁中譯文。

2. **擴充＋Ollama**  
   - 設定 **`OLLAMA_ORIGINS`** 並重啟 Ollama。  
   - `chrome://extensions` 重新載入擴充。  
   - 選項內啟用 **Ollama 翻譯**（或依現行 UI），儲存後 **停止再開始**擷取。  
   - 預期：字幕為繁中，且 Ollama 日誌為 **200**；若失敗，`translateNote` 應含可讀錯誤（含 403 時之 `OLLAMA_ORIGINS` 提示）。

---

## 7. 已知限制與後續建議

| 項目 | 說明 |
|------|------|
| 安全性 | `OLLAMA_ORIGINS=*` 最寬鬆；生產環境可改為特定 `chrome-extension://<id>`（若 Ollama 版本支援）。 |
| 模型差異 | 非 Qwen3 之模型若 chat 行為不同，仍可依現有 **chat → generate** 順序涵蓋多數情況。 |
| 後續功能（非本階段） | 整段 SRT 匯出、可選顯示雙語、翻譯快取等，可見 `docs/PRODUCT_DESIGN_FRAMEWORK.md`／`.zh-TW.md`。 |

---

## 8. 參考與依據（外部）

- [Ollama 文件：Thinking 能力](https://docs.ollama.com/capabilities/thinking)（含瀏覽器／來源相關說明脈絡）。
- Ollama 與 **`OLLAMA_ORIGINS`**、Chrome 擴充 **403** 之社群討論（例如 GitHub issues、Stack Overflow、技術部落格）；本報告第 3.2、3.3 節之結論與實機日誌、API 回應形狀互相印證。

---

## 9. 結語

本階段已將 **翻譯失敗時的成因** 收斂為可操作的設定（**`think: false`、chat 優先、NDJSON 解析、`OLLAMA_ORIGINS`**），並透過 **選項頁、README、錯誤字串、啟動腳本、煙霧測試** 降低重複除錯成本。使用者回報 **「已成功可翻譯」** 後，可將本報告視為該里程碑之**技術結案文件**；後續迭代請以 **版本號** 與 **CHANGELOG**（若專案新增）另行追蹤。

---

## 10. 全專案掃描與「給新人」文件（2026-04-05）

已對 `chrome_video_live_translate` 內全部檔案掃描並校正根 **README** 之目錄描述（釐清 `asr_free.js` 僅 **PCM→WAV、RMS**）。新增 **`docs/ONBOARDING.zh-TW.md`** 作為結構、資料流、檢查清單與驗證指令之單一入口。

與 **`whisper_transcribe_test_repo`**：**無需程式整合**（該 repo 為 **whisper-cli** 整檔輸出；擴充為 **whisper-server** 分段）。詳見 ONBOARDING 第 5 節與 test repo 之 **README.md**。

---

*本文件正文由專案維護流程產出，與當時 `manifest.json` **0.5.6** 對齊。**現行程式版號**請以根目錄 `manifest.json`（目前 **0.7.3**）及 **[`docs/DOC_SYNC.md`](DOC_SYNC.md)**／**[`.zh-TW.md`](DOC_SYNC.zh-TW.md)** 為準。*
