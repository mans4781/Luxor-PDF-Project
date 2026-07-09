"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function log(msg) {
  process.stdout.write(`[sign-windows] ${msg}\n`);
}

const SECRET_FLAGS = new Set(["/p", "-p", "-kvs", "/kvs"]);

function redactArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    out.push(a);
    if (SECRET_FLAGS.has(a) && i + 1 < args.length) {
      out.push("***");
      i += 1;
    }
  }
  return out;
}

function runSignTool(args) {
  const signtool = process.env.SIGNTOOL_PATH || "signtool";
  log(`${signtool} ${redactArgs(args).join(" ")}`);
  execFileSync(signtool, args, { stdio: "inherit" });
}

function signWithAzureKeyVault(filePath) {
  const required = [
    "AZURE_KEY_VAULT_URL",
    "AZURE_KEY_VAULT_CERT",
    "AZURE_KEY_VAULT_CLIENT_ID",
    "AZURE_KEY_VAULT_CLIENT_SECRET",
    "AZURE_KEY_VAULT_TENANT_ID",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Azure Key Vault signing requested but missing env vars: ${missing.join(", ")}`,
    );
  }

  const azuresigntool =
    process.env.AZURESIGNTOOL_PATH || "AzureSignTool";
  const args = [
    "sign",
    "-kvu", process.env.AZURE_KEY_VAULT_URL,
    "-kvc", process.env.AZURE_KEY_VAULT_CERT,
    "-kvi", process.env.AZURE_KEY_VAULT_CLIENT_ID,
    "-kvs", process.env.AZURE_KEY_VAULT_CLIENT_SECRET,
    "-kvt", process.env.AZURE_KEY_VAULT_TENANT_ID,
    "-tr",
    process.env.AZURE_KEY_VAULT_TIMESTAMP_URL ||
      "http://timestamp.digicert.com",
    "-td", "sha256",
    "-fd", "sha256",
    filePath,
  ];
  log(`${azuresigntool} sign (Azure Key Vault) ${path.basename(filePath)}`);
  execFileSync(azuresigntool, args, { stdio: "inherit" });
}

function signWithCertFile(filePath) {
  const certFile = process.env.WIN_CSC_LINK;
  const certPass = process.env.WIN_CSC_KEY_PASSWORD;
  if (!certFile || !fs.existsSync(certFile)) {
    throw new Error(
      `WIN_CSC_LINK is not a valid file path: ${certFile || "(unset)"}`,
    );
  }
  const args = [
    "sign",
    "/fd", "sha256",
    "/td", "sha256",
    "/tr", process.env.WIN_TIMESTAMP_URL || "http://timestamp.digicert.com",
    "/f", certFile,
  ];
  if (certPass) args.push("/p", certPass);
  args.push(filePath);
  runSignTool(args);
}

function signWithCertSubject(filePath) {
  const subject = process.env.WIN_CSC_SUBJECT_NAME;
  const args = [
    "sign",
    "/fd", "sha256",
    "/td", "sha256",
    "/tr", process.env.WIN_TIMESTAMP_URL || "http://timestamp.digicert.com",
    "/n", subject,
    filePath,
  ];
  runSignTool(args);
}

function signWithCertSha1(filePath) {
  const sha1 = process.env.WIN_CSC_SHA1;
  const args = [
    "sign",
    "/fd", "sha256",
    "/td", "sha256",
    "/tr", process.env.WIN_TIMESTAMP_URL || "http://timestamp.digicert.com",
    "/sha1", sha1,
    filePath,
  ];
  runSignTool(args);
}

exports.default = async function sign(configuration) {
  const filePath = configuration.path;

  // Explicit opt-out (kept for parity with prior behavior).
  if (process.env.LUXOR_SKIP_SIGNING === "1") {
    log(`LUXOR_SKIP_SIGNING=1 — leaving ${path.basename(filePath)} unsigned`);
    return;
  }

  // Sign only when credentials are explicitly provided. Without any, we
  // emit an unsigned installer so `dist:win` works out-of-the-box (CI,
  // local builds, Replit container). Users opt in to signing by setting
  // one of the credential env var groups below.
  if (process.env.AZURE_KEY_VAULT_URL) {
    signWithAzureKeyVault(filePath);
    return;
  }
  if (process.env.WIN_CSC_LINK) {
    signWithCertFile(filePath);
    return;
  }
  if (process.env.WIN_CSC_SUBJECT_NAME) {
    signWithCertSubject(filePath);
    return;
  }
  if (process.env.WIN_CSC_SHA1) {
    signWithCertSha1(filePath);
    return;
  }

  log(
    `no signing credentials present — leaving ${path.basename(filePath)} ` +
      `unsigned. Set AZURE_KEY_VAULT_URL, WIN_CSC_LINK, WIN_CSC_SUBJECT_NAME, ` +
      `or WIN_CSC_SHA1 to enable code signing.`,
  );
};
