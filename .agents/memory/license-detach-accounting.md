---
name: License detach accounting
description: Rules for freeing a product key from an account without corrupting activation counts.
---

Rule: when detaching/releasing a license, never reset a product key's `currentActivations` to zero. Multi-activation keys can be legitimately shared across accounts, so zeroing over-allocates a key still in use.

**Why:** completion review rejected a detach implementation that zeroed the count; another account's active license would have let extra activations through.

**How to apply:** lock the key row (`FOR UPDATE`), recount licenses still `status='active'` on that key, and set `currentActivations` to that count. Also: only operate on active license rows and mark them `deactivated` (with `deactivatedAt`) instead of deleting — historical rows are audit evidence. The activation flow's guarded increment (`currentActivations < maxActivations`) serializes correctly against this via the row lock.
