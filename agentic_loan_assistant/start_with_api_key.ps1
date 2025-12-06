# Start script with API key setup
# Usage: .\start_with_api_key.ps1

Write-Host "=== Agentic Loan Assistant Startup ===" -ForegroundColor Cyan
Write-Host ""

# Check if API key is set
$apiKey = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'User')
if (-not $apiKey) {
    Write-Host "⚠️  OPENAI_API_KEY not found in User environment variables" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please set your API key:" -ForegroundColor Yellow
    Write-Host '  [Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-key-here", "User")' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or set it for this session only:" -ForegroundColor Yellow
    Write-Host '  $env:OPENAI_API_KEY="your-key-here"' -ForegroundColor Cyan
    Write-Host ""
    $useSessionKey = Read-Host "Do you want to set it for this session? (y/n)"
    if ($useSessionKey -eq 'y') {
        $sessionKey = Read-Host "Enter your OpenAI API key"
        $env:OPENAI_API_KEY = $sessionKey
        Write-Host "API key set for this session" -ForegroundColor Green
    } else {
        Write-Host "Continuing without API key (will use fallback mode)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ API Key found in environment" -ForegroundColor Green
    $env:OPENAI_API_KEY = $apiKey
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "Starting Backend (Port 8000)..." -ForegroundColor Yellow
Start-Process python -ArgumentList "-m", "uvicorn", "agentic_loan_assistant.backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" -WindowStyle Hidden

# Start frontend
Write-Host "Starting Frontend (Port 8080)..." -ForegroundColor Yellow
Set-Location "agentic_loan_assistant\frontend"
Start-Process npm -ArgumentList "run", "dev" -WindowStyle Hidden
Set-Location "..\..\"

Start-Sleep -Seconds 8

Write-Host ""
Write-Host "=== Server Status ===" -ForegroundColor Cyan
Write-Host ""

# Check backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 3
    Write-Host "✓ Backend: Running on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend: Not responding" -ForegroundColor Red
}

# Check frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 3
    Write-Host "✓ Frontend: Running on http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend: Not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Access Your Application ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

