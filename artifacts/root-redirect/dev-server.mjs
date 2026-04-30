import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error("PORT environment variable is required.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const html = readFileSync(join(__dirname, "index.html"), "utf8");

const server = createServer((_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`root-redirect listening on http://0.0.0.0:${port}/`);
});
