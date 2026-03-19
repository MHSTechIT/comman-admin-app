# Render environment setup script
# Adds DB_CONNECTION and SUPABASE_KEY to chatbot-api service
# Prerequisites: Set RENDER_API_KEY (from dashboard.render.com -> Account Settings -> API Keys)
# Run: .\scripts\render-env-setup.ps1

$ErrorActionPreference = "Stop"
$apiKey = $env:RENDER_API_KEY
if (-not $apiKey) {
    Write-Host "Set RENDER_API_KEY first (Render Dashboard -> Account Settings -> API Keys)" -ForegroundColor Red
    exit 1
}

$envPath = Join-Path $PSScriptRoot "..\chatbot-backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "chatbot-backend\.env not found" -ForegroundColor Red
    exit 1
}

$lines = Get-Content $envPath
$dbConn = ($lines | Where-Object { $_ -match "^DB_CONNECTION=(.+)$" } | ForEach-Object { $matches[1].Trim() }) | Select-Object -First 1
$supabaseKey = ($lines | Where-Object { $_ -match "^SUPABASE_KEY=(.+)$" } | ForEach-Object { $matches[1].Trim() }) | Select-Object -First 1
if (-not $dbConn -or -not $supabaseKey) {
    Write-Host "DB_CONNECTION or SUPABASE_KEY missing in chatbot-backend\.env" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type"  = "application/json"
}

# Get service ID for chatbot-api
$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Get
$svc = $services | Where-Object { $_.service.name -eq "chatbot-api" } | Select-Object -First 1
if (-not $svc) {
    Write-Host "chatbot-api service not found. Create it first via Blueprint (connect repo at render.com)" -ForegroundColor Red
    exit 1
}
$svcId = $svc.service.id
Write-Host "Found chatbot-api (id: $svcId)" -ForegroundColor Green

# Add env vars
$body = @{ value = $dbConn } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.render.com/v1/services/$svcId/env-vars/DB_CONNECTION" -Headers $headers -Method Put -Body $body
Write-Host "Set DB_CONNECTION" -ForegroundColor Green

$body = @{ value = $supabaseKey } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.render.com/v1/services/$svcId/env-vars/SUPABASE_KEY" -Headers $headers -Method Put -Body $body
Write-Host "Set SUPABASE_KEY" -ForegroundColor Green

Write-Host "Done. Render will redeploy automatically." -ForegroundColor Green
Write-Host "Add VITE_CHATBOT_API_URL to Vercel with your Render service URL (e.g. https://chatbot-api-xxxx.onrender.com)" -ForegroundColor Yellow
