$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$clientEnvPath = Join-Path $root "client/.env"
$serverEnvPath = Join-Path $root "server/.env"

function Read-KeyValueFile([string]$path) {
  $map = @{}
  if (!(Test-Path $path)) { return $map }

  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    $map[$key] = $value
  }
  return $map
}

function Validate-NonEmpty([hashtable]$map, [string[]]$keys) {
  $missing = @()
  foreach ($k in $keys) {
    if (-not $map.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($map[$k]) -or $map[$k] -like "your_*") {
      $missing += $k
    }
  }
  return $missing
}

$client = Read-KeyValueFile $clientEnvPath
$server = Read-KeyValueFile $serverEnvPath

$clientRequired = @(
  "VITE_CLOUDINARY_CLOUD_NAME",
  "VITE_CLOUDINARY_UPLOAD_PRESET",
  "VITE_CLOUDINARY_MODERATION_KIND"
)

$serverRequired = @(
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
)

$missingClient = Validate-NonEmpty $client $clientRequired
$missingServer = Validate-NonEmpty $server $serverRequired

Write-Host "=== Cloudinary Setup Verification ==="
Write-Host "client/.env: $clientEnvPath"
Write-Host "server/.env: $serverEnvPath"
Write-Host ""

if ($missingClient.Count -eq 0) {
  Write-Host "Client keys: OK" -ForegroundColor Green
} else {
  Write-Host "Client keys missing or placeholder:" -ForegroundColor Yellow
  $missingClient | ForEach-Object { Write-Host "  - $_" }
}

if ($missingServer.Count -eq 0) {
  Write-Host "Server keys: OK" -ForegroundColor Green
} else {
  Write-Host "Server keys missing or placeholder:" -ForegroundColor Yellow
  $missingServer | ForEach-Object { Write-Host "  - $_" }
}

if ($missingClient.Count -gt 0 -or $missingServer.Count -gt 0) {
  Write-Host ""
  Write-Host "Next: copy values from templates into client/.env and server/.env" -ForegroundColor Cyan
  exit 1
}

if ($client["VITE_CLOUDINARY_CLOUD_NAME"] -ne $server["CLOUDINARY_CLOUD_NAME"]) {
  Write-Host "Cloud name mismatch between client and server env" -ForegroundColor Red
  exit 1
}

Write-Host "Cloud name match: OK" -ForegroundColor Green
Write-Host ""
Write-Host "All required Cloudinary keys look configured." -ForegroundColor Green
exit 0
