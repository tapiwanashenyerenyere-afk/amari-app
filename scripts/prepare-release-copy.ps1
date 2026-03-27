$ErrorActionPreference = 'Stop'

$source = Split-Path -Parent $PSScriptRoot
$destination = 'C:\amari-mobile-release'

if (-not (Test-Path $source)) {
  throw "Source path not found: $source"
}

if (Test-Path $destination) {
  Remove-Item -Recurse -Force $destination
}

New-Item -ItemType Directory -Path $destination | Out-Null

$null = robocopy $source $destination /MIR /XD node_modules .git .expo .eas-inspect dist web-build .next

if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

attrib -R "$destination\*" /S /D

Write-Host 'Release copy is ready.' -ForegroundColor Green
Write-Host "Source:      $source"
Write-Host "Destination: $destination"
Write-Host 'Next: run npm ci, npm run verify:release, and npm run release:android from the clean path.'
