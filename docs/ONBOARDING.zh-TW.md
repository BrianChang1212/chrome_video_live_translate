# 新進／新環境上手（Video Live Translate）

本文件對齊 **`manifest.json` → `version`（目前 0.7.3）**；完整文件索引見 **[`DOC_SYNC.zh-TW.md`](DOC_SYNC.zh-TW.md)**。**僅本機** whisper-server（ASR）與 Ollama（翻譯）；語向與切段等與 Popup／選項即時同步。

---

## 1. 這個專案做什麼

| 層級 | 說明 |
|------|------|
| 產品 | Chrome **MV3** 擴充：擷取**目前分頁**音訊 → 切段 → **本機 ASR**（whisper-server）→ **本機 Ollama** 多語向翻譯（可關閉翻譯）→ 頁面**浮層字幕**；**Popup** 可調語向、⇄ 交換、切段秒數（與選項同步）。 |
| 差異 | 音訊與翻譯推論皆在您自管之本機服務上完成；與「註冊帳號＋遠端推論」型外掛路線不同。 |

**術語：** **ASR**＝語音→文字（辨識稿，語言依設定／自動偵測）；**翻譯**＝Ollama 轉成所選目標語（可選）。

---

## 2. 目錄與職責

```
chrome_video_live_translate/
  LICENSE
  manifest.json
  README.md
  icons/                     # 擴充圖示（manifest / 工具列）
  docs/
    DOC_SYNC.zh-TW.md        # 版號與 docs 同步索引（見本檔 §1 導讀）
    LOCAL_SETUP.zh-TW.md     # 安裝與啟動教學（與選項頁「首次使用」互補）
    DEVELOPMENT_PROGRESS.zh-TW.md
    PRODUCT_DESIGN_FRAMEWORK.zh-TW.md
    OPTIMIZATION_NOTES.zh-TW.md
    PHASE_REPORT_TRANSLATION_PIPELINE.zh-TW.md  # 歷史 v0.5.6
  scripts/                   # 啟動 whisper-server、Ollama（OLLAMA_ORIGINS）、煙測
  src/
    shared/                  # 常數、語系表（vlt_locale_meta）、訊息字串、翻譯引擎正規化
    background/
      service_worker.js
      local_pipeline.js      # whisper-server multipart、Ollama chat/generate
    content/                 # 字幕浮層
    options/
    popup/
    offscreen/
      offscreen.js
      asr_free.js            # PCM→WAV、RMS
      pcm-worklet.js
```

`asr_free.js` **不**發 HTTP；請求在 **service worker** 的 `local_pipeline.js`。

---

## 3. 執行時資料流

1. **Popup**：`tabCapture` → `START_CAPTURE`（`hfChunkSec`、`localWhisperUrl`、語向鍵、`translateEngine`、Ollama 等；語向／切段可先於 Popup 寫入 `chrome.storage`）。
2. **Service worker**：建立 offscreen → `INIT_CAPTURE`。
3. **Offscreen**：累積 PCM → WAV → `VLT_RUN_ASR_CHUNK`。
4. **Service worker** → **`vltLocalPipeline.vltRunAsrChunk`**：`POST` whisper-server `/inference`，再視選項呼叫 Ollama。

---

## 4. 環境需求檢查清單

- [ ] **whisper-server** 已啟動，且選項內 URL 正確（預設 `http://127.0.0.1:8080`）。
- [ ] **Ollama** 已啟動（若未選「不翻譯」）；模型已 `ollama pull`（建議與選項一致，例如 **`translategemma:4b`**，見 [TranslateGemma](https://ollama.com/library/translategemma)）。
- [ ] **OLLAMA_ORIGINS**：擴充對本機 Ollama 需允許 `chrome-extension://…`，否則 **403**（見 README）。
- [ ] 改選項後：**停止再開始**擷取；改 manifest：**重新載入擴充**。

**無法由擴充一鍵啟動**本機 exe；請手動或工作排程（見 README）。

---

## 5. 與 `whisper_transcribe_test_repo`

| 本擴充 | 該 repo（若使用） |
|--------|-------------------|
| **whisper-server** HTTP、即時分段 | **whisper-cli**、整檔輸出 |

不必合併程式碼。

---

## 6. 建議閱讀順序

1. **README.md**
2. **`docs/DOC_SYNC.zh-TW.md`**（版號與各文件對齊索引；**維護／發佈改號時必讀**）
3. **`docs/LOCAL_SETUP.zh-TW.md`**（若尚未安裝本機服務）
4. 本文件 **ONBOARDING.zh-TW.md**
5. **`docs/DEVELOPMENT_PROGRESS.zh-TW.md`**（現階段完成度與待辦快照）
6. **`docs/PRODUCT_DESIGN_FRAMEWORK.zh-TW.md`**（產品框架草案，可選）
7. **`docs/OPTIMIZATION_NOTES.zh-TW.md`**（效能／管線構想與本機啟動限制，可選）
8. **`docs/PHASE_REPORT_TRANSLATION_PIPELINE.zh-TW.md`**（僅作 v0.5.6 歷程參考，見檔首說明）

---

## 7. 驗證

- `scripts\ollama_translate_smoke_test.bat`（或 `.ps1`）：`POST /api/chat`、`think=false`，**提示詞**與 `local_pipeline.js` 內 TranslateGemma 格式一致；預設模型 **`translategemma:4b`**。
- `scripts\start_whisper_server_example.bat`：啟動 ASR 服務（路徑自改）。

---

*掃描範圍：`src/`、`scripts/`、`manifest.json`；版號以 `manifest.json` → **`version`** 為準；文件對齊見 **`docs/DOC_SYNC.zh-TW.md`**。*
