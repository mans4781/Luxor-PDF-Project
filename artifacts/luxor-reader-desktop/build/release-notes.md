## What's new in 0.1.13

- New bordered `.pdf` file icon in Windows Explorer — a light-blue bordered sheet with a clipped top-right dog-ear, matching the in-app Recent Documents icon.

### Icon not updating?

After installing the update, Windows may keep showing the **old** `.pdf` icon because Explorer caches file-type icons. It usually refreshes on its own after a reboot. To force it:

- Sign out and back in, **or**
- Run `ie4uinit.exe -show` (Windows 10/11), **or**
- Delete `%LocalAppData%\IconCache.db` and `%LocalAppData%\Microsoft\Windows\Explorer\iconcache_*.db`, then restart Explorer.
