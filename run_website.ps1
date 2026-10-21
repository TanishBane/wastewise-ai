$ErrorActionPreference = "Stop"

Write-Host "Building the WasteWise website..."
Push-Location (Join-Path $PSScriptRoot "frontend")
try {
    npm run build
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "WasteWise is available at: http://127.0.0.1:8000"
Write-Host "Frontend and API are connected at this single URL."
Write-Host "Leave this window open while using the website. Press Ctrl+C to stop."
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
