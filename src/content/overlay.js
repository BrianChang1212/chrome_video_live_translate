/**
 * In-page subtitle overlay + audio level meter (optional visual feedback).
 * Optional debug HUD: RMS, message rate, offscreen-reported AudioContext / tracks.
 */

/* global VLTConstants, VLTMessages */

const ROOT_ID = "vlt-overlay-root";
const DEBUG_KEY = VLTConstants.KEY_DEBUG_HUD;
const POS_KEY = "vlt_overlay_pos";
/** 不透明度範圍見 VLTConstants.UI_OPACITY_* */
const OPACITY_DEBUG_KEY = VLTConstants.KEY_DEBUG_PANEL_OPACITY;
/** 舊版字幕專用鍵，僅供讀取遷移 */
const OPACITY_CAPTION_LEGACY_KEY = VLTConstants.KEY_LEGACY_CAPTION_OPACITY;
const OPACITY_MIN = VLTConstants.UI_OPACITY_MIN_PCT;
const OPACITY_MAX = VLTConstants.UI_OPACITY_MAX_PCT;
const OPACITY_DEFAULT = VLTConstants.UI_OPACITY_DEFAULT_PCT;

const CAPTION_KEYS = [
  VLTConstants.KEY_CAPTION_FONT_FAMILY,
  VLTConstants.KEY_CAPTION_FONT_DYNAMIC,
  VLTConstants.KEY_CAPTION_FONT_MIN_PX,
  VLTConstants.KEY_CAPTION_FONT_MAX_PX,
  VLTConstants.KEY_CAPTION_FONT_VW,
  VLTConstants.KEY_CAPTION_FONT_PX,
  VLTConstants.KEY_CAPTION_BOX_WIDTH_PX,
];

const FONT_PRESETS = {
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  jhenghei:
    '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Heiti TC", sans-serif',
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  mono: "ui-monospace, Consolas, monospace",
};

const DEFAULT_CAPTION = {
  vltCaptionFontFamily: "system",
  vltCaptionFontDynamic: true,
  vltCaptionFontMinPx: VLTConstants.UI_CAPTION_FONT_MIN_DEFAULT,
  vltCaptionFontMaxPx: VLTConstants.UI_CAPTION_FONT_MAX_DEFAULT,
  vltCaptionFontVw: VLTConstants.UI_CAPTION_FONT_VW_DEFAULT,
  vltCaptionFontPx: VLTConstants.UI_CAPTION_FONT_PX_DEFAULT,
  vltCaptionBoxWidthPx: VLTConstants.UI_CAPTION_BOX_DEFAULT_PX,
};

/** @type {typeof DEFAULT_CAPTION} */
let captionSettings = { ...DEFAULT_CAPTION };

