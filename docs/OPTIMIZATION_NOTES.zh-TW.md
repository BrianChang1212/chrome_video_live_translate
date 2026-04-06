# 優化構想紀錄（Video Live Translate）

> **位置**：與擴充**同一 repository** 之本檔 `docs/OPTIMIZATION_NOTES.zh-TW.md`（**不**另建獨立 repo）。  
> **來源**：管線（分頁擷音 → whisper-server ASR → Ollama 翻譯）之效率與平台限制討論整理（語向依使用者設定）。  
> **建立**：2026-04-06｜**最後更新**：2026-04-06（**文件完整同步**；程式 **manifest 0.7.3**；索引 [`DOC_SYNC.zh-TW.md`](DOC_SYNC.zh-TW.md)；§6 本機服務自動啟動）

---

## 1. 瓶頸認知（現行管線）

每個音訊 chunk 大致為：

1. **whisper-server** `POST …/inference`（ASR）— 常為延遲主因之一。  
2. **Ollama** `/api/chat`（翻譯）— 擴充內 `num_predict`：chat **768**、generate fallback **1024**（見 `src/background/local_pipeline.js`）。

切段愈短 → 更新較即時，但 **HTTP／推論次數**增加；切段愈長 → 單次較重、round-trip 較少。

---

## 2. 優先嘗試（通常**不需** whisper-server／Ollama **原始碼**）

| 方向 | 說明 |
|------|------|
| GPU | Whisper 與 Ollama 皆使用 **GPU 版**建置／安裝（CUDA／ROCm／Metal 等依平台）。 |
| Whisper 模型 | 在 server 端換 **較小模型**（如 base／small），換速度、可能略降準度。 |
| Ollama 模型 | 維持較小翻譯模型（例如 `translategemma:4b`）；更大模型通常更慢。 |
| 切段秒數 | 選項或 **Popup 滑桿** 2–12 秒：依硬體在「即時感」與「請求頻率」間調整。 |
| Ollama `options` | 可實驗 `num_thread` 等（依 Ollama API 文件）；`num_predict` 略降或許略快，短句效益有限，需注意截斷。 |
| 關閉翻譯 | 選「不翻譯」可完全略過 Ollama。 |

---

## 3. 何時才考慮 upstream／source

- **多數情境**：官方 **release／預編譯** + 正確 GPU 與模型即可，**不必** fork whisper.cpp 或 Ollama。  
- **從 source 建置 whisper.cpp**：需針對硬體最佳化、或 `/inference` 行為與現有擴充不合時。  
- **Ollama source**：僅在要改伺服器行為、實驗未合併功能或特殊硬體時考慮。

---

## 4. 主專案內可做的「管線層」構想（待評估）

以下屬 **擴充／service worker／offscreen** 邏輯，非必改 Whisper／Ollama 核心：

- 與上一段 **重疊送件**或 **佇列**，減少端到端空等（需設計並行上限與順序）。  
- **靜音／低 RMS** chunk 略過 ASR 或合併（減少無效請求）。  
- 翻譯快取（相同來源語句不重打 Ollama）— 產品框架 Phase 2 曾提及，需隱私與記憶體政策。

---

## 5. 後續動作（勾選用）

- [ ] 在實機量測：單 chunk ASR 耗時 vs 單次 Ollama 耗時（同硬體、同模型）。  
- [ ] 決定是否將 `num_thread` 等寫入選項頁或僅文件建議。  
- [ ] 若實作管線重疊：定義最大並行數與字幕順序保證。  
- [ ] 若需「一鍵啟動」本機服務：評估 [Chrome Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) 與安裝／更新成本（見 §6）。

---

## 6. 本機服務能否由網頁／擴充自動啟動？

**結論：** **不能**僅靠一般網頁或 **Chrome 擴充內 JavaScript** 自動執行本機 `whisper-server`、`ollama serve`（無法任意啟動使用者電腦上的 exe／行程）。`README.md` 亦載明擴充**無法**代為執行 `.exe`。

| 情境 | 是否可行 |
|------|----------|
| 純網頁 | 否（瀏覽器沙箱） |
| 僅 MV3 擴充（content／service worker／offscreen） | 否（無「執行本機程式」API） |

**變通（皆需使用者端額外步驟或元件）：**

| 方式 | 說明 |
|------|------|
| **Native Messaging** | 使用者安裝並註冊 **native host** 小程式；擴充僅透過 Chrome 規定管道與其通訊，**由 host** 啟動／監控 whisper-server、Ollama。為擴充側「觸發本機行程」之**標準**途徑，但開發、簽署與跨平台安裝成本較高。 |
| **OS 工作排程／登入啟動** | 開機或登入即起服務；擴充只負責連線與健康檢查。 |
| **本機常駐 agent** | 獨立程式常駐並接受本機 API；仍須先被安裝並啟動過至少一次（或依賴排程）。 |
| **自訂 URL scheme** | 需 OS 註冊處理程式；本質仍為本機已安裝之啟動器。 |

**產品取捨：** 維持「手動或腳本啟動 + 文件」成本最低；若要接近一鍵體驗，需投入 **Native Messaging** 或獨立**桌面啟動器**產品線。

---

*與 [`DOC_SYNC.zh-TW.md`](DOC_SYNC.zh-TW.md)、`docs/DEVELOPMENT_PROGRESS.zh-TW.md`、`tasks/todo.md` 並讀，可對齊現況版本與待辦。*
