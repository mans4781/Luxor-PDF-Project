import { Resend } from "resend";
import { logger } from "./logger";
import { areSecureDownloadsLocked } from "../routes/downloads";

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

// Every outbound suite email sends from this single verified-domain address.
// We deliberately ignore the connector's configured from_email so the sender
// stays consistent as `noreply@luxorpdf.com` across all emails. Requires the
// luxorpdf.com domain to be verified in Resend (DKIM/SPF), which it is.
const FROM_ADDRESS = "Luxor PDF <noreply@luxorpdf.com>";

async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const { apiKey } = await getResendCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: FROM_ADDRESS,
  };
}

export interface LicenseEmailParams {
  to: string;
  customerName?: string | null;
  productKey: string;
  plan: string;
  /** ISO date string after which the license stops working. */
  subscriptionEndDate: string;
  /**
   * Public URL of the Windows installer .exe. Ignored while Secure desktop
   * downloads are locked (see areSecureDownloadsLocked): the email then shows
   * a temporary-unavailability notice instead of a download button.
   */
  downloadUrl: string;
  /**
   * Amount charged in the smallest currency unit (paise for INR, cents for
   * USD). When provided together with `currency`, an invoice section is
   * appended to the email. Omit for reissues / admin-generated emails where
   * no new charge occurred.
   */
  amountMinor?: number | null;
  /** ISO 4217 currency code, e.g. "INR" or "USD". */
  currency?: string | null;
  /**
   * Human-readable payment method label, e.g. "Razorpay · UPI" or "Stripe".
   * Falls back to a provider name derived from the currency if omitted.
   */
  paymentMethod?: string | null;
  /** Provider transaction / payment-intent ID shown on the invoice for support. */
  paymentTxnId?: string | null;
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
    amountMinor,
    currency,
    paymentMethod,
    paymentTxnId,
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
    const downloadsLocked = areSecureDownloadsLocked();

    // ── Invoice section ───────────────────────────────────────────────────────
    // Shown when a real charge amount is available (new purchases + renewals).
    // Omitted for admin-reissued keys where no new payment occurred.
    let invoiceSectionHtml = "";
    let invoiceTextLines: string[] = [];

