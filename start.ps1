<#
.SYNOPSIS
  Startar Glassglädje frontend + backend tillsammans.

.DESCRIPTION
  Öppnar två PowerShell-fönster (backend :5080, frontend :5173).
  Kör från projektroten:  .\start.ps1

.EXAMPLE
  .\start.ps1
  .\start.ps1 -NoNewWindows   # kör i bakgrunden i samma terminal
#>
[CmdletBinding()]
param(
    [switch]$NoNewWindows
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

Write-Host ""
Write-Host "  Glassgladje - startar full stack" -ForegroundColor Magenta
Write-Host "  --------------------------------" -ForegroundColor DarkGray
Write-Host "  API:      http://localhost:5080" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Admin:    admin@glassgladje.se / ChangeMe!Admin1" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path (Join-Path $Backend "Glassgladje.slnx")) -and -not (Test-Path (Join-Path $Backend "src\Glassgladje.Api"))) {
    Write-Error "Hittar inte backend. Kör skriptet från glass-gladje-mappen."
}

if (-not (Test-Path (Join-Path $Frontend "package.json"))) {
    Write-Error "Hittar inte frontend/package.json."
}

if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Write-Host "  node_modules saknas - kor npm install..." -ForegroundColor Yellow
    Push-Location $Frontend
    npm install
    Pop-Location
}

$backendCmd = "Set-Location '$Backend'; Write-Host '=== Glassgladje API ===' -ForegroundColor Green; dotnet run --project src\Glassgladje.Api --launch-profile http"
$frontendCmd = "Set-Location '$Frontend'; Write-Host '=== Glassgladje Web ===' -ForegroundColor Green; npm run dev"

if ($NoNewWindows) {
    Write-Host "  Startar i bakgrunden (samma session). Ctrl+C stoppar inte bakgrundsjobben - anvand Stop-Job / Get-Job." -ForegroundColor Yellow
    Start-Job -Name "Glassgladje-API" -ScriptBlock {
        param($cmd)
        Invoke-Expression $cmd
    } -ArgumentList $backendCmd | Out-Null
    Start-Sleep -Seconds 2
    Start-Job -Name "Glassgladje-Web" -ScriptBlock {
        param($cmd)
        Invoke-Expression $cmd
    } -ArgumentList $frontendCmd | Out-Null
    Write-Host "  Jobs: Glassgladje-API, Glassgladje-Web" -ForegroundColor Green
    Write-Host "  Visa loggar:  Receive-Job -Name Glassgladje-API -Keep" -ForegroundColor DarkGray
} else {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command", $backendCmd
    )
    Start-Sleep -Milliseconds 800
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command", $frontendCmd
    )
    Write-Host "  Tva terminalfonster oppnades." -ForegroundColor Green
    Write-Host "  Stang fonstren for att stoppa tjansterna." -ForegroundColor DarkGray
}

Write-Host ""
