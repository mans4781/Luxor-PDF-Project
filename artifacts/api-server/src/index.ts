import app from "./app";
import { logger } from "./lib/logger";
import { runPdfMigrations } from "./routes/pdfs";
import { runLicenseMigrations } from "./lib/license";
import { runBillingMigrations } from "./lib/billing";
import { runOrgMigrations } from "./lib/org";
import { runWelcomeMigrations } from "./routes/account";
import { runEsignMigrations } from "./routes/esign";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run idempotent schema migrations before accepting traffic.
// Ensures share_token is present and backfilled on every deployment, and
// that the license / usage / events tables exist for the auth-gated routes.
Promise.all([
  runPdfMigrations(),
  runLicenseMigrations(),
  runBillingMigrations(),
  runOrgMigrations(),
  runWelcomeMigrations(),
  runEsignMigrations(),
])
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Startup migration failed, refusing to start");
    process.exit(1);
  });
