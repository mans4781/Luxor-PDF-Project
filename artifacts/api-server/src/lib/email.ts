import { Resend } from "resend";
import { logger } from "./logger";

interface ResendCredentials {
  apiKey: string;
  fromEmail: string | undefined;
}

/**
 * Resend connector — credentials are fetched per-call from the Replit
 * connector sidecar. Never cache the client (access tokens rotate).
 *
 * Refs Replit blueprint: connection:conn_resend_01KP5DR55CC450HWVJW0MXG15G
 */
async function getResendCredentials(): Promise<ResendCredentials> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
      ? "depl " + process.env["WEB_REPL_RENEWAL"]
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Resend connector not available (missing REPLIT_CONNECTORS_HOSTNAME or REPL_IDENTITY)",
    );
  }

  const res = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    },
  );
  const data = (await res.json()) as { items?: Array<{ settings?: Record<string, string> }> };
  const settings = data.items?.[0]?.settings;
  if (!settings || !settings["api_key"]) {
    throw new Error("Resend connector not connected (no api_key in settings)");
  }
  return {
    apiKey: settings["api_key"],
    fromEmail: settings["from_email"],
  };
}

async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const { apiKey, fromEmail } = await getResendCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || "Luxor PDF Secure <licenses@luxorpdf.com>",
  };
}

export interface LicenseEmailParams {
  to: string;
  customerName?: string | null;
  productKey: string;
  plan: string;
  /** ISO date string after which the license stops working. */
  subscriptionEndDate: string;
  /** Public URL of the Windows installer .exe */
  downloadUrl: string;
}

/**
 * Sends the post-purchase email containing the license key and download link.
 * Returns true on success; logs and returns false on failure (caller should
 * never let an email failure block license activation).
 */
export async function sendLicenseEmail(params: LicenseEmailParams): Promise<boolean> {
  const {
    to,
    customerName,
    productKey,
    plan,
    subscriptionEndDate,
    downloadUrl,
  } = params;

  try {
    const { client, fromEmail } = await getResendClient();

    const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const validUntil = new Date(subscriptionEndDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <tr><td style="padding:32px 32px 16px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.01em">
        <span style="color:#1e3a8a">Luxor</span>
        <span style="color:#dc2626">PDF</span>
        <span style="color:#b45309">Secure</span>
      </div>
    </td></tr>
    <tr><td style="padding:8px 32px 0">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700">Thanks for your purchase!</h1>
      <p style="margin:0 0 24px;color:#475569;line-height:1.55">
        ${greeting} Your <strong>${planLabel}</strong> license is ready. Below is your license key — keep this email safe; you'll need the key to activate the desktop app.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px">
      <div style="background:#0f172a;color:#fff;padding:20px;border-radius:10px;text-align:center">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8">Your license key</p>
        <p style="margin:0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:18px;font-weight:700;letter-spacing:0.04em">${productKey}</p>
      </div>
      <p style="margin:14px 0 0;color:#64748b;font-size:13px;text-align:center">
        Valid until <strong>${validUntil}</strong>
      </p>
    </td></tr>
    <tr><td style="padding:28px 32px 8px">
      <a href="${downloadUrl}" style="display:block;background:#312e81;color:#fff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px">
        Download Luxor PDF Secure for Windows
      </a>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <h2 style="font-size:15px;margin:0 0 10px">How to activate</h2>
      <ol style="margin:0;padding-left:20px;color:#475569;line-height:1.7;font-size:14px">
        <li>Run the installer you just downloaded.</li>
        <li>Open Luxor PDF Secure.</li>
        <li>Paste your license key when prompted, then click Activate.</li>
      </ol>
    </td></tr>
    <tr><td style="padding:0 32px 32px">
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
        Need help? Reply to this email or visit <a href="https://luxorpdf.com/contact" style="color:#312e81">luxorpdf.com/contact</a>.<br>
        © ${new Date().getFullYear()} Luxor PDF Secure.
      </p>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      greeting,
      "",
      `Thanks for purchasing Luxor PDF Secure (${planLabel}).`,
      "",
      `Your license key: ${productKey}`,
      `Valid until: ${validUntil}`,
      "",
      `Download for Windows: ${downloadUrl}`,
      "",
      "How to activate:",
      "  1. Run the installer.",
      "  2. Open Luxor PDF Secure.",
      "  3. Paste your license key and click Activate.",
      "",
      "Questions? Reply to this email or visit https://luxorpdf.com/contact",
    ].join("\n");

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Your Luxor PDF Secure license key (${planLabel})`,
      html,
      text,
    });

    if (error) {
      logger.error({ err: error, to }, "Resend rejected license email");
      return false;
    }

    logger.info({ to, plan, emailId: data?.id }, "License email sent");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send license email");
    return false;
  }
}
