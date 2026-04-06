# Local setup (whisper-server, Ollama)

## Languages

- [English](LOCAL_SETUP.md)
- [繁體中文](LOCAL_SETUP.zh-TW.md)

---

For users who have **not installed** or **don’t know how to start** services. The Chrome extension **cannot** install or run local programs—complete these steps on the machine.  
Extension version follows root `manifest.json` **`version`** (currently **0.7.3**). **Doc/version index:** [`docs/DOC_SYNC.md`](DOC_SYNC.md).

---

## Overview

| Service | Role | Default URL in the extension |
|---------|------|------------------------------|
| **whisper-server** | Speech → **recognition text** (ASR; language from “source” or auto-detect) | `http://127.0.0.1:8080` |
| **Ollama** | Recognition → **target-language** translation (not needed if translation is off) | `http://127.0.0.1:11434` |

Both must be **started by you** and kept running; if stopped, the extension cannot connect.

---

## 1. Ollama (translation)

### Install

1. Open **[Ollama download](https://ollama.com/download)** and install for **Windows / macOS / Linux**.  
2. After install, `ollama` should work in a terminal (if not, check PATH or restart the terminal).

### Pull a translation model

Default in the extension is **TranslateGemma** (matches Options):

```text
ollama pull translategemma:4b
```

(Size is a few GB; you can use another model that supports your language pair and set its name in **Options**.)

### Start Ollama

**Typical** (CLI tests, non-extension) use:

```text
ollama serve
```

**With this extension**, **HTTP 403** means Ollama rejected `chrome-extension://` origins. **Quit** the tray/menu Ollama app first (so port 11434 is free), then start with one of:

**PowerShell:**

```powershell
$env:OLLAMA_ORIGINS="chrome-extension://*"; ollama serve
```

**cmd:**

```cmd
set OLLAMA_ORIGINS=chrome-extension://* && ollama serve
```

Or use **`scripts/start_ollama_allow_extensions.bat`** (English comments)—still quit tray Ollama first.

### Verify

- Browser or extension can reach `http://127.0.0.1:11434`.  
- Optional: run `scripts/ollama_translate_smoke_test.ps1`.

---

## 2. whisper-server (ASR)

### Get whisper-server

This project targets **[whisper.cpp](https://github.com/ggml-org/whisper.cpp)** HTTP **`whisper-server`** (`POST /inference`, multipart field `file`).

Common paths:

1. **Build yourself** from upstream (optional CUDA/Vulkan). You need the **`whisper-server`** binary (`whisper-server.exe` on Windows).  
2. **Model files:** download the **ggml** model whisper.cpp expects (e.g. `ggml-base.bin`) for the `-m` flag.

(Third-party builds must expose the **same HTTP API**: base URL + `/inference`, multipart `file`.)

### Start whisper-server

From the directory that contains the binary, example (edit model path; flags depend on upstream):

**Windows (same idea as `scripts/start_whisper_server_example.bat`):**

```text
whisper-server.exe -m "D:\path\to\ggml-base.bin" --host 127.0.0.1 --port 8080
```

**Linux / macOS:**

```bash
./whisper-server -m /path/to/ggml-base.bin --host 127.0.0.1 --port 8080
```

Add `--no-gpu` etc. per your build/hardware (see upstream docs).  
When running, set **local whisper-server base URL** in Options to `http://127.0.0.1:8080` (or your port).

### Project script

Edit **`scripts/start_whisper_server_example.bat`** (`WHISPER_DIR`, `MODEL_PATH`, `PORT`) and double-click to run.

---

## 3. Match extension options

1. **whisper-server** and (if needed) **Ollama** are running.  
2. Open **extension options**:  
   - **Local whisper-server base URL** matches listen address, **no** trailing slash.  
   - **Ollama** URL/model match `ollama pull`; if **no translation**, Ollama need not run.  
3. **Save**; after changes, **stop and start** capture on the video tab.

---

## 4. Quick troubleshooting

| Symptom | What to check |
|---------|----------------|
| Whisper connection failed | Server running, firewall allows localhost, Options URL/port correct. |
| Ollama 403 | Set `OLLAMA_ORIGINS=chrome-extension://*` and **restart** `ollama serve`; see §1.3. |
| Port in use | Stop duplicate Ollama/whisper-server or change port and Options URL. |

More detail: root **README.md** “Troubleshooting”.

---

*Options “first run” can copy common commands; this file is the detailed reference.*