    if (amountMinor != null && amountMinor > 0 && currency) {
      const cur = currency.toUpperCase();
      const isINR = cur === "INR";
      const total = amountMinor / 100;
      const fmtINR = (n: number) =>
        "₹" +
        n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtUSD = (n: number) => "$" + n.toFixed(2);
      const fmt = isINR ? fmtINR : fmtUSD;
      const fmtTotal = fmt(total);

      const invNow = new Date();
      const invYear = invNow.getFullYear();
      const txnSuffix = paymentTxnId
        ? paymentTxnId.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X")
        : String(Date.now()).slice(-6);
      const invoiceNo = `LXR-${invYear}-${txnSuffix}`;
      const invoiceDate = invNow.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const invValidRange = `${invoiceDate} — ${validUntil}`;
      const kParts = productKey.split("-");
      const maskedKey =
        kParts.length === 5
          ? [kParts[0], kParts[1], "····", "····", kParts[4]].join("-")
          : productKey.slice(0, 12) + "···";
      const methodLabel = paymentMethod ?? (isINR ? "Razorpay" : "Stripe");
      const txnLabel = paymentTxnId ?? "—";
      const billToName = customerName ?? to.split("@")[0];

      const gstRowHtml = isINR
        ? (() => {
            const subtotal = total / 1.18;
            const gst = total - subtotal;
            return `
              <tr>
                <td style="padding:3px 0;font-size:12px;color:#64748b">Subtotal</td>
                <td style="padding:3px 0;font-size:12px;color:#1e293b;text-align:right">${fmtINR(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:3px 0;font-size:12px;color:#64748b">GST (18%)</td>
                <td style="padding:3px 0;font-size:12px;color:#1e293b;text-align:right">${fmtINR(gst)}</td>
              </tr>`;
          })()
        : "";

      invoiceSectionHtml = `
    <tr><td style="padding:0 32px"><div style="border-top:1px solid #e2e8f0;margin:8px 0"></div></td></tr>
    <tr><td style="padding:0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#1e3a8a;padding:18px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:17px;font-weight:800;letter-spacing:-0.01em">
                    <span style="color:#ffffff">Luxor</span><span style="color:#fca5a5"> PDF</span><span style="color:#fcd34d"> Secure</span>
                  </div>
                  <div style="font-size:10px;color:#93c5fd;margin-top:3px">luxorpdf.com</div>
                </td>
                <td style="text-align:right;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:0.12em;color:#93c5fd;text-transform:uppercase;margin-bottom:4px">Invoice</div>
                  <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:6px">${invoiceNo}</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-left:auto">
                    <tr><td style="border:1.5px solid #ffffff;color:#ffffff;font-weight:700;font-size:9px;letter-spacing:0.15em;padding:2px 8px">PAID</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 32px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;vertical-align:top">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Bill To</div>
            <div style="font-size:13px;font-weight:600;color:#0f172a">${billToName}</div>
            <div style="font-size:12px;color:#3b82f6;margin-top:2px">${to}</div>
          </td>
          <td style="width:50%;vertical-align:top;text-align:right">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Invoice Details</div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-left:auto">
              <tr>
                <td style="font-size:11px;color:#64748b;padding:1px 6px 1px 0">Date</td>
                <td style="font-size:11px;color:#0f172a;font-weight:500;padding:1px 0">${invoiceDate}</td>
              </tr>
              <tr>
                <td style="font-size:11px;color:#64748b;padding:1px 6px 1px 0">Inv #</td>
                <td style="font-size:11px;color:#0f172a;font-weight:500;padding:1px 0">${invoiceNo}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:16px 32px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e2e8f0">
        <tr>
          <th style="text-align:left;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;padding:8px 0">Description</th>
          <th style="text-align:right;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;padding:8px 0">Amount</th>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;border-top:1px solid #f1f5f9">
            <div style="font-weight:600;color:#0f172a">Luxor PDF Secure — ${planLabel} License</div>
            <div style="margin-top:3px;font-size:11px;color:#64748b">Key: <span style="font-family:monospace">${maskedKey}</span></div>
            <div style="font-size:11px;color:#64748b">Valid: ${invValidRange}</div>
          </td>
          <td style="padding:10px 0;font-size:13px;font-weight:600;color:#0f172a;text-align:right;vertical-align:top;border-top:1px solid #f1f5f9">${fmtTotal}</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:12px 32px 20px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;vertical-align:top">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Payment</div>
            <div style="font-size:12px;color:#334155">${methodLabel}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:2px;font-family:monospace">${txnLabel}</div>
          </td>
          <td style="width:50%;vertical-align:top">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${gstRowHtml}
              <tr><td colspan="2" style="padding-top:6px"><div style="border-top:1px solid #e2e8f0"></div></td></tr>
              <tr>
                <td style="padding-top:8px;font-size:13px;font-weight:700;color:#0f172a">Total paid</td>
                <td style="padding-top:8px;font-size:13px;font-weight:700;color:#3730a3;text-align:right">${fmtTotal}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 8px">
      <div style="background:#f8fafc;border-radius:8px;padding:10px 14px">
        <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6">
          Computer-generated invoice. Manage your subscription at
          <a href="https://luxorpdf.com/account" style="color:#3730a3">luxorpdf.com/account</a>.
        </p>
      </div>
    </td></tr>`;

      invoiceTextLines = [
        "",
        "--- Invoice ---",
        `Invoice No: ${invoiceNo}`,
        `Date:       ${invoiceDate}`,
        ...(isINR
          ? [
              `Subtotal:   ${fmtINR(total / 1.18)}`,
              `GST (18%):  ${fmtINR(total - total / 1.18)}`,
            ]
          : []),
        `Total paid: ${fmtTotal}`,
        `Payment:    ${methodLabel}`,
        ...(paymentTxnId ? [`Txn ID:     ${paymentTxnId}`] : []),
      ];
    }

