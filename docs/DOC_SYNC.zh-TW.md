# 文件與版本同步（Video Live Translate）

## Languages

- [English](DOC_SYNC.md)
- [繁體中文](DOC_SYNC.zh-TW.md)

---

**權威程式版本**：根目錄 `manifest.json` 的 **`"version"`** 欄位。**英文主文件**為本目錄同名無後綴之 `.md`（如 [`DOC_SYNC.md`](DOC_SYNC.md)）。

| 欄位 | 目前值 |
|------|--------|
| `manifest.json` → `version` | **0.7.3** |

**維護規則**：發佈或改號時請 (1) 更新 `manifest.json` 的 `version`；(2) 更新本檔與 [`DOC_SYNC.md`](DOC_SYNC.md) 之「目前值」表；(3) 更新 `docs/DEVELOPMENT_PROGRESS.md` 與 `DEVELOPMENT_PROGRESS.zh-TW.md` 表頭與 §5 檢閱列；(4) 更新 `README.md`／`README.zh-TW.md` 頂部版號句；(5) 更新 `tasks/todo.md`「現況」標題；(6) 其餘下表掃一眼。

---

## `docs/` 檔案一覽（與現版對齊責任）

| 檔案（英文主／繁中） | 用途 | 應反映現版之處 |
|------|------|----------------|
| [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md)／[`.zh-TW`](DEVELOPMENT_PROGRESS.zh-TW.md) | 開發快照、已完成／待辦 | 表頭 manifest 版號、狀態摘要、§5 |
| [`ONBOARDING.md`](ONBOARDING.md)／[`.zh-TW`](ONBOARDING.zh-TW.md) | 新進／目錄／資料流 | 開頭版本句、產品描述 |
| [`LOCAL_SETUP.md`](LOCAL_SETUP.md)／[`.zh-TW`](LOCAL_SETUP.zh-TW.md) | 本機 whisper-server／Ollama | 檔首「以 manifest 為準」、服務說明 |
| [`OPTIMIZATION_NOTES.md`](OPTIMIZATION_NOTES.md)／[`.zh-TW`](OPTIMIZATION_NOTES.zh-TW.md) | 效能與平台限制構想 | 檔首最後更新、管線描述 |
| [`PRODUCT_DESIGN_FRAMEWORK.md`](PRODUCT_DESIGN_FRAMEWORK.md)／[`.zh-TW`](PRODUCT_DESIGN_FRAMEWORK.zh-TW.md) | 產品框架草案 | 「對應程式狀態」表列 |
| [`PHASE_REPORT_TRANSLATION_PIPELINE.md`](PHASE_REPORT_TRANSLATION_PIPELINE.md)／[`.zh-TW`](PHASE_REPORT_TRANSLATION_PIPELINE.zh-TW.md) | **歷史**（錨定 0.5.6） | 僅檔首導讀指向現版；**不重寫**內文 |
| **`DOC_SYNC.md`**／**本檔** | 版號與文件索引 | 上表「目前值」 |

---

## 版本號以外之敘述基準（避免文件漂移）

- **語言／語向**：多語向；Popup 與選項「語音翻譯語向」即時同步；⇄ 交換；聽譯可自動偵測。
- **切段**：2–12 秒；選項頁與 **Popup 滑桿** 皆寫入 `hfChunkSec`。
- **權威行為**：`src/background/local_pipeline.js`、`src/shared/vlt_locale_meta.js`、`vlt_llm_config.js` 等原始碼。

---

*本檔與 `manifest.json` **0.7.3** 一併檢閱；更版後請更新上表「目前值」。*