let debugHudEnabled = false;
/** @type {boolean} */
let overlayDragInstalled = false;
/** @type {boolean} */
let overlayResizeInstalled = false;
/** @type {boolean} */
let overlayPositionLoaded = false;
/** @type {boolean} */
let captionAppearanceLoaded = false;
let lastRawLevel = 0;
let lastLevelAt = 0;
let levelEvents = [];
let lastDebugPayload = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let pipelineNoteTimer = null;
/** @type {boolean} */
let debugHudControlsInstalled = false;
/** @type {boolean} */
let opacitySlidersInstalled = false;

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (root) {
    return root;
  }
  root = document.createElement("div");
  root.id = ROOT_ID;
  document.documentElement.appendChild(root);
  root.innerHTML = `
    <div class="vlt-debug" hidden>
      <header class="vlt-dbg-head">
        <div class="vlt-dbg-brand">
          <span class="vlt-dbg-prompt" aria-hidden="true">&gt;_</span>
          <span class="vlt-dbg-title">VLT DEBUG</span>
        </div>
        <button type="button" class="vlt-dbg-toggle" aria-expanded="true" aria-label="收合／展開除錯面板" title="收合／展開">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 10V4h6M14 4h6v6M20 14v6h-6M10 20H4v-6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </header>
      <div class="vlt-dbg-body">
        <section class="vlt-dbg-rms">
          <div class="vlt-dbg-rms__top">
            <span class="vlt-dbg-rms__label">
              <span class="vlt-dbg-rms__waves" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12c2-4 4 4 6 0s4 4 6 0 4 4 6 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </span>
              RAW RMS
            </span>
            <span class="vlt-dbg-rms__val" data-vlt-dbg="rms-val">0.000000</span>
          </div>
          <div class="vlt-dbg-bar" role="presentation">
            <span class="vlt-dbg-bar__fill" data-vlt-dbg="bar-fill" style="width:0%"></span>
          </div>
          <div class="vlt-dbg-rms__sub">
            <span>SIGNAL STRENGTH</span>
            <span data-vlt-dbg="sig-pct">0%</span>
          </div>
        </section>
        <div class="vlt-dbg-metrics">
          <div class="vlt-dbg-metric">
            <span class="vlt-dbg-metric__ico" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </span>
            <span class="vlt-dbg-metric__k">LATENCY</span>
            <span class="vlt-dbg-metric__v" data-vlt-dbg="latency">—</span>
          </div>
          <div class="vlt-dbg-metric">
            <span class="vlt-dbg-metric__ico" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 14h4l2-6 3 10 3-8h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span class="vlt-dbg-metric__k">SIGNAL FREQ</span>
            <span class="vlt-dbg-metric__v" data-vlt-dbg="freq">0/s</span>
          </div>
        </div>
        <div class="vlt-dbg-rows">
          <div class="vlt-dbg-row">
            <span class="vlt-dbg-row__k">CONTEXT STATE</span>
            <span class="vlt-dbg-row__v">
              <span data-vlt-dbg="ctx-state">—</span>
              <span class="vlt-dbg-dot" data-vlt-dbg="ctx-dot" hidden aria-hidden="true"></span>
            </span>
          </div>
          <div class="vlt-dbg-row">
            <span class="vlt-dbg-row__k">SAMPLE RATE</span>
            <span class="vlt-dbg-row__v vlt-dbg-row__v--plain" data-vlt-dbg="sample-rate">—</span>
          </div>
        </div>
        <section class="vlt-dbg-opacity" aria-label="除錯面板與字幕浮層共用不透明度">
          <div class="vlt-dbg-opacity__top">
            <span class="vlt-dbg-opacity__k">OVERLAY OPACITY</span>
            <span class="vlt-dbg-opacity__pct" data-vlt-dbg-opacity-pct>${VLTConstants.UI_OPACITY_DEFAULT_PCT}%</span>
          </div>
          <input
            type="range"
            class="vlt-dbg-opacity__range"
            min="${VLTConstants.UI_OPACITY_MIN_PCT}"
            max="${VLTConstants.UI_OPACITY_MAX_PCT}"
            step="1"
            value="${VLTConstants.UI_OPACITY_DEFAULT_PCT}"
            aria-valuemin="${VLTConstants.UI_OPACITY_MIN_PCT}"
            aria-valuemax="${VLTConstants.UI_OPACITY_MAX_PCT}"
          />
        </section>
        <section class="vlt-dbg-media">
          <div class="vlt-dbg-media__head">
            <span class="vlt-dbg-media__ico" aria-hidden="true">▤</span>
            <span class="vlt-dbg-media__title">MEDIA TRACKS</span>
          </div>
          <div class="vlt-dbg-tracks-list" data-vlt-dbg="tracks"></div>
        </section>
        <footer class="vlt-dbg-foot" data-vlt-dbg="foot">LAST LEVEL MSG: NEVER</footer>
      </div>
    </div>
    <div class="vlt-box" hidden>
      <div class="vlt-box__inner">
        <div class="vlt-head">
          <div class="vlt-pill">
            <span class="vlt-pill__dot" aria-hidden="true"></span>
            <span class="vlt-lang-from">EN</span>
          </div>
          <span class="vlt-lang-arrow" aria-hidden="true">→</span>
          <span class="vlt-lang-to">ZH-TW</span>
          <span class="vlt-head-pipe" aria-hidden="true">|</span>
          <span class="vlt-source-snippet"></span>
        </div>
        <div class="vlt-head-rail" role="presentation" aria-hidden="true"></div>
        <div class="vlt-body">
          <span class="vlt-body__icon" aria-hidden="true" title="譯文">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h7M4 12h5M4 18h7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
              <path d="M14 8l6 8M20 8l-6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
          <p class="vlt-line"></p>
        </div>
        <div class="vlt-meter" hidden><span></span></div>
      </div>
      <div class="vlt-cap-accent" aria-hidden="true"></div>
      <div class="vlt-resize" aria-hidden="true" title="拖曳調整寬度"></div>
    </div>
  `;
  installOverlayDrag();
  installOverlayResize();
  installDebugHudControls();
  installOpacityControls();
  scheduleLoadOverlayPosition();
  scheduleLoadCaptionAppearance();
  return root;
}

