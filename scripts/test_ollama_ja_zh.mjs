/**
 * One-shot check: Ollama chat JA -> zh-TW using the same prompt shape as vlt_llm_config.js.
 * Usage: node scripts/test_ollama_ja_zh.mjs
 * Optional: set OLLAMA_MODEL (default translategemma:4b), OLLAMA_URL (default http://127.0.0.1:11434).
 */
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(
  /\/+$/,
  "",
);
const MODEL = process.env.OLLAMA_MODEL || "translategemma:4b";
const SAMPLE_JA = process.env.SAMPLE_JA || "今日は良い天気ですね。よろしくお願いします。";

const userContent =
  "You are a professional Japanese (ja) to Traditional Chinese (zh-TW) translator. " +
  "Your goal is to accurately convey the meaning and nuances of the original Japanese text " +
  "while adhering to Traditional Chinese grammar, vocabulary, and cultural sensitivities.\n" +
  "Produce only the Traditional Chinese translation, without any additional explanations or commentary. " +
  "Please translate the following Japanese text into Traditional Chinese (zh-TW):\n\n\n" +
  SAMPLE_JA;

const body = {
  model: MODEL,
  think: false,
  stream: false,
  messages: [{ role: "user", content: userContent }],
  options: { temperature: 0.2, num_predict: 768 },
};

console.log("POST", `${OLLAMA_URL}/api/chat`, "model=", MODEL);
console.log("Sample JA:", SAMPLE_JA);
console.log("---");

try {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error("HTTP", res.status, raw.slice(0, 500));
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Non-JSON response:", raw.slice(0, 400));
    process.exit(1);
  }
  const content =
    typeof parsed?.message?.content === "string"
      ? parsed.message.content
      : JSON.stringify(parsed?.message ?? parsed, null, 2);
  console.log("Assistant content:\n", content.trim());
  console.log("---");
  console.log("OK: Ollama returned a response. Verify output is Traditional Chinese.");
} catch (e) {
  console.error("Request failed:", e.message);
  console.error(
    "Is Ollama running? Try: ollama serve   (and OLLAMA_ORIGINS for extension if needed)",
  );
  process.exit(1);
}
