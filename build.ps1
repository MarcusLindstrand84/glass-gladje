<#
.SYNOPSIS
  Bygger Glassgladje utan att du behöver hoppa mellan mappar.

.EXAMPLE
  .\build.ps1              # backend (dotnet build)
  .\build.ps1 -Test        # build + unit tests
  .\build.ps1 -Frontend    # backend + frontend production build
  .\build.ps1 -All         # backend, tests, frontend
#>
[CmdletBinding()]
param(
    [switch]$Test,
    [switch]$Frontend,
    [switch]$All
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Solution = Join-Path $Backend "Glassgladje.slnx"
$FrontendDir = Join-Path $Root "frontend"

if ($All) {
    $Test = $true
    $Frontend = $true
}

if (-not (Test-Path $Solution)) {
    Write-Error "Hittar inte $Solution. Kör skriptet från glass-gladje-mappen."
}

Write-Host ""
Write-Host "  Glassgladje build" -ForegroundColor Magenta
Write-Host "  -----------------" -ForegroundColor DarkGray

Write-Host "`n[1/$(if ($Frontend) { if ($Test) { 3 } else { 2 } } elseif ($Test) { 2 } else { 1 })] Backend: dotnet build" -ForegroundColor Cyan
Push-Location $Backend
try {
    dotnet build $Solution --nologo
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if ($Test) {
        Write-Host "`n[2] Backend: dotnet test" -ForegroundColor Cyan
        dotnet test $Solution --nologo --no-build
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}
finally {
    Pop-Location
}

if ($Frontend) {
    $step = if ($Test) { 3 } else { 2 }
    Write-Host "`n[$step] Frontend: npm run build" -ForegroundColor Cyan
    Push-Location $FrontendDir
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "  npm install (saknas node_modules)..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        }
        npm run build
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    finally {
        Pop-Location
    }
}

Write-Host "`n  Klar." -ForegroundColor Green
Write-Host ""