/**
 * @param {number} pct
 */
function normalizeOpacityPct(pct) {
  const n = Math.round(Number(pct));
  if (!Number.isFinite(n)) {
    return null;
  }
  return clamp(n, OPACITY_MIN, OPACITY_MAX);
}

/**
 * @param {Record<string, unknown>} r
 */
function applyOverlayOpacityFromStorage(r) {
  const dbgRaw = normalizeOpacityPct(r?.[OPACITY_DEBUG_KEY]);
  const legacyRaw = normalizeOpacityPct(r?.[OPACITY_CAPTION_LEGACY_KEY]);
  const pct =
    dbgRaw != null ? dbgRaw : legacyRaw != null ? legacyRaw : OPACITY_DEFAULT;
  applyUnifiedOpacityPct(pct);
}

/**
 * 除錯面板整體透明度與字幕浮層背景 alpha 共用同一數值（由 VLT DEBUG 滑桿／選項頁設定）。
 * @param {number} pct
 */
function applyUnifiedOpacityPct(pct) {
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return;
  }
  const wrap = root.querySelector(".vlt-debug");
  const box = root.querySelector(".vlt-box");
  const input = root.querySelector(".vlt-dbg-opacity__range");
  const label = root.querySelector("[data-vlt-dbg-opacity-pct]");
  const v = clamp(Math.round(pct), OPACITY_MIN, OPACITY_MAX);
  if (wrap) {
    wrap.style.opacity = String(v / VLTConstants.UI_OPACITY_MAX_PCT);
  }
  if (box) {
    box.style.setProperty(
      "--vlt-cap-bg-a",
      String(v / VLTConstants.UI_OPACITY_MAX_PCT),
    );
  }
  if (input) {
    input.value = String(v);
  }
  if (label) {
    label.textContent = `${v}%`;
  }
}

function installOpacityControls() {
  if (opacitySlidersInstalled) {
    return;
  }
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return;
  }
  const dbgRange = root.querySelector(".vlt-dbg-opacity__range");
  if (!dbgRange) {
    return;
  }
  opacitySlidersInstalled = true;
  const stop = (e) => {
    e.stopPropagation();
  };
  dbgRange.addEventListener("pointerdown", stop);
  dbgRange.addEventListener("click", stop);
  dbgRange.addEventListener("input", () => {
    const v = normalizeOpacityPct(dbgRange.value);
    if (v == null) {
      return;
    }
    applyUnifiedOpacityPct(v);
    chrome.storage.local.set({ [OPACITY_DEBUG_KEY]: v });
  });
}

function installDebugHudControls() {
  if (debugHudControlsInstalled) {
    return;
  }
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return;
  }
  const wrap = root.querySelector(".vlt-debug");
  const btn = root.querySelector(".vlt-dbg-toggle");
  if (!wrap || !btn) {
    return;
  }
  debugHudControlsInstalled = true;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const collapsed = wrap.classList.toggle("vlt-debug--collapsed");
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  });
}

/**
 * @param {number} n
 * @param {number} lo
 * @param {number} hi
 */
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {string} [code]
 * @returns {string}
 */
