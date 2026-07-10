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
 * GET /downloads/luxor-pdf-reader-latest — streams the newest full Reader
 * installer from GitHub Releases through this server, so the user's browser
 * never leaves the site. The asset name changes with each version
 * (Luxor-PDF-Installer-<version>.exe), so the website links here and this
 * route resolves the current name from latest.yml.
 */
const READER_RELEASES_LATEST =
  "https://github.com/mans4781/Luxor-PDF-Project/releases/latest/download";

let readerInstallerCache: { name: string; fetchedAt: number } | null = null;
const READER_CACHE_TTL_MS = 5 * 60 * 1000;

router.get(
  "/downloads/luxor-pdf-reader-latest",
  async (req: Request, res: Response): Promise<void> => {
    // Abort upstream work if the client disconnects mid-download, and cap
    // how long we'll wait on GitHub.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15 * 60 * 1000);
    let clientGone = false;
    res.on("close", () => {
      clientGone = true;
      controller.abort();
    });

    try {
      let name = readerInstallerCache;
      if (!name || Date.now() - name.fetchedAt > READER_CACHE_TTL_MS) {
        const ymlRes = await fetch(`${READER_RELEASES_LATEST}/latest.yml`, {
          redirect: "follow",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
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
        name = { name: m[1].trim(), fetchedAt: Date.now() };
        readerInstallerCache = name;
      }
      const assetRes = await fetch(
        `${READER_RELEASES_LATEST}/${encodeURIComponent(name.name)}`,
        { redirect: "follow", signal: controller.signal },
      );
      if (!assetRes.ok || !assetRes.body) {
        readerInstallerCache = null;
        res.status(502).json({ error: "Installer fetch failed" });
        return;
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${name.name.replace(/["\\]/g, "")}"`,
      );
      res.setHeader("Content-Type", "application/octet-stream");
      const len = assetRes.headers.get("content-length");
      if (len) res.setHeader("Content-Length", len);
      res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");

      const reader = assetRes.body.getReader();
      try {
        for (;;) {
          if (clientGone || res.writableEnded || res.destroyed) break;
          const { value, done } = await reader.read();
          if (done) break;
          if (!res.write(Buffer.from(value))) {
            // Wait for drain, but bail out if the socket closes first.
            const canContinue = await new Promise<boolean>((resolve) => {
              const onDrain = (): void => {
                res.off("close", onClose);
                resolve(true);
              };
              const onClose = (): void => {
                res.off("drain", onDrain);
                resolve(false);
              };
              res.once("drain", onDrain);
              res.once("close", onClose);
            });
            if (!canContinue) break;
          }
        }
      } finally {
        void reader.cancel().catch(() => {});
      }
      if (!res.writableEnded) res.end();
    } catch (err) {
      if (clientGone) {
        req.log.info("Reader installer download aborted by client");
        return;
      }
      req.log.error({ err }, "Reader installer download failed");
      if (!res.headersSent) {
        res.status(502).json({ error: "Release lookup failed" });
      } else if (!res.writableEnded) {
        res.end();
      }
    } finally {
      clearTimeout(timeout);
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
