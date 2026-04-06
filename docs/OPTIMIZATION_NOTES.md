# Optimization notes (Video Live Translate)

## Languages

- [English](OPTIMIZATION_NOTES.md)
- [繁體中文](OPTIMIZATION_NOTES.zh-TW.md)

---

> **Location:** this file in the **same repo** as the extension (`docs/OPTIMIZATION_NOTES.md`)—**not** a separate optimization repo.  
> **Source:** notes from pipeline discussions (tab capture → whisper-server ASR → Ollama translation); language pairs follow user settings.  
> **Created:** 2026-04-06｜**Last updated:** 2026-04-06 (**full doc sync**; app **manifest 0.7.3**; index [`DOC_SYNC.md`](DOC_SYNC.md); §6 local auto-start)

---

## 1. Bottlenecks (current pipeline)

Per audio chunk, roughly:

1. **whisper-server** `POST …/inference` (ASR)—often a major latency contributor.  
2. **Ollama** `/api/chat` (translation)—in-extension `num_predict`: chat **768**, generate fallback **1024** (see `src/background/local_pipeline.js`).

Shorter chunks → fresher subtitles, more **HTTP / inference** calls; longer chunks → heavier single calls, fewer round-trips.

---

## 2. Try first (usually **no** whisper-server / Ollama **source** changes)

| Direction | Notes |
|-----------|--------|
| GPU | Prefer **GPU builds** for Whisper and Ollama (CUDA / ROCm / Metal per platform). |
| Whisper model | Smaller server model (e.g. base/small) trades accuracy for speed. |
| Ollama model | Stay on a smaller translation model (e.g. `translategemma:4b`); larger is usually slower. |
| Chunk seconds | Options or **Popup slider** 2–12 s: tune “feel” vs request rate. |
| Ollama `options` | Experiment with `num_thread` (per Ollama docs); lowering `num_predict` may speed up but risks truncation on short text. |
| No translation | Skips Ollama entirely. |

---

## 3. When to touch upstream / source

- **Most cases:** official **releases / binaries** + correct GPU + model—**no** fork of whisper.cpp or Ollama.  
- **Build whisper.cpp from source:** when you need hardware tuning or `/inference` behavior differs from this extension.  
- **Ollama source:** only for server behavior changes, experiments, or exotic hardware.

---

## 4. In-extension pipeline ideas (to evaluate)

Extension / service worker / offscreen logic—not mandatory Whisper/Ollama core changes:

- **Overlap** chunks or **queue** to reduce end-to-end idle time (cap concurrency; preserve order).  
- Skip or merge **silent / low-RMS** chunks to cut useless ASR calls.  
- Translation cache (same sentence → no repeat Ollama)—Phase 2 mentioned; needs privacy / memory policy.

---

## 5. Follow-ups (checkboxes)

- [ ] Measure on hardware: per-chunk ASR time vs single Ollama call (same model).  
- [ ] Decide whether to expose `num_thread` in Options or document only.  
- [ ] If overlapping pipeline: define max concurrency and subtitle ordering guarantees.  
- [ ] For “one-click start” of local services: weigh [Chrome Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) vs install cost (see §6).

---

## 6. Can a webpage / extension auto-start local services?

**Answer:** **No**—ordinary pages or **MV3 extension JS** cannot arbitrarily run local `whisper-server` or `ollama serve` (no “execute local exe” API). `README.md` states the extension **cannot** run `.exe` for you.

| Context | Possible? |
|---------|-----------|
| Plain web | No (browser sandbox) |
| MV3 extension only (content / SW / offscreen) | No |

**Workarounds (all need extra user-side setup):**

| Approach | Notes |
|----------|--------|
| **Native Messaging** | User installs a **native host**; the extension talks through Chrome’s channel; the **host** starts/monitors whisper-server and Ollama. Standard path to “trigger local processes” from an extension, but higher dev/signing/cross-platform cost. |
| **OS scheduler / login items** | Start services at boot/login; extension only connects and health-checks. |
| **Local agent** | Separate always-on app with a local API; still must be installed and started once (or via scheduler). |
| **Custom URL scheme** | Still requires an OS-registered handler—ultimately a local launcher. |

**Product tradeoff:** “manual or scripted start + docs” is cheapest; “near one-click” needs **Native Messaging** or a **desktop launcher** product line.

---

*Read with [`DOC_SYNC.md`](DOC_SYNC.md), `docs/DEVELOPMENT_PROGRESS.md`, `tasks/todo.md` for version alignment and backlog.*
