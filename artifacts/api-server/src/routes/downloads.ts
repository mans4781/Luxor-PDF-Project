import { Router, type IRouter, type Request, type Response } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

/**
 * Public installer download endpoint.
 *
 * Drop the latest Windows installer into the App Storage public search
 * path under `installers/luxor-pdf-secure-latest.exe` (via the Object
 * Storage tool pane in Replit). This route streams it back with a
 * disposition that triggers a download, so the marketing site can simply
 * link to `/api/downloads/luxor-pdf-secure-latest.exe`.
 */
const router: IRouter = Router();

const INSTALLER_PATH = "installers/luxor-pdf-secure-latest.exe";
const INSTALLER_FILENAME = "Luxor-PDF-Secure-Setup.exe";

router.get(
  "/downloads/luxor-pdf-secure-latest.exe",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const svc = new ObjectStorageService();
      const file = await svc.searchPublicObject(INSTALLER_PATH);
      if (!file) {
        req.log.warn(
          { path: INSTALLER_PATH },
          "Installer not found in public object storage",
        );
        res.status(404).json({
          error: "Installer not yet available",
          hint: `Upload the .exe to App Storage at ${INSTALLER_PATH}`,
        });
        return;
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${INSTALLER_FILENAME}"`,
      );
      // Force a fresh check on each download so updates ship immediately.
      res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");

      const response = await svc.downloadObject(file, 300);
      // downloadObject returns a Response; pipe its body to express.
      if (!response.body) {
        res.status(500).json({ error: "Empty installer response" });
        return;
      }
      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Don't override our forced Content-Disposition.
        if (key.toLowerCase() === "content-disposition") return;
        res.setHeader(key, value);
      });
      // Stream the body to the client.
      const reader = response.body.getReader();
      const pump = async (): Promise<void> => {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      };
      await pump();
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Installer not yet available" });
        return;
      }
      req.log.error({ err }, "Installer download failed");
      res.status(500).json({ error: "Failed to serve installer" });
    }
  },
);

/**
 * GET /downloads/luxor-pdf-reader-latest — redirects to the newest full
 * Reader installer on GitHub Releases. The asset name changes with each
 * version (Luxor-PDF-Installer-<version>.exe), so the website links here and
 * this route resolves the current name from latest.yml, then 302s the
 * browser straight to the release asset.
 *
 * Do NOT stream the installer through this server: the deployed edge caps
 * response sizes (~32 MB), so proxying the ~100 MB installer returns a 500
 * in production even though the server logs a 200.
 */
const READER_RELEASES_LATEST =
  "https://github.com/mans4781/Luxor-PDF-Project/releases/latest/download";

let readerInstallerCache: { name: string; fetchedAt: number } | null = null;
const READER_CACHE_TTL_MS = 5 * 60 * 1000;

router.get(
  "/downloads/luxor-pdf-reader-latest",
  async (req: Request, res: Response): Promise<void> => {
    try {
      let cached = readerInstallerCache;
      if (!cached || Date.now() - cached.fetchedAt > READER_CACHE_TTL_MS) {
        const ymlRes = await fetch(`${READER_RELEASES_LATEST}/latest.yml`, {
          redirect: "follow",
          signal: AbortSignal.timeout(15_000),
        });
        if (!ymlRes.ok) {
          res.status(502).json({ error: "Release lookup failed" });
          return;
        }
        const yml = await ymlRes.text();
        const m = /^path:\s*(.+)$/m.exec(yml);
        if (!m || !m[1]) {
          res.status(502).json({ error: "Could not resolve installer name" });
          return;
        }
        cached = { name: m[1].trim(), fetchedAt: Date.now() };
        readerInstallerCache = cached;
      }
      res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
      res.redirect(
        302,
        `${READER_RELEASES_LATEST}/${encodeURIComponent(cached.name)}`,
      );
    } catch (err) {
      req.log.error({ err }, "Reader installer redirect failed");
      res.status(502).json({ error: "Release lookup failed" });
    }
  },
);

/** GET /downloads/installer-info — lightweight check for the download page. */
router.get(
  "/downloads/installer-info",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const svc = new ObjectStorageService();
      const file = await svc.searchPublicObject(INSTALLER_PATH);
      if (!file) {
        res.json({ available: false });
        return;
      }
      const [meta] = await file.getMetadata();
      res.json({
        available: true,
        sizeBytes: meta.size ? Number(meta.size) : undefined,
        updatedAt: meta.updated ?? null,
        downloadUrl: "/api/downloads/luxor-pdf-secure-latest.exe",
      });
    } catch {
      res.json({ available: false });
    }
  },
);

export default router;
