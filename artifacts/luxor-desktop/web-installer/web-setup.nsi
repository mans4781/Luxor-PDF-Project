; Luxor PDF Secure — web-installer stub.
; A tiny setup exe (~1 MB) that downloads the latest full NSIS installer
; from GitHub Releases and runs it. Nothing is left on disk by the stub
; itself ($PLUGINSDIR is cleaned up automatically by NSIS).

Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user

!define PRODUCT_NAME "Luxor PDF Secure"
!ifndef PRODUCT_VERSION
  !define PRODUCT_VERSION "0.0.0"
!endif

Name "${PRODUCT_NAME}"
OutFile "..\dist\Luxor PDF Secure Web Setup.exe"
BrandingText "Luxor PDF"

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME} Web Setup"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} online installer"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "LegalCopyright" "Copyright (c) 2026 Luxor PDF"
VIAddVersionKey "CompanyName" "Luxor PDF"

!include "MUI2.nsh"

!define MUI_ICON "..\build\icon.ico"
!define MUI_WELCOMEPAGE_TITLE "Install ${PRODUCT_NAME}"
!define MUI_WELCOMEPAGE_TEXT "This small setup will download the latest version of ${PRODUCT_NAME} (about 85 MB) and start the installation.$\r$\n$\r$\nAn internet connection is required.$\r$\n$\r$\nClick Install to continue."
!define MUI_PAGE_HEADER_TEXT "Downloading ${PRODUCT_NAME}"
!define MUI_PAGE_HEADER_SUBTEXT "Fetching the latest version from the official release server"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Download and install"
  ; Auto-close the progress page the moment this section finishes, so the
  ; stub never lingers on a "Downloading..." screen after the work is done.
  SetAutoClose true
  SetDetailsPrint both
  InitPluginsDir
  SetOutPath "$PLUGINSDIR"
  File "download-full.ps1"

  DetailPrint "Contacting the release server..."
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\download-full.ps1" -OutFile "$PLUGINSDIR\LuxorPDFSecureSetup.exe"'
  Pop $0
  StrCmp $0 "0" download_ok
    MessageBox MB_ICONSTOP "The download failed.$\r$\n$\r$\nPlease check your internet connection and try again, or download the full installer from luxorpdf.com."
    SetDetailsPrint both
    DetailPrint "Download failed (exit code $0)."
    Abort
  download_ok:

  DetailPrint "Download complete."
  DetailPrint "Starting the ${PRODUCT_NAME} installer..."
  ; Move the installer out of $PLUGINSDIR: NSIS deletes that folder as soon
  ; as the stub quits, and the full installer must keep running after we're
  ; gone. $TEMP survives; Windows cleans it up on its own schedule.
  Rename "$PLUGINSDIR\LuxorPDFSecureSetup.exe" "$TEMP\LuxorPDFSecureSetup.exe"
  IfFileExists "$TEMP\LuxorPDFSecureSetup.exe" launch_from_temp
    ; Rename failed (e.g. a stale copy is locked in $TEMP) — fall back to
    ; the old blocking behavior so the install still succeeds.
    HideWindow
    ExecWait '"$PLUGINSDIR\LuxorPDFSecureSetup.exe"' $1
    Quit
  launch_from_temp:
  ; Launch without waiting and close the stub immediately — the full
  ; installer's own wizard takes over from here.
  Exec '"$TEMP\LuxorPDFSecureSetup.exe"'
  Quit
SectionEnd
