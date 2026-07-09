; Luxor PDF Reader — web-installer stub.
; A tiny setup exe (~1 MB) that downloads the latest full NSIS installer
; from GitHub Releases and runs it. Nothing is left on disk by the stub
; itself ($PLUGINSDIR is cleaned up automatically by NSIS).

Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user

!define PRODUCT_NAME "Luxor PDF Reader"
!ifndef PRODUCT_VERSION
  !define PRODUCT_VERSION "0.0.0"
!endif

Name "${PRODUCT_NAME}"
OutFile "..\dist\Luxor PDF Reader Web Setup.exe"
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
!define MUI_WELCOMEPAGE_TEXT "This small setup will download the latest version of ${PRODUCT_NAME} (about 90 MB) and start the installation.$\r$\n$\r$\nAn internet connection is required.$\r$\n$\r$\nClick Install to continue."
!define MUI_PAGE_HEADER_TEXT "Downloading ${PRODUCT_NAME}"
!define MUI_PAGE_HEADER_SUBTEXT "Fetching the latest version from the official release server"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Download and install"
  SetDetailsPrint both
  InitPluginsDir
  SetOutPath "$PLUGINSDIR"
  File "download-full.ps1"

  DetailPrint "Contacting the release server..."
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\download-full.ps1" -OutFile "$PLUGINSDIR\LuxorPDFReaderSetup.exe"'
  Pop $0
  StrCmp $0 "0" download_ok
    MessageBox MB_ICONSTOP "The download failed.$\r$\n$\r$\nPlease check your internet connection and try again, or download the full installer from luxorpdf.com."
    SetDetailsPrint both
    DetailPrint "Download failed (exit code $0)."
    Abort
  download_ok:

  DetailPrint "Starting the ${PRODUCT_NAME} installer..."
  ; Hide the stub while the real installer's UI takes over.
  HideWindow
  ExecWait '"$PLUGINSDIR\LuxorPDFReaderSetup.exe"' $1
  DetailPrint "Installer finished (exit code $1)."
  ; Quit immediately — no finish page needed after the real installer ran.
  Quit
SectionEnd
