# Smoke test: Ollama EN -> Traditional Chinese (matches extension: /api/chat, think=false).
# Qwen3 fills "thinking" and leaves "response" empty on /api/generate without disabling think.
# Prerequisites: Ollama running, model pulled (e.g. ollama pull translategemma:4b).
# Prompt shape matches https://ollama.com/library/translategemma (TranslateGemma).
# Usage:
#   .\scripts\ollama_translate_smoke_test.ps1
#   .\scripts\ollama_translate_smoke_test.ps1 -Model "gemma3:12b" -Sentence "Hello."

param(
    [string] $BaseUrl = "http://127.0.0.1:11434",
    [string] $Model = "translategemma:4b",
    [string] $Sentence = "You are going to switch it up."
)

try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
} catch { }

$userText =
    "You are a professional English (en) to Traditional Chinese (zh-TW) translator. Your goal is to accurately convey the meaning and nuances of the original English text while adhering to Traditional Chinese grammar, vocabulary, and cultural sensitivities.`n" +
    "Produce only the Traditional Chinese translation, without any additional explanations or commentary. Please translate the following English text into Traditional Chinese (zh-TW):`n`n`n$Sentence"

$chatBody = @{
    model    = $Model
    think    = $false
    stream   = $false
    messages = @(
        @{
            role    = "user"
            content = $userText
        }
    )
    options  = @{
        temperature = 0.2
        num_predict = 768
    }
}

$json = $chatBody | ConvertTo-Json -Depth 10 -Compress

try {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/chat" -Method Post `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($json)) `
        -ContentType "application/json; charset=utf-8"
    $zh = ""
    if ($null -ne $r.message.content) {
        if ($r.message.content -is [string]) {
            $zh = $r.message.content
        } elseif ($r.message.content -is [System.Array]) {
            foreach ($p in $r.message.content) {
                if ($p.text) { $zh += $p.text }
            }
        }
    }
    $zh = $zh.Trim()
    Write-Host "OK. Model: $Model  (POST /api/chat, think=false)"
    Write-Host "English:  $Sentence"
    Write-Host "Chinese:  $zh"
    if (-not $zh) {
        Write-Host "WARN: empty message.content; if Qwen3, upgrade Ollama or try another model."
        exit 2
    }
} catch {
    Write-Host "FAILED: $_"
    Write-Host "Check: 1) Ollama running  2) ollama list  3) $BaseUrl"
    exit 1
}
