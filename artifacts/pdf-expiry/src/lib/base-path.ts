const raw = import.meta.env.BASE_URL;

export const basePath =
  typeof raw === "string" && raw.startsWith("/")
    ? raw.replace(/\/$/, "")
    : "";
