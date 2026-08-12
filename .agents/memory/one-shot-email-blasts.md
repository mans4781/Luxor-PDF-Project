---
name: One-shot email blasts
description: Idempotency pattern required for any bulk/one-shot customer email flow (e.g. "downloads are back" notifications).
---

Rule: a bulk email flow must use a per-recipient claim ledger, not read-then-send.

**Why:** read ledger → send → insert double-emails under concurrent triggers or a crash between provider-accept and ledger write. Code review rejects "safe to re-run" claims built on read-then-send.

**How to apply:** one row per recipient with `status pending|sent` + a `claim_token` (fencing token rotated by the claiming UPSERT). Claim = single INSERT … ON CONFLICT DO UPDATE (reclaim only stale pending) RETURNING. Mark-sent and release-on-failure must predicate on `status='pending' AND claim_token=<mine>`. Also pass a stable per-recipient Resend `idempotencyKey` so a crash-after-accept re-send is deduped provider-side. Existing example: downloads_restored_emails + lib/downloadsRestored in the api-server, with vitest coverage for concurrent, stale-reclaim-overlap, and failure-retry paths.
