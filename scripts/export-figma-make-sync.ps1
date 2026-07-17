# Builds figma-make-sync.zip for one-shot Figma Make cloud update
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutZip = Join-Path $Root "figma-make-sync.zip"
$Staging = Join-Path $env:TEMP "figma-make-sync-$(Get-Random)"

$Files = @(
  # App shell (root only)
  "src/app/App.tsx",
  "src/app/AvailabilityTool.tsx",
  "src/app/BootsPharmacyLogo.tsx",

  # Hub / onboarding
  "src/app/hub/ProtoHubPage.tsx",
  "src/app/hub/ProtoHubViewport.tsx",
  "src/app/hub/ProtoHubTabLink.tsx",
  "src/app/hub/ProtoHubImageLightbox.tsx",
  "src/app/hub/ProtoHubExperienceDiagram.tsx",
  "src/app/hub/ProtoHubChatDiagram.tsx",
  "src/app/hub/protoHubContent.ts",

  # Nav
  "src/app/nav/ProtoNavChrome.tsx",
  "src/app/nav/ProtoNavLogo.tsx",
  "src/app/nav/ProtoNavPanel.tsx",
  "src/app/nav/protoNavPanel.css",
  "src/app/nav/protoNavZoom.ts",

  # Header, footer, shared chrome
  "src/app/chrome/protoHeaderMount.tsx",
  "src/app/chrome/protoFooterMount.tsx",
  "src/app/chrome/ProtoFooter.tsx",
  "src/app/chrome/protoFooterContent.ts",
  "src/app/chrome/protoFooterConfig.ts",
  "src/app/chrome/ProtoTertiaryCta.tsx",
  "src/app/chrome/ProtoIconHit.tsx",
  "src/app/chrome/ProtoSocialIcons.tsx",
  "src/app/chrome/ProtoCloseIcon.tsx",

  # Popups
  "src/app/popups/LoginPopup.tsx",
  "src/app/popups/QuickViewPopup.tsx",
  "src/app/popups/VaccinePickerPopup.tsx",
  "src/app/popups/RecipientPickerPopup.tsx",

  # Proto logic / wiring (sync entire folder — App.tsx imports all of these)
  "src/app/proto/availStores.ts",
  "src/app/proto/protoSavedLocations.ts",
  "src/app/proto/protoScreens.ts",
  "src/app/proto/useProtoScrollFill.ts",
  "src/app/proto/protoPlpListing.ts",
  "src/app/proto/protoInputControls.ts",
  "src/app/proto/protoLocationSearch.ts",
  "src/app/proto/protoIconHitWire.ts",
  "src/app/proto/protoPdpRtb.ts",
  "src/app/proto/protoOrderPricing.ts",
  "src/app/proto/protoAppointments.ts",
  "src/app/proto/protoMap.ts",
  "src/app/proto/protoVaccineList.ts",

  # Styles
  "src/styles/globals.css",
  "src/styles/globals-hub.css",
  "src/styles/globals-chrome.css",
  "src/styles/globals-screens.css",

  # Assets
  "src/assets/ux-dpt-logo.svg",
  "src/assets/proto-trash-icon.svg",
  "src/assets/user-avatar.jpg",
  "src/assets/boots-pharmacy-logo.svg",
  "src/assets/boots-advantage-card.png",
  "src/assets/locations-map-chosen.png",
  "src/assets/locations-map-london.png",
  "src/assets/hub/persona-and-journey-map.jpg",
  "src/assets/hub/xe-card-persona-path.jpg",
  "src/assets/hub/vaccine-appointment-ui-overview.jpg",
  "src/assets/avail/accent-check.svg",
  "src/assets/avail/accent-ellipse.svg",
  "src/assets/avail/accent-face.png",
  "src/assets/avail/accent-glyph-check.svg",
  "src/assets/avail/accent-glyph-search.svg",
  "src/assets/avail/accent-map.svg",
  "src/assets/avail/arrows-secondary.svg",
  "src/assets/avail/arrows.svg",
  "src/assets/avail/check-chosen.svg",
  "src/assets/avail/check.svg",
  "src/assets/avail/close.svg",
  "src/assets/avail/map-pin.svg",
  "src/assets/avail/no-slots-ellipse.svg",
  "src/assets/avail/no-slots-face.png",
  "src/assets/avail/no-slots-glyph.svg",
  "src/assets/avail/search.svg"
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
