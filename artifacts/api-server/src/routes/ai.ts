import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { SummarizePdfBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

/** Character budget for the document text sent to the model. Roughly
 *  ~45k tokens — enough for most documents while keeping latency and
 *  cost bounded. Longer documents are truncated and flagged. */
const MAX_INPUT_CHARS = 180_000;

/** Abuse/cost controls: per-user sliding-window rate limits plus a
 *  single-in-flight guard. In-memory is sufficient — the API runs as a
 *  single instance and these are cost guards, not billing records. */
const BURST_LIMIT = 6; // summaries per 10 minutes
const BURST_WINDOW_MS = 10 * 60 * 1000;
const DAILY_LIMIT = 40; // summaries per 24 hours
const DAY_MS = 24 * 60 * 60 * 1000;
const AI_TIMEOUT_MS = 90_000;

const usageTimes = new Map<string, number[]>();
const inFlight = new Set<string>();

function checkRateLimit(userId: string): string | null {
  const now = Date.now();
  const times = (usageTimes.get(userId) ?? []).filter(t => now - t < DAY_MS);
  usageTimes.set(userId, times);
  if (times.length >= DAILY_LIMIT) {
    return "You've reached today's AI summary limit. Please try again tomorrow.";
  }
  if (times.filter(t => now - t < BURST_WINDOW_MS).length >= BURST_LIMIT) {
    return "You're generating summaries too quickly. Please wait a few minutes and try again.";
  }
  return null;
}

// Periodically drop stale users so the map can't grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [userId, times] of usageTimes) {
    const fresh = times.filter(t => now - t < DAY_MS);
    if (fresh.length === 0) usageTimes.delete(userId);
    else usageTimes.set(userId, fresh);
  }
}, 60 * 60 * 1000).unref();

router.post("/ai/summarize", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = SummarizePdfBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { text, fileName, totalPages } = parsed.data;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    res.status(400).json({ error: "The document contains no extractable text" });
    return;
  }

  const truncated = cleaned.length > MAX_INPUT_CHARS;
  const input = truncated ? cleaned.slice(0, MAX_INPUT_CHARS) : cleaned;

  if (inFlight.has(auth.userId)) {
    res.status(429).json({ error: "A summary is already being generated. Please wait for it to finish." });
    return;
  }
  const limitMsg = checkRateLimit(auth.userId);
  if (limitMsg) {
    res.status(429).json({ error: limitMsg });
    return;
  }

  inFlight.add(auth.userId);
  usageTimes.get(auth.userId)!.push(Date.now());
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content:
            "You are the document summarizer inside Luxor PDF Reader. " +
            "Write a clear, well-structured Markdown summary of the document text the user provides. " +
            "Start with a one-paragraph overview, then a short bulleted list of the key points. " +
            "If the document has clear sections, reflect them. Keep it concise and factual — " +
            "do not invent details that are not in the text. Answer in the document's language.",
        },
        {
          role: "user",
          content:
            `Document: ${fileName ?? "Untitled PDF"}` +
            (totalPages ? ` (${totalPages} pages)` : "") +
            (truncated ? " — note: text was truncated, summarize what is provided." : "") +
            `\n\n---\n${input}`,
        },
      ],
    }, { timeout: AI_TIMEOUT_MS });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      req.log.error({ userId: auth.userId }, "ai/summarize returned empty content");
      res.status(502).json({ error: "The AI service returned an empty summary" });
      return;
    }

    res.json({ summary, truncated });
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "ai/summarize failed");
    res.status(502).json({ error: "Failed to generate the summary" });
  } finally {
    inFlight.delete(auth.userId);
  }
});

export default router;
