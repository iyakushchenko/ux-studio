# Builds figma-make-sync.zip for one-shot Figma Make cloud update
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutZip = Join-Path $Root "figma-make-sync.zip"
$Staging = Join-Path $env:TEMP "figma-make-sync-$(Get-Random)"

$Files = @(
  "src/app/App.tsx",
  "src/app/ProtoHubPage.tsx",
  "src/app/ProtoHubViewport.tsx",
  "src/app/ProtoHubTabLink.tsx",
  "src/app/ProtoHubImageLightbox.tsx",
  "src/app/ProtoHubExperienceDiagram.tsx",
  "src/app/ProtoHubChatDiagram.tsx",
  "src/app/ProtoNavChrome.tsx",
  "src/app/ProtoNavLogo.tsx",
  "src/app/protoScreens.ts",
  "src/app/protoHubContent.ts",
  "src/styles/globals.css",
  "src/assets/ux-dpt-logo.svg",
  "src/assets/hub/persona-and-journey-map.jpg",
  "src/assets/hub/xe-card-persona-path.jpg",
  "src/assets/hub/vaccine-appointment-ui-overview.jpg"
)

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $Staging | Out-Null

$missing = @()
foreach ($rel in $Files) {
  $src = Join-Path $Root $rel
  if (-not (Test-Path $src)) {
    $missing += $rel
    continue
  }
  $dest = Join-Path $Staging $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }
  Copy-Item $src $dest -Force
}

if ($missing.Count -gt 0) {
  Write-Error "Missing files:`n$($missing -join "`n")"
}

if (Test-Path $OutZip) { Remove-Item $OutZip -Force }
Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $OutZip -Force
Remove-Item $Staging -Recurse -Force

Write-Host "Created: $OutZip"
Write-Host "Files: $($Files.Count)"
Write-Host "Next: open docs/FIGMA_MAKE_SYNC.md"
