---
name: AI endpoint cost guards
description: Rules for adding AI/LLM-backed endpoints to the suite API (auth, rate limits, truncation).
---

Any AI-backed endpoint must ship with server-side cost/abuse controls in the same change — auth alone is not enough.
**Why:** code review rejected the first AI summarize endpoint because any signed-in account could invoke unbounded paid model calls (cost-exhaustion DoS).
**How to apply:** per-user sliding-window rate limits (burst + daily) plus a single-in-flight guard and a model-call timeout; in-memory state is acceptable while the API runs as a single instance (move to shared storage if that changes). Cap input text server-side (~180k chars) and flag `truncated` in the response instead of erroring. Return 429 with a user-friendly message — the reader panel surfaces `body.error` directly.

AI provider: Replit AI Integrations OpenAI proxy (`@workspace/integrations-openai-ai-server`, env vars auto-provisioned). Only the server lib package was copied — the react/voice package and conversations/messages DB schemas were deliberately skipped because nothing persists chats yet; copy them if a chat feature lands.

Client sends extracted text (pdfjs `getTextContent`, same pipeline as search) rather than uploading the PDF — keeps document files out of the AI path and works offline-extracted. Scanned PDFs with no text layer get a friendly "no selectable text" error, not an AI call.
