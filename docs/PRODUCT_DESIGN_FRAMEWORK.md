# Video Live Translate — product design framework (draft)

| Item | Content |
|------|---------|
| Doc version | 0.1 (draft) |
| Maps to code | **`version` 0.7.3** (root `manifest.json`; index [`DOC_SYNC.md`](DOC_SYNC.md)): tab capture, offscreen, **local whisper-server ASR**, **local Ollama** multi-pair translation, overlay; Popup/Options **direction sync** and quick chunk tuning (see README, [`LOCAL_SETUP.md`](LOCAL_SETUP.md), [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md), [`OPTIMIZATION_NOTES.md`](OPTIMIZATION_NOTES.md); parts of this doc remain long-term draft) |
| Goal | Align **what to build, order, and acceptance** before product/tech/store review |

---

## 1. One-liner

In Chrome, give **live or near-live translated subtitles** (and optionally dubbing) for **playing video/audio**, especially when **no baked-in captions** exist.

---

## 2. Problems

| Pain | Detail |
|------|--------|
| Language barrier | Users want foreign video, live, courses—but no captions or wrong language |
| Tool fragmentation | Switch apps, upload files, or only a few sites supported |
| Trust & cost | Where audio goes, pricing, latency, and accuracy are opaque |

---

## 3. Target users (multi-select, TBD)

- **A. Casual viewers:** YouTube/social/news; occasional use; wants simple & low cost  
- **B. Learners:** Long sessions; readability, terminology, comparison with source language  
- **C. Professionals:** Meeting recordings, courses, internal sites; privacy/compliance (**enterprise/self-host**)

**Confirm:** which is **Primary** for v1? (Pick one to avoid MVP sprawl.)

---

## 4. Value props (draft)

1. **In-tab:** stay on the page; subtitles (or dubbing) overlay.  
2. **Works without captions:** pipeline is “tab audio → recognize → translate → render” (latency/quality depends on engines).  
3. **Explainable privacy:** clear whether processing is **local / self-hosted / cloud** (store & trust).

---

## 5. Scope layers

### 5.1 MVP (proposed—edit as needed)

| ID | Capability | Notes |
|----|------------|--------|
| M1 | Manual start/stop | User starts from popup (gesture + `tabCapture` convention) |
| M2 | Single-tab focus | Only the **tab being captured** shows state + overlay |
| M3 | Overlay | At least bottom bar + readability; advanced styling → Phase 2 |
| M4 | One STT path | **Current (v0.7.x+):** local whisper-server (Whisper-class); long-term may add cloud streaming ASR |
| M5 | One MT path | Source: auto or manual; target: settings |
| M6 | Privacy page | Dedicated “privacy & data handling” + permission rationale + store copy |

### 5.2 Phase 2 (not MVP)

- Site shortcuts (e.g. detect `video`, one-click)  
- Source + translation rows, optional local history (toggle off)  
- TTS dubbing and mix strategy  
- Paid tiers / usage / BYOK  

### 5.3 Explicit non-goals (reduce slip)

- Don’t claim **zero latency**; communicate **measurable E2E ranges**  
- Don’t promise DRM-protected capture (usually **impossible**—UX must say so)  
- Don’t promise **100% site compatibility** as MVP  

---

## 6. Core flow (wire text)

```
Open a normal page with video
    → Click extension (popup)
    → [Start capture] (hint: audio must play; some sites unsupported)
    → Page shows capturing / connecting / recognizing
    → Overlay shows translation (optional source snippet)
    → [Stop] releases capture and connections
```

**Exceptions (document in UI)**

- `chrome://`, `edge://`, some system pages: no capture  
- Muted tab: hint to unmute  
- DRM / site policy: may be unsupported  

---

## 7. UX principles

| Principle | Meaning |
|-----------|---------|
| Predictable | When audio is processed, cost/connection visible |
| Non-blocking | Overlay doesn’t steal clicks (`pointer-events` vs draggable areas) |
| Stoppable | One click stops and clears UI state |
| Least privilege | Tighten `host_permissions` / `matches` over time (store-friendly) |

---

## 8. Tech & compliance (product awareness)

| Topic | Why it matters |
|-------|----------------|
| `tabCapture` | Needs user gesture; tied to popup flow |
| Offscreen / AudioContext | Audio work belongs offscreen; affects latency & CPU/GPU |
| Cloud STT/MT | Transport & billing; privacy + region/vendor copy |
| Local/self-host | Higher install bar; better for B2B / privacy-sensitive |
| Web Store review | Permissions, narrow hosts, data disclosures must match code |

---

## 9. Success metrics (suggest—define KPIs)

| Type | Examples |
|------|----------|
| Reliability | MVP runs **10 minutes** uninterrupted on chosen test sites |
| Feel | Median & P95 caption lag (set targets after engine choice) |
| Quality | Subjective readability or light human/MT sampling |
| Trust | Low share of store reviews citing “privacy/permissions” |

---

## 10. Risks & assumptions

| Risk | Mitigation |
|------|------------|
| Latency higher than expected | Label Beta/experiment; show connection/buffer state |
| Site incompatibility | Maintain “known limits” + clear errors |
| Cloud cost | Caps, BYOK, or paid-only |
| Legal / ToS | State “no DRM circumvention”; remind users of platform rules |

**Assumptions (revisit if wrong)**

- Ship on **Chrome (Chromium)** first; Edge compatibility TBD  
- Users accept **manual start/stop** for v0  

---

## 11. Checklist for you

1. **Primary user:** A/B/C? English-only UI for v1 OK?  
2. **MVP language pairs:** required source → target (e.g. `en → zh-TW`)?  
3. **STT preference:** cloud vs local/self-host—both on roadmap?  
4. **Output:** MVP subtitles only, or **must** include TTS?  
5. **Business model:** free trial / subscription / BYOK / fully open—direction?  
6. **Compatibility scope:** MVP = generic HTML5 `video` + non-DRM only? YouTube/Netflix called out explicitly?  
7. **Retention:** forbid storing audio? allow local transcript with one-click wipe?  

---

## 12. Doc maintenance

- After §11 is answered, bump this doc to **0.2 (requirements aligned)** and refresh the one-line “product status” in `README.md`.  
- On major changes (permissions, data flow), update §5, §8, §11 so store copy matches code.

---

**Next step:** after the checklist, a shorter **PRD appendix** (user stories, AC, error copy) or deeper architecture/API tables.

---

## Languages

- [English](PRODUCT_DESIGN_FRAMEWORK.md)
- [繁體中文](PRODUCT_DESIGN_FRAMEWORK.zh-TW.md)