    const downloadSectionHtml = downloadsLocked
      ? `    <tr><td style="padding:28px 32px 8px">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px">
        <p style="margin:0 0 6px;font-weight:700;font-size:14px;color:#92400e">Downloads temporarily unavailable</p>
        <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6">
          Luxor PDF Secure for Windows is currently under revision, so the installer
          download is paused. Your license key above is safe and ready — we'll email
          you as soon as the download is available again.
        </p>
      </div>
    </td></tr>`
      : `    <tr><td style="padding:28px 32px 8px">
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
    </td></tr>`;

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
${downloadSectionHtml}
${invoiceSectionHtml}
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
      ...(downloadsLocked
        ? [
            "Downloads temporarily unavailable: Luxor PDF Secure for Windows is",
            "currently under revision, so the installer download is paused. Your",
            "license key is safe and ready — we'll email you as soon as the",
            "download is available again.",
          ]
        : [
            `Download for Windows: ${downloadUrl}`,
            "",
            "How to activate:",
            "  1. Run the installer.",
            "  2. Open Luxor PDF Secure.",
            "  3. Paste your license key and click Activate.",
          ]),
      "",
      "Questions? Reply to this email or visit https://luxorpdf.com/contact",
      ...invoiceTextLines,
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

export interface DownloadsRestoredEmailParams {
  to: string;
  customerName?: string | null;
  /** Public URL of the Windows installer .exe. */
  downloadUrl: string;
  /**
   * Stable per-recipient key forwarded to Resend as Idempotency-Key, so a
   * retry after a crash (email accepted but our ledger not yet updated)
   * cannot deliver the same email twice.
   */
  idempotencyKey?: string;
}

/**
 * Sends the "downloads are back" email promised to customers who bought a
 * license while Secure desktop downloads were locked. Best-effort: returns
 * false on failure so the caller can retry that recipient on a later run.
 */
export async function sendDownloadsRestoredEmail(
  params: DownloadsRestoredEmailParams,
): Promise<boolean> {
  const { to, customerName, downloadUrl, idempotencyKey } = params;

  try {
    const { client, fromEmail } = await getResendClient();

    const greeting = customerName ? `Hi ${customerName},` : "Hi there,";

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
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700">The download is back!</h1>
      <p style="margin:0 0 24px;color:#475569;line-height:1.55">
        ${greeting} Thanks for your patience — the Luxor PDF Secure installer
        for Windows is available again. Your license key from your purchase
        email is ready to use.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px 8px">
      <a href="${downloadUrl}" style="display:block;background:#312e81;color:#fff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px">
        Download Luxor PDF Secure for Windows
      </a>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <h2 style="font-size:15px;margin:0 0 10px">How to activate</h2>
      <ol style="margin:0;padding-left:20px;color:#475569;line-height:1.7;font-size:14px">
        <li>Run the installer you just downloaded.</li>
        <li>Open Luxor PDF Secure.</li>
        <li>Paste the license key from your purchase email, then click Activate.</li>
      </ol>
    </td></tr>
    <tr><td style="padding:0 32px 32px">
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
        Lost your license key? Reply to this email or visit <a href="https://luxorpdf.com/contact" style="color:#312e81">luxorpdf.com/contact</a>.<br>
        © ${new Date().getFullYear()} Luxor PDF Secure.
      </p>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      greeting,
      "",
      "Thanks for your patience — the Luxor PDF Secure installer for Windows",
      "is available again. Your license key from your purchase email is ready",
      "to use.",
      "",
      `Download for Windows: ${downloadUrl}`,
      "",
      "How to activate:",
      "  1. Run the installer.",
      "  2. Open Luxor PDF Secure.",
      "  3. Paste the license key from your purchase email and click Activate.",
      "",
      "Lost your license key? Reply to this email or visit https://luxorpdf.com/contact",
    ].join("\n");

    const { data, error } = await client.emails.send(
      {
        from: fromEmail,
        to: [to],
        subject: "Luxor PDF Secure downloads are back — get your installer",
        html,
        text,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    if (error) {
      logger.error({ err: error, to }, "Resend rejected downloads-restored email");
      return false;
    }

    logger.info({ to, emailId: data?.id }, "Downloads-restored email sent");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send downloads-restored email");
    return false;
  }
}

export interface WelcomeEmailParams {
  to: string;
  firstName?: string | null;
}

/**
 * Sends the one-time welcome email after a new account finishes sign-up.
 * Best-effort: returns false on failure so an email problem never blocks
 * the sign-up flow.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  const { to, firstName } = params;

  try {
    const { client, fromEmail } = await getResendClient();

    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

    const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <tr><td style="padding:32px 32px 16px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.01em">
        <span style="color:#1e3a8a">Luxor</span>
        <span style="color:#dc2626">PDF</span>
      </div>
    </td></tr>
    <tr><td style="padding:8px 32px 0">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700">Welcome to Luxor PDF!</h1>
      <p style="margin:0 0 20px;color:#475569;line-height:1.55">
        ${greeting} Your account is verified and ready. You now have one login
        that works across the whole Luxor PDF suite.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px">
      <h2 style="font-size:15px;margin:0 0 10px">What you can do right away</h2>
      <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.8;font-size:14px">
        <li>Read, annotate, and organize PDFs in the Luxor PDF Reader</li>
        <li>Convert PDFs to and from images, Word, and Excel</li>
        <li>Protect documents with passwords and expiry dates</li>
        <li>eSign documents and request signatures</li>
      </ul>
    </td></tr>
    <tr><td style="padding:24px 32px 8px">
      <a href="https://luxorpdf.com" style="display:block;background:#312e81;color:#fff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px">
        Open Luxor PDF
      </a>
    </td></tr>
    <tr><td style="padding:24px 32px 32px">
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
        Need help? Reply to this email or visit <a href="https://luxorpdf.com/contact" style="color:#312e81">luxorpdf.com/contact</a>.<br>
        © ${new Date().getFullYear()} Luxor PDF.
      </p>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      greeting,
      "",
      "Welcome to Luxor PDF! Your account is verified and ready.",
      "",
      "What you can do right away:",
      "  - Read, annotate, and organize PDFs in the Luxor PDF Reader",
      "  - Convert PDFs to and from images, Word, and Excel",
      "  - Protect documents with passwords and expiry dates",
      "  - eSign documents and request signatures",
      "",
      "Get started: https://luxorpdf.com",
      "",
      "Questions? Reply to this email or visit https://luxorpdf.com/contact",
    ].join("\n");

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: "Welcome to Luxor PDF — your account is ready",
      html,
      text,
    });

    if (error) {
      logger.error({ err: error, to }, "Resend rejected welcome email");
      return false;
    }

    logger.info({ to, emailId: data?.id }, "Welcome email sent");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send welcome email");
    return false;
  }
}

export interface InviteEmailParams {
  to: string;
  orgName: string;
  inviterName?: string | null;
  /** Absolute URL the invitee opens to accept (carries the raw token). */
  acceptUrl: string;
  /** ISO date string after which the invite link stops working. */
  expiresAt: string;
}

/**
 * Sends a team invitation email containing the accept link. Best-effort:
 * returns false on failure so an email problem never blocks invite creation.
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<boolean> {
  const { to, orgName, inviterName, acceptUrl, expiresAt } = params;

  try {
    const { client, fromEmail } = await getResendClient();

    const inviter = inviterName ? `${inviterName} has` : "You've been";
    const expires = new Date(expiresAt).toLocaleDateString("en-US", {
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
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700">You're invited to join ${orgName}</h1>
      <p style="margin:0 0 24px;color:#475569;line-height:1.55">
        ${inviter} invited to join <strong>${orgName}</strong> on Luxor PDF Secure. Accept your invite to unlock the full PDF toolkit on up to 2 devices.
      </p>
    </td></tr>
    <tr><td style="padding:0 32px">
      <a href="${acceptUrl}" style="display:block;background:#312e81;color:#fff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px">
        Accept invitation
      </a>
      <p style="margin:14px 0 0;color:#64748b;font-size:13px;text-align:center">
        This invite expires on <strong>${expires}</strong>
      </p>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <h2 style="font-size:15px;margin:0 0 10px">How it works</h2>
      <ol style="margin:0;padding-left:20px;color:#475569;line-height:1.7;font-size:14px">
        <li>Click "Accept invitation" above.</li>
        <li>Sign in or create your free account (use this email address).</li>
        <li>Your seat unlocks automatically — no license key needed.</li>
      </ol>
    </td></tr>
    <tr><td style="padding:0 32px 32px">
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
        If you weren't expecting this, you can safely ignore this email.<br>
        © ${new Date().getFullYear()} Luxor PDF Secure.
      </p>
    </td></tr>
  </table>
</body></html>`;

    const text = [
      `You're invited to join ${orgName} on Luxor PDF Secure.`,
      "",
      `Accept your invitation: ${acceptUrl}`,
      `This invite expires on ${expires}.`,
      "",
      "How it works:",
      "  1. Open the link above.",
      "  2. Sign in or create your free account using this email address.",
      "  3. Your seat unlocks automatically — no license key needed.",
      "",
      "If you weren't expecting this, you can safely ignore this email.",
    ].join("\n");

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `You're invited to join ${orgName} on Luxor PDF Secure`,
      html,
      text,
    });

    if (error) {
      logger.error({ err: error, to }, "Resend rejected invite email");
      return false;
    }

    logger.info({ to, orgName, emailId: data?.id }, "Invite email sent");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send invite email");
    return false;
  }
}
