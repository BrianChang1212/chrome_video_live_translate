/**
 * User-facing Traditional Chinese strings + error templates (MV3, no bundler).
 * Depends on nothing; load after vlt_constants.js if a message ever needs it.
 */
(function initVltMessages(global) {
  const M = {
    /** HTTP error labels passed to errOllamaForbidden / errOllamaHttpLine */
    labelOllamaChat: "Ollama chat",
    labelOllamaGenerate: "Ollama generate",

    errWhisperUrlScheme() {
      return "本機 Whisper URL 須為 http://… 或 https://…";
    },
    errWhisperConnect(detail) {
      return `本機 Whisper 連線失敗 (${detail})。請確認已啟動 whisper-server（例如 127.0.0.1:8080）。`;
    },
    errWhisperHttp(status, bodySnippet) {
      return `本機 Whisper ${status}: ${bodySnippet}`;
    },
    errWhisperNotJson(bodySnippet) {
      return `本機 Whisper 回傳非 JSON: ${bodySnippet}`;
    },

    errOllamaResponseEmpty() {
      return "Ollama 回應空白";
    },
    errOllamaJsonParse(snippet) {
      return `Ollama JSON 無法解析: ${snippet}`;
    },
    errOllamaForbidden(label, snippet) {
      return `Ollama 403：請結束 Ollama 後設定環境變數 OLLAMA_ORIGINS=chrome-extension://*（或 *）再啟動；擴充來源為 chrome-extension。${label} ${snippet}`;
    },
    errOllamaHttpLine(label, status, snippet) {
      return `${label} ${status}: ${snippet}`;
    },
    errOllamaServer(detail) {
      return `Ollama: ${detail}`;
    },
    errOllamaGenerateEmpty() {
      return "Ollama generate: empty response";
    },

    errOllamaUrlScheme() {
      return "Ollama URL 須為 http://… 或 https://…";
    },
    errOllamaModelMissing() {
      return "未設定 Ollama 模型名稱";
    },
    errOllamaChatAndGenerateFail(chatMsg, generateMsg) {
      const a = chatMsg ? String(chatMsg).slice(0, 140) : "";
      const b = String(generateMsg || "").slice(0, 140);
      return a ? `chat：${a} | generate：${b}` : b;
    },

    errWhisperServerNotConfigured() {
      return "未設定本機 whisper-server 網址（選項內「本機 Whisper」）。";
    },

    translateFailureNote(detail) {
      return `翻譯失敗：${detail}`.slice(0, 280);
    },

    errPopupNoActiveTab() {
      return "找不到使用中分頁。";
    },
    errPopupRestrictedPage() {
      return "無法擷取此類頁面，請在一般網頁分頁使用。";
    },
    errStartCaptureFallback() {
      return "開始擷取失敗";
    },
    errStopCaptureFallback() {
      return "停止擷取失敗";
    },
    errInitCaptureFallback() {
      return "初始化擷取失敗";
    },
    errRunAsrChunkFallback() {
      return "語音片段處理失敗";
    },

    errAudioWorkletLoad(detail) {
      return `AudioWorklet 載入失敗：${detail}`;
    },

    /**
     * @param {string} asrNorm
     * @param {string} trPref
     * @param {string} trTgt
     */
    overlayCapturingDetail(asrNorm, trPref, trTgt) {
      const lz =
        typeof globalThis.vltLangLabelZh === "function"
          ? globalThis.vltLangLabelZh
          : () => "";
      const asrLabel =
        asrNorm === "auto" ? "自動偵測" : lz(asrNorm);
      let trSrcLabel;
      if (trPref === "follow") {
        trSrcLabel = `與辨識相同（${asrLabel}）`;
      } else if (trPref === "auto") {
        trSrcLabel = "自動偵測（多語混合稿，提示詞）";
      } else {
        trSrcLabel = `${lz(trPref)}（提示詞）`;
      }
      const tgtLabel = lz(trTgt);
      return `擷取中：Whisper 辨識（${asrLabel}）；Ollama 翻譯（${trSrcLabel} → ${tgtLabel}）。請確認 whisper-server 與 Ollama 已啟動且網址正確。`;
    },
    overlayCapturingPlaceholder() {
      return "擷取分頁音訊中…";
    },
    overlayNoSourceSnippet() {
      return "（無來源稿對照）";
    },
    overlayDebugNoTracks() {
      return "（尚無軌道資訊）";
    },
    overlayPipelineWarningPrefix() {
      return "⚠ ";
    },

    statusPopupCapturing() {
      return "擷取中：本機 whisper-server + Ollama（依選項）；字幕每數秒更新（切段見選項）。";
    },
    statusPopupStopped() {
      return "已停止。";
    },

    /** Popup 語向區塊底線說明 */
    popupLangAxisHint() {
      return "與選項頁「語音翻譯語向」即時同步；變更後無須按儲存。";
    },

    /** 交換聽譯來源與譯為語言（按鈕 title / aria） */
    langAxisSwapTitle() {
      return "交換來源與譯為語言";
    },
    /** 來源為自動偵測時無法對調（譯為無「自動」選項） */
    langAxisSwapNeedConcreteSource() {
      return "來源為「自動偵測」時無法交換，請先指定聽譯語言。";
    },

    /** Popup 切段秒數滑桿（aria-label） */
    popupChunkSecRangeLabel() {
      return "切段時長（秒）";
    },
    /** 滑桿 title：提醒擷取中須重開 */
    popupChunkSecRangeTitle() {
      return "與選項頁同步。若正在擷取音訊，請停止後再開始以套用新切段。";
    },

    popupWhisperUnset() {
      return "（未設定，請至選項填寫）";
    },
    popupTranslatorOff() {
      return "翻譯器: 關閉（僅辨識稿）";
    },
    popupTranslatorOllama() {
      return "翻譯器: Ollama (Local)";
    },

    clipboardCopied() {
      return "已複製到剪貼簿，請貼到終端機執行。";
    },
    clipboardFailed() {
      return "複製失敗，請手動輸入或見 docs/LOCAL_SETUP.md（英文）或 docs/LOCAL_SETUP.zh-TW.md。";
    },
    optionsSaveOk() {
      return "已儲存。字幕外觀會即時套用；擷取相關請「停止」再「開始」。";
    },

    demoSubtitleLine() {
      return "[Demo] 這是示範字幕列，之後可接 STT / 翻譯結果。";
    },
  };

  global.VLTMessages = Object.freeze(M);
})(typeof self !== "undefined" ? self : globalThis);
