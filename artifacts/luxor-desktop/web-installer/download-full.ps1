# Downloads the latest full Luxor PDF Secure installer from GitHub Releases.
# Invoked by the NSIS web-installer stub. Reads latest.yml (published by
# electron-updater) to discover the current installer file name, then
# downloads it to -OutFile.
param(
  [Parameter(Mandatory = $true)][string]$OutFile
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$base = 'https://github.com/mans4781/Luxor-Secure-Project/releases/latest/download'

Write-Output 'Looking up the latest version...'
$yml = (Invoke-WebRequest -UseBasicParsing "$base/latest.yml").Content

$m = [regex]::Match($yml, '(?m)^path:\s*(.+)$')
if (-not $m.Success) {
  throw 'Could not determine the installer file name from latest.yml'
}
$name = $m.Groups[1].Value.Trim()
$url = "$base/" + [uri]::EscapeDataString($name)

# Top-level (non-indented) sha512 in latest.yml is the checksum of `path`.
$sha = [regex]::Match($yml, '(?m)^sha512:\s*(.+)$')

Write-Output "Downloading $name ..."
Invoke-WebRequest -UseBasicParsing $url -OutFile $OutFile

if ($sha.Success) {
  Write-Output 'Verifying file integrity...'
  $expected = $sha.Groups[1].Value.Trim()
  $hasher = [System.Security.Cryptography.SHA512]::Create()
  $stream = [System.IO.File]::OpenRead($OutFile)
  try {
    $actual = [Convert]::ToBase64String($hasher.ComputeHash($stream))
  } finally {
    $stream.Dispose()
    $hasher.Dispose()
  }
  if ($actual -ne $expected) {
    Remove-Item -Force $OutFile -ErrorAction SilentlyContinue
    throw 'Checksum verification failed - the downloaded file does not match the published release. Aborting.'
  }
  Write-Output 'Checksum OK.'
} else {
  Write-Output 'Warning: no sha512 found in latest.yml - skipping integrity check.'
}

$size = [math]::Round((Get-Item $OutFile).Length / 1MB, 1)
Write-Output "Downloaded $size MB."
