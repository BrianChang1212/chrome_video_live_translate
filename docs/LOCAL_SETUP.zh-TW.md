# 本機環境安裝與啟動（whisper-server、Ollama）

> 給**尚未安裝**或**不知如何啟動服務**的使用者。Chrome 擴充**無法**替你安裝或執行本機程式，請在本機完成下列步驟。  
> 擴充版號以根目錄 `manifest.json` 的 **`version`** 為準（目前 **0.7.3**）。**各文件與版號對齊索引**見 [`docs/DOC_SYNC.md`](DOC_SYNC.md)／[`DOC_SYNC.zh-TW.md`](DOC_SYNC.zh-TW.md)。

---

## 總覽

| 服務 | 用途 | 擴充預設 URL |
|------|------|----------------|
| **whisper-server** | 語音 → **辨識稿**（ASR；語言依擴充「聽譯來源」或自動偵測） | `http://127.0.0.1:8080` |
| **Ollama** | 辨識稿 → **目標語**譯文（可關閉翻譯則不需要） | `http://127.0.0.1:11434` |

兩者皆須**自行啟動**並保持視窗／程序運行；關閉後擴充會連線失敗。

---

## 一、Ollama（翻譯）

### 1. 安裝

1. 開啟 **[Ollama 下載頁](https://ollama.com/download)**，依 **Windows／macOS／Linux** 安裝。  
2. 安裝完成後，終端機應可執行 `ollama`（若提示找不到指令，請確認安裝程式是否已把 `ollama` 加入 PATH，或重開終端機）。

### 2. 下載翻譯模型

擴充預設使用 **TranslateGemma**（與選項頁預設一致）：

```text
ollama pull translategemma:4b
```

（約數 GB，依網速需一些時間。可改用其他支援你所需語對的模型，並在**擴充選項**內改模型名稱；預設 **TranslateGemma** 與 README 說明一致。）

### 3. 啟動 Ollama 服務

**一般情況**（命令列測試、非 Chrome 擴充來源）可在終端機執行：

```text
ollama serve
```

**使用本擴充時**，若出現 **HTTP 403**，代表 Ollama 拒絕 `chrome-extension://` 來源。請**先關閉**工作列／選單列的 Ollama 常駐程式（避免佔用 11434），再在終端機用下列其一啟動：

**PowerShell：**

```powershell
$env:OLLAMA_ORIGINS="chrome-extension://*"; ollama serve
```

**cmd：**

```cmd
set OLLAMA_ORIGINS=chrome-extension://* && ollama serve
```

或使用專案內 **`scripts/start_ollama_allow_extensions.bat`**（內容為英文）：雙擊前同樣建議先關閉工作列 Ollama。

### 4. 驗證

- 瀏覽器或擴充能連到 `http://127.0.0.1:11434`（Ollama 預設埠）。  
- 可選：執行專案 `scripts/ollama_translate_smoke_test.ps1` 做簡單 API 測試。

---

## 二、whisper-server（語音辨識）

### 1. 取得 whisper-server

本專案依 **[whisper.cpp](https://github.com/ggml-org/whisper.cpp)** 的 HTTP **`whisper-server`**（端點 `POST /inference`，multipart 欄位 `file`）。

常見做法：

1. **自行建置**：依上游 repo 說明編譯（可選 CUDA／Vulkan 等加速）。建置產物中需含 **`whisper-server`**（Windows 上常為 `whisper-server.exe`）。  
2. **模型檔**：依 whisper.cpp 文件下載對應 **ggml** 模型（例如 `ggml-base.bin`），路徑記下來給啟動參數 `-m` 使用。

（若你使用第三方預編譯套件，請確認其 **HTTP API** 與本專案相同：根網址 + `/inference`、multipart `file`。）

### 2. 啟動 whisper-server

在**放有 whisper-server 執行檔的目錄**開終端機，範例（請改成你的模型路徑；參數名稱以上游版本為準）：

**Windows（與專案 `scripts/start_whisper_server_example.bat` 概念相同）：**

```text
whisper-server.exe -m "D:\path\to\ggml-base.bin" --host 127.0.0.1 --port 8080
```

**Linux／macOS：**

```bash
./whisper-server -m /path/to/ggml-base.bin --host 127.0.0.1 --port 8080
```

- `--no-gpu` 等旗標視你的建置與硬體決定（見上游文件）。  
- 啟動成功後，擴充選項的 **本機 whisper-server 根網址** 填 `http://127.0.0.1:8080`（若你改用其他埠請一併修改）。

### 3. 專案內範例腳本

編輯 **`scripts/start_whisper_server_example.bat`** 內的 `WHISPER_DIR`、`MODEL_PATH`、`PORT` 後雙擊執行，可省去每次手打指令。

---

## 三、與擴充選項對齊

1. **whisper-server** 與（若需翻譯）**Ollama** 皆已啟動。  
2. 開啟擴充 **選項**：  
   - **本機 whisper-server 根網址**：與實際 listen 位址一致，**無**結尾斜線。  
   - **Ollama**：URL、模型名與 `ollama pull` 一致；若選 **不翻譯** 可不啟 Ollama。  
3. **儲存**；變更後請在影片分頁 **停止再開始**擷取。

---

## 四、疑難（精簡）

| 現象 | 處理方向 |
|------|----------|
| Whisper 連線失敗 | 確認 whisper-server 已執行、防火牆未擋 localhost、選項 URL／埠正確。 |
| Ollama 403 | 設定 `OLLAMA_ORIGINS=chrome-extension://*` 後**重啟** `ollama serve`；見上文「一、Ollama」第 3 小節。 |
| 埠被占用 | 關閉重複的 Ollama／另一個 whisper-server，或改埠並同步修改選項 URL。 |

更完整說明見根目錄 **README.md**「疑難排解」。

---

*選項頁內「首次使用」摺疊區塊可快速複製常用指令；細節以本文件為準。*

---

## Languages

- [English](LOCAL_SETUP.md)
- [繁體中文](LOCAL_SETUP.zh-TW.md)
