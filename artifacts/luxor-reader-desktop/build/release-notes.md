## What's new in 0.1.17

- Fixed the Windows installer Finish button so it exits cleanly instead of
  launching the app while the installer is still shutting down.
- Luxor PDF can be opened from its desktop shortcut after installation.

## What's new in 0.1.16

- Fixed opening local PDF files while the computer is offline.
- Added the required offline PDF.js runtime support.

- The `.pdf` file icon in Windows Explorer now has a clearly visible blue border at every icon size — the previous light-blue outline was too pale to see at small sizes against a white background.

### Icon not updating?

After installing the update, Windows may keep showing the **old** `.pdf` icon because Explorer caches file-type icons. It usually refreshes on its own after a reboot. To force it:

- Sign out and back in, **or**
- Run `ie4uinit.exe -show` (Windows 10/11), **or**
- Delete `%LocalAppData%\IconCache.db` and `%LocalAppData%\Microsoft\Windows\Explorer\iconcache_*.db`, then restart Explorer.
