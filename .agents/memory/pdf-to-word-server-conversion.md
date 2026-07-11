---
name: PDF→Word server-side conversion
description: Why the PDF→Word online tool uniquely runs on the server, how the Python engine is invoked, and the concurrency-cap rule for CPU-bound public upload endpoints.
---

# PDF→Word server-side conversion

PDF→Word is the **one** online-tool that is NOT browser-only. Every other convert
tool runs client-side; this one uploads the file to our API because high-fidelity,
editable output (layout, images, bullets, numbering) is not achievable in-browser.

**Why:** the user explicitly accepted a server round-trip for this single tool to get
near-perfect + editable results. The old client heuristic (pdfjs text + `docx`) broke
on complex layouts and dropped images.

**Engine & invocation:** open-source `pdf2docx` (Python), not a paid API. `python-3.11`
is a repl module; deps live in `pyproject.toml`/`uv.lock` so production installs them.
We spawn the interpreter with the conversion code passed inline via `python3 -c`
(argv array — no shell, no injection) rather than shipping a `.py` file, so nothing
needs to survive the esbuild CJS bundle. Interpreter resolution prefers
`PYTHON_BIN` → repo `.pythonlibs/bin/python3` → bare `python3`.

**Concurrency-cap rule (learned in review):** for a CPU-bound public endpoint, reserve
the slot **synchronously** in the request handler — do the `inFlight >= MAX` check and
`inFlight++` with no `await` between them. The single-threaded event loop then makes the
cap race-free. Incrementing later (e.g. inside the multer async callback) lets bursts of
requests all pass the check before any increments, blowing past the cap. Always pair with
a `released` guard so the slot is freed exactly once in `finally`.

**Other guards shipped in the same change (per cost-guards convention):** per-IP rate
limit (pruned map), 25MB size cap, magic-byte `%PDF-` sniff (MIME is spoofable), per-run
timeout+SIGKILL, temp-file cleanup in `finally`.