function formatLangLabel(code) {
  const s = String(code || "zh-TW").trim();
  const parts = s.split(/[-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 2).toUpperCase()}-${parts[1].toUpperCase()}`;
  }
  return s.length <= 3 ? s.toUpperCase() : s.slice(0, 2).toUpperCase();
}

/**
 * @param {string} from
 * @param {string} to
 * @param {string} snippet
 */
function setCaptionHead(from, to, snippet) {
  const root = ensureRoot();
  const fromEl = root.querySelector(".vlt-lang-from");
  const toEl = root.querySelector(".vlt-lang-to");
  const snip = root.querySelector(".vlt-source-snippet");
  if (fromEl) {
    fromEl.textContent = from;
  }
  if (toEl) {
    toEl.textContent = to;
  }
  if (snip) {
    snip.textContent = snippet;
  }
}

/**
 * @param {Record<string, unknown>} [raw]
 */
function normalizeCaptionSettings(raw) {
  const r = raw || {};
  const d = { ...DEFAULT_CAPTION };
  const fam = String(r.vltCaptionFontFamily || "system");
  d.vltCaptionFontFamily = Object.prototype.hasOwnProperty.call(FONT_PRESETS, fam)
    ? fam
    : "system";
  d.vltCaptionFontDynamic = r.vltCaptionFontDynamic !== false;
  d.vltCaptionFontMinPx = clamp(
    Math.round(Number(r.vltCaptionFontMinPx)) ||
      VLTConstants.UI_CAPTION_FONT_MIN_DEFAULT,
    VLTConstants.UI_CAPTION_FONT_MIN_CLAMP_LO,
    VLTConstants.UI_CAPTION_FONT_MIN_CLAMP_HI,
  );
  d.vltCaptionFontMaxPx = clamp(
    Math.round(Number(r.vltCaptionFontMaxPx)) ||
      VLTConstants.UI_CAPTION_FONT_MAX_DEFAULT,
    VLTConstants.UI_CAPTION_FONT_MAX_CLAMP_LO,
    VLTConstants.UI_CAPTION_FONT_MAX_CLAMP_HI,
  );
  if (
    d.vltCaptionFontMaxPx <
    d.vltCaptionFontMinPx + VLTConstants.UI_CAPTION_FONT_PAIR_MIN_GAP_PX
  ) {
    d.vltCaptionFontMaxPx =
      d.vltCaptionFontMinPx + VLTConstants.UI_CAPTION_FONT_PAIR_MIN_GAP_PX;
  }
  d.vltCaptionFontVw = clamp(
    Number(r.vltCaptionFontVw) || VLTConstants.UI_CAPTION_FONT_VW_DEFAULT,
    VLTConstants.UI_CAPTION_FONT_VW_CLAMP_LO,
    VLTConstants.UI_CAPTION_FONT_VW_CLAMP_HI,
  );
  d.vltCaptionFontPx = clamp(
    Math.round(Number(r.vltCaptionFontPx)) ||
      VLTConstants.UI_CAPTION_FONT_PX_DEFAULT,
    VLTConstants.UI_CAPTION_FONT_PX_CLAMP_LO,
    VLTConstants.UI_CAPTION_FONT_PX_CLAMP_HI,
  );
  d.vltCaptionBoxWidthPx = clamp(
    Math.round(Number(r.vltCaptionBoxWidthPx)) ||
      VLTConstants.UI_CAPTION_BOX_DEFAULT_PX,
    VLTConstants.UI_CAPTION_BOX_MIN_PX,
    VLTConstants.UI_CAPTION_BOX_MAX_PX,
  );
  return d;
}

function paintCaptionStyles() {
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return;
  }
  const box = root.querySelector(".vlt-box");
  const head = root.querySelector(".vlt-head");
  const line = root.querySelector(".vlt-line");
  if (!box || !head || !line) {
    return;
  }

  const s = captionSettings;
  const family = FONT_PRESETS[s.vltCaptionFontFamily] || FONT_PRESETS.system;
  root.style.fontFamily = family;
  box.style.fontFamily = family;

  if (s.vltCaptionFontDynamic) {
    const minL = s.vltCaptionFontMinPx;
    const maxL = s.vltCaptionFontMaxPx;
    const vw = s.vltCaptionFontVw;
    line.style.fontSize = `clamp(${minL}px, ${vw}vw, ${maxL}px)`;
    const mMin = Math.max(9, Math.round(minL * 0.72));
    const mMax = Math.max(mMin + 2, Math.round(maxL * 0.62));
    const mVw = Math.max(1.2, vw * 0.68);
    head.style.fontSize = `clamp(${mMin}px, ${mVw}vw, ${mMax}px)`;
  } else {
    const fixed = s.vltCaptionFontPx;
    line.style.fontSize = `${fixed}px`;
    head.style.fontSize = `${Math.max(
      VLTConstants.UI_CAPTION_HEAD_FIXED_MIN_PX,
      Math.round(fixed * VLTConstants.UI_CAPTION_HEAD_FIXED_SCALE),
    )}px`;
  }

  const maxAllowed = Math.max(
    VLTConstants.UI_CAPTION_BOX_DRAG_MIN_PX,
    window.innerWidth - 32,
  );
  const w = Math.min(s.vltCaptionBoxWidthPx, maxAllowed);
  root.style.width = `${w}px`;
}

function loadCaptionAppearance() {
  chrome.storage.local.get(CAPTION_KEYS, (r) => {
    if (chrome.runtime.lastError) {
      return;
    }
    captionSettings = normalizeCaptionSettings(r);
    paintCaptionStyles();
  });
}

function scheduleLoadCaptionAppearance() {
  if (captionAppearanceLoaded) {
    return;
  }
  captionAppearanceLoaded = true;
  loadCaptionAppearance();
}

function installOverlayResize() {
  if (overlayResizeInstalled) {
    return;
  }
  const root = ensureRoot();
  const handle = root.querySelector(".vlt-resize");
  if (!handle) {
    return;
  }
  overlayResizeInstalled = true;

  let resizing = false;
  let startX = 0;
  let startW = 0;

  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    resizing = true;
    const rect = root.getBoundingClientRect();
    startW = rect.width;
    startX = e.clientX;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  });

  handle.addEventListener("pointermove", (e) => {
    if (!resizing) {
      return;
    }
    const maxAllowed = Math.max(
      VLTConstants.UI_CAPTION_BOX_DRAG_MIN_PX,
      window.innerWidth - 32,
    );
    const cap = Math.min(VLTConstants.UI_CAPTION_BOX_MAX_PX, maxAllowed);
    const dw = e.clientX - startX;
    const w = clamp(
      Math.round(startW + dw),
      VLTConstants.UI_CAPTION_BOX_DRAG_MIN_PX,
      cap,
    );
    root.style.width = `${w}px`;
    captionSettings.vltCaptionBoxWidthPx = w;
  });

  const endResize = (e) => {
    if (!resizing) {
      return;
    }
    resizing = false;
    try {
      if (e.pointerId != null) {
        handle.releasePointerCapture(e.pointerId);
      }
    } catch (_) {
      /* ignore */
    }
    const maxAllowed = Math.max(
      VLTConstants.UI_CAPTION_BOX_DRAG_MIN_PX,
      window.innerWidth - 32,
    );
    const cap = Math.min(VLTConstants.UI_CAPTION_BOX_MAX_PX, maxAllowed);
    const w = clamp(
      Math.round(root.getBoundingClientRect().width),
      VLTConstants.UI_CAPTION_BOX_DRAG_MIN_PX,
      cap,
    );
    captionSettings.vltCaptionBoxWidthPx = w;
    root.style.width = `${w}px`;
    chrome.storage.local.set({
      [VLTConstants.KEY_CAPTION_BOX_WIDTH_PX]: w,
    });
  };

  handle.addEventListener("pointerup", endResize);
  handle.addEventListener("pointercancel", endResize);
}

/**
 * @param {number} left
 * @param {number} top
 */
function applyOverlayPixelPosition(left, top) {
  const root = ensureRoot();
  const margin = 8;
  const rect = root.getBoundingClientRect();
  const w = Math.max(rect.width || root.offsetWidth || 0, 200);
  const h = Math.max(rect.height || root.offsetHeight || 0, 48);
  const L = clamp(left, margin, window.innerWidth - w - margin);
  const T = clamp(top, margin, window.innerHeight - h - margin);
  root.style.left = `${L}px`;
  root.style.top = `${T}px`;
  root.style.bottom = "auto";
  root.style.transform = "none";
  root.dataset.vltPos = "custom";
}

function persistOverlayPosition() {
  const root = document.getElementById(ROOT_ID);
  if (!root || root.dataset.vltPos !== "custom") {
    return;
  }
  const r = root.getBoundingClientRect();
  chrome.storage.local.set({
    [POS_KEY]: { left: r.left, top: r.top },
  });
}

function installOverlayDrag() {
  if (overlayDragInstalled) {
    return;
  }
  const root = ensureRoot();
  const head = root.querySelector(".vlt-head");
  if (!head) {
    return;
  }
  overlayDragInstalled = true;

  /** @type {boolean} */
  let dragging = false;
  let grabOx = 0;
  let grabOy = 0;

  head.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    dragging = true;
    const rect = root.getBoundingClientRect();
    grabOx = e.clientX - rect.left;
    grabOy = e.clientY - rect.top;
    try {
      head.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  });

  head.addEventListener("pointermove", (e) => {
    if (!dragging) {
      return;
    }
    const margin = 8;
    const left = e.clientX - grabOx;
    const top = e.clientY - grabOy;
    const rect = root.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const L = clamp(left, margin, window.innerWidth - w - margin);
    const T = clamp(top, margin, window.innerHeight - h - margin);
    root.style.left = `${L}px`;
    root.style.top = `${T}px`;
    root.style.bottom = "auto";
    root.style.transform = "none";
    root.dataset.vltPos = "custom";
  });

  const endDrag = (e) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    try {
      if (e.pointerId != null) {
        head.releasePointerCapture(e.pointerId);
      }
    } catch (_) {
      /* ignore */
    }
    persistOverlayPosition();
  };

  head.addEventListener("pointerup", endDrag);
  head.addEventListener("pointercancel", () => {
    if (dragging) {
      dragging = false;
      persistOverlayPosition();
    }
  });
}

function loadOverlayPosition() {
  chrome.storage.local.get([POS_KEY], (r) => {
    if (chrome.runtime.lastError) {
      return;
    }
    const p = r[POS_KEY];
    if (!p || typeof p.left !== "number" || typeof p.top !== "number") {
      return;
    }
    requestAnimationFrame(() => {
      applyOverlayPixelPosition(p.left, p.top);
    });
  });
}

function scheduleLoadOverlayPosition() {
  if (overlayPositionLoaded) {
    return;
  }
  overlayPositionLoaded = true;
  loadOverlayPosition();
}

window.addEventListener("resize", () => {
  const root = document.getElementById(ROOT_ID);
  if (root && root.dataset.vltPos === "custom") {
    const rect = root.getBoundingClientRect();
    const margin = 8;
    const L = clamp(rect.left, margin, window.innerWidth - rect.width - margin);
    const T = clamp(rect.top, margin, window.innerHeight - rect.height - margin);
    root.style.left = `${L}px`;
    root.style.top = `${T}px`;
    persistOverlayPosition();
  }
  paintCaptionStyles();
});

function els() {
  const root = ensureRoot();
  const box = root.querySelector(".vlt-box");
  const head = root.querySelector(".vlt-head");
  const line = root.querySelector(".vlt-line");
  const meter = root.querySelector(".vlt-meter");
  const meterBar = meter?.querySelector("span");
  return { root, box, head, line, meter, meterBar };
}

function setOverlayState(state, detail, sourceBadge, targetBadge) {
  const { box, line, meter } = els();
  const srcPill = String(sourceBadge || "EN").toUpperCase().slice(0, 8);
  const tgtPill = String(targetBadge || "ZH-TW").toUpperCase().slice(0, 12);
  if (state === "capturing") {
    box.hidden = false;
    setCaptionHead(
      srcPill,
      tgtPill,
      detail || VLTMessages.overlayCapturingPlaceholder(),
    );
    line.textContent = "";
    if (meter) {
      meter.hidden = false;
    }
    return;
  }
  if (state === "idle") {
    box.hidden = true;
    setCaptionHead("EN", "ZH-TW", "");
    line.textContent = "";
    if (meter) {
      meter.hidden = true;
    }
  }
}

function setSubtitleLines(lines) {
  const { box, line } = els();
  const first = Array.isArray(lines) ? lines[0] : null;
  if (!first?.text) {
    return;
  }
  box.hidden = false;
  const srcRaw = first.sourceLine ? String(first.sourceLine) : "";
  const src = srcRaw ? `${srcRaw.slice(0, 120)}${srcRaw.length > 120 ? "…" : ""}` : "";
  const rawBadge = String(first.sourceLang ?? "").trim();
  const srcLang = rawBadge.length > 0 ? rawBadge.toUpperCase().slice(0, 8) : "EN";
  setCaptionHead(
    srcLang,
    formatLangLabel(first.lang),
    src || VLTMessages.overlayNoSourceSnippet(),
  );
  line.textContent = first.text;
}

function setAudioLevel(level) {
  const { meter, meterBar, box } = els();
  if (!meter || !meterBar) {
    return;
  }
  const x = Number(level) || 0;
  lastRawLevel = x;
  lastLevelAt = performance.now();
  const now = Date.now();
  levelEvents.push(now);
  const cutoff = now - 1000;
  while (levelEvents.length && levelEvents[0] < cutoff) {
    levelEvents.shift();
  }
  /* RMS is often small; sqrt + higher gain makes the bar readable for speech. */
  const pct = Math.min(100, Math.round(100 * Math.sqrt(Math.min(1, x * 80))));
  meterBar.style.width = `${pct}%`;
  if (!box.hidden) {
    meter.hidden = false;
  }
  refreshDebugHud();
}

function debugHudEls() {
  const root = ensureRoot();
  const wrap = root.querySelector(".vlt-debug");
  return { wrap };
}

/**
 * @param {HTMLElement} container
 */
function renderDebugTracks(container) {
  if (!container) {
    return;
  }
  container.textContent = "";
  const payload = lastDebugPayload;
  const tracks = Array.isArray(payload?.tracks) ? payload.tracks : [];
  if (!tracks.length) {
    const row = document.createElement("div");
    row.className = "vlt-dbg-track vlt-dbg-track--empty";
    row.textContent = VLTMessages.overlayDebugNoTracks();
    container.appendChild(row);
    return;
  }
  for (let i = 0; i < tracks.length; i += 1) {
    const t = tracks[i] || {};
    const live = t.readyState === "live" && t.enabled !== false;
    const name =
      String(t.label || "").trim() || (i === 0 ? "Primary Audio" : `Audio ${i + 1}`);
    const row = document.createElement("div");
    row.className = "vlt-dbg-track";
    const ico = document.createElement("span");
    ico.className = "vlt-dbg-track__ico";
    ico.setAttribute("aria-hidden", "true");
    ico.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.05 7.05l1.42 1.42M15.54 15.54l1.41 1.41M7.05 16.95l1.42-1.41M15.54 8.46l1.41-1.41" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
    const nm = document.createElement("span");
    nm.className = "vlt-dbg-track__name";
    nm.textContent = name;
    const meta = document.createElement("span");
    meta.className = "vlt-dbg-track__meta";
    if (live) {
      const chk = document.createElement("span");
      chk.className = "vlt-dbg-track__check";
      chk.textContent = "✓";
      const tag = document.createElement("span");
      tag.className = "vlt-dbg-live";
      tag.textContent = "LIVE";
      meta.appendChild(chk);
      meta.appendChild(tag);
    } else {
      const tag = document.createElement("span");
      tag.className = "vlt-dbg-live vlt-dbg-live--off";
      tag.textContent = String(t.readyState || "off").toUpperCase();
      meta.appendChild(tag);
    }
    row.appendChild(ico);
    row.appendChild(nm);
    row.appendChild(meta);
    container.appendChild(row);
  }
}

function refreshDebugHud() {
  if (!debugHudEnabled) {
    /* 任何訊息（擷取狀態、音訊位準、CAPTURE_DEBUG）都會觸發本函式；關閉除錯時強制隱藏，避免 hidden 曾被意外清掉仍露出標題列。 */
    const root = document.getElementById(ROOT_ID);
    const wrapOff = root?.querySelector(".vlt-debug");
    if (wrapOff) {
      wrapOff.hidden = true;
    }
    return;
  }
  const { wrap } = debugHudEls();
  if (!wrap) {
    return;
  }
  wrap.hidden = false;
  const ageMs = lastLevelAt > 0 ? Math.round(performance.now() - lastLevelAt) : null;
  const barPct = Math.min(
    100,
    Math.round(100 * Math.sqrt(Math.min(1, lastRawLevel * 80))),
  );
  const freq = levelEvents.length;

  const el = (name) => wrap.querySelector(`[data-vlt-dbg="${name}"]`);

  const rmsVal = el("rms-val");
  if (rmsVal) {
    rmsVal.textContent = lastRawLevel.toFixed(6);
  }
  const barFill = el("bar-fill");
  if (barFill) {
    barFill.style.width = `${barPct}%`;
  }
  const sigPct = el("sig-pct");
  if (sigPct) {
    sigPct.textContent = `${barPct}%`;
  }

  const latencyEl = el("latency");
  if (latencyEl) {
    latencyEl.textContent =
      ageMs == null ? "—" : `+${ageMs}ms`;
  }

  const freqEl = el("freq");
  if (freqEl) {
    freqEl.textContent = `${freq}/s`;
  }

  const ctx = lastDebugPayload?.audioContextState;
  const ctxEl = el("ctx-state");
  const ctxDot = el("ctx-dot");
  if (ctxEl) {
    const running = ctx === "running";
    ctxEl.textContent = ctx || "—";
    ctxEl.classList.toggle("vlt-dbg-teal", running);
    if (ctxDot) {
      ctxDot.hidden = !running;
    }
  }

  const srEl = el("sample-rate");
  if (srEl) {
    const hz = Number(lastDebugPayload?.sampleRate) || 0;
    srEl.textContent = hz > 0 ? `${Math.round(hz)} Hz` : "—";
  }

  const tracksBox = el("tracks");
  renderDebugTracks(tracksBox);

  const foot = el("foot");
  if (foot) {
    foot.textContent =
      ageMs == null
        ? "LAST LEVEL MSG: NEVER"
        : `LAST LEVEL MSG: ${ageMs}MS AGO`;
  }
}

function setDebugHudVisible(on) {
  debugHudEnabled = on;
  const { wrap } = debugHudEls();
  if (!wrap) {
    return;
  }
  if (!on) {
    wrap.hidden = true;
    return;
  }
  refreshDebugHud();
}

chrome.storage.local.get(
  [DEBUG_KEY, OPACITY_DEBUG_KEY, OPACITY_CAPTION_LEGACY_KEY],
  (r) => {
    ensureRoot();
    setDebugHudVisible(r[DEBUG_KEY] === true);
    applyOverlayOpacityFromStorage(r || {});
  },
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }
  if (DEBUG_KEY in changes) {
    setDebugHudVisible(changes[DEBUG_KEY].newValue === true);
  }
  if (
    OPACITY_DEBUG_KEY in changes ||
    OPACITY_CAPTION_LEGACY_KEY in changes
  ) {
    chrome.storage.local.get(
      [OPACITY_DEBUG_KEY, OPACITY_CAPTION_LEGACY_KEY],
      (r) => {
        if (chrome.runtime.lastError) {
          return;
        }
        applyOverlayOpacityFromStorage(r || {});
      },
    );
  }
  if (CAPTION_KEYS.some((k) => k in changes)) {
    chrome.storage.local.get(CAPTION_KEYS, (r) => {
      if (chrome.runtime.lastError) {
        return;
      }
      captionSettings = normalizeCaptionSettings(r);
      paintCaptionStyles();
    });
  }
});

setInterval(() => {
  if (debugHudEnabled) {
    refreshDebugHud();
  }
}, 500);

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "VLT_OVERLAY_STATE") {
    setOverlayState(
      message.state,
      message.detail,
      message.sourceBadge,
      message.targetBadge,
    );
    refreshDebugHud();
  }
  if (message?.type === "VLT_SUBTITLE") {
    setSubtitleLines(message.lines);
  }
  if (message?.type === "VLT_AUDIO_LEVEL") {
    setAudioLevel(Number(message.level) || 0);
  }
  if (message?.type === "VLT_CAPTURE_DEBUG") {
    lastDebugPayload = message.payload || null;
    refreshDebugHud();
  }
  if (message?.type === "VLT_PIPELINE_NOTE") {
    const { box, line } = els();
    if (!box.hidden && message.text) {
      const msg = `${VLTMessages.overlayPipelineWarningPrefix()}${message.text}`;
      line.textContent = msg;
      if (pipelineNoteTimer != null) {
        clearTimeout(pipelineNoteTimer);
      }
      pipelineNoteTimer = setTimeout(() => {
        pipelineNoteTimer = null;
        if (line.textContent === msg) {
          line.textContent = "";
        }
      }, 8000);
    }
  }
});
