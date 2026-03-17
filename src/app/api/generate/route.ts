import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  buildScriptSystemPrompt,
  buildScriptUserPrompt,
  buildDesignSystemPrompt,
  buildDesignSystemPromptCompact,
  buildDesignUserPrompt,
  buildDesignUserPromptCompact,
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/prompts';

export const maxDuration = 180;
const FINAL_OUTPUT_SENTINEL = '#EndOfScript67!#';

function computeDesignMaxTokens(provider: string, durationMinutes: number): number {
  // Scale output budget with target duration; Sonnet gets the largest headroom.
  if (provider === 'anthropic-haiku') return 8192;

  const scaled = Math.round(14000 + (durationMinutes * 1800));
  if (provider === 'anthropic') return Math.max(22000, Math.min(52000, scaled));
  if (provider === 'openai') return Math.max(16000, Math.min(32000, scaled));
  return Math.max(16000, Math.min(36000, scaled));
}

/* ─── Cost per 1M tokens (USD) ─── */
const PRICING: Record<string, { input: number; output: number }> = {
  gemini: { input: 1.25, output: 10.0 },              // Gemini 3.1 Pro
  anthropic: { input: 3.0, output: 15.0 },             // Claude Sonnet 4
  'anthropic-haiku': { input: 0.25, output: 1.25 },     // Claude 3 Haiku
  openai: { input: 2.5, output: 10.0 },                // GPT-4o
};

function calcCost(provider: string, inputTokens: number, outputTokens: number) {
  const p = PRICING[provider] ?? { input: 0, output: 0 };
  const inputCost = (inputTokens / 1_000_000) * p.input;
  const outputCost = (outputTokens / 1_000_000) * p.output;
  return { inputCost, outputCost, total: inputCost + outputCost, inputTokens, outputTokens };
}

function resolveKey(provider: string, clientKey?: string): string | undefined {
  if (clientKey) return clientKey;
  switch (provider) {
    case 'gemini':
      return process.env.GOOGLE_API_KEY;
    case 'anthropic':
    case 'anthropic-haiku':
      return process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createModel(provider: string, apiKey: string): any {
  switch (provider) {
    case 'gemini':
      return createGoogleGenerativeAI({ apiKey })('gemini-3.1-pro-preview');
    case 'anthropic':
      return createAnthropic({ apiKey })('claude-sonnet-4-20250514');
    case 'anthropic-haiku':
      return createAnthropic({ apiKey })('claude-3-haiku-20240307');
    case 'openai':
      return createOpenAI({ apiKey })('gpt-4o');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createFastGeminiModel(apiKey: string): any {
  return createGoogleGenerativeAI({ apiKey })('gemini-2.0-flash');
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return text;
}

/**
 * Attempt to repair truncated JSON (e.g. when model hits output token limit).
 * Closes unclosed strings, arrays, and objects.
 */
function repairJson(raw: string): string {
  let json = extractJson(raw);

  // Try parsing as-is first
  try { JSON.parse(json); return json; } catch { /* needs repair */ }

  // Remove trailing comma before repair
  json = json.replace(/,\s*$/, '');

  // Close unclosed strings
  const quoteCount = (json.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) json += '"';

  // Track open brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let prevChar = '';
  for (const ch of json) {
    if (ch === '"' && prevChar !== '\\') inString = !inString;
    if (!inString) {
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets--;
    }
    prevChar = ch;
  }

  // Remove trailing comma again after quote fix
  json = json.replace(/,\s*$/, '');

  // Close open brackets and braces
  for (let i = 0; i < openBrackets; i++) json += ']';
  for (let i = 0; i < openBraces; i++) json += '}';

  // Validate
  try { JSON.parse(json); return json; } catch { /* still broken */ }

  // Last resort: try trimming back to last complete array item
  const lastGoodBrace = json.lastIndexOf('}');
  if (lastGoodBrace > 0) {
    let attempt = json.substring(0, lastGoodBrace + 1);
    // Re-close
    let ob = 0, oq = 0;
    let inStr = false;
    let prev = '';
    for (const c of attempt) {
      if (c === '"' && prev !== '\\') inStr = !inStr;
      if (!inStr) {
        if (c === '{') ob++;
        else if (c === '}') ob--;
        else if (c === '[') oq++;
        else if (c === ']') oq--;
      }
      prev = c;
    }
    attempt = attempt.replace(/,\s*$/, '');
    for (let i = 0; i < oq; i++) attempt += ']';
    for (let i = 0; i < ob; i++) attempt += '}';
    try { JSON.parse(attempt); return attempt; } catch { /* give up */ }
  }

  return json;
}

function isLikelyPhotoUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/\.(gif|svg|bmp|ico)(\?|$)/i.test(url)) return false;
  return true;
}

function normalizeSlideHeading(slide: Record<string, unknown>): string {
  const content = slide.content as Record<string, unknown> | undefined;
  const keys = ['heading', 'title', 'statement', 'question', 'fact'] as const;
  for (const key of keys) {
    const v = content?.[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  if (typeof slide.type === 'string') return slide.type;
  return 'slide';
}

async function fetchBingImageCandidates(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&qft=+filterui:photo-photo+filterui:imagesize-large`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const urls: string[] = [];
    for (const m of html.matchAll(/"murl"\s*:\s*"(https?:\/\/[^\"]+)"/g)) {
      urls.push(m[1]);
    }
    for (const m of html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&\"]+)/g)) {
      urls.push(m[1]);
    }

    const unique = Array.from(new Set(urls.filter((u) => isLikelyPhotoUrl(u))));
    return unique.slice(0, 6);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    topic,
    subject,
    depth,
    duration,
    language,
    additionalContext,
    scriptProvider,
    designProvider,
    scriptApiKey,
    designApiKey,
  } = body as {
    topic: string;
    subject?: string;
    depth: string;
    duration: number;
    language: string;
    additionalContext?: string;
    scriptProvider: string;
    designProvider: string;
    scriptApiKey?: string;
    designApiKey?: string;
  };

  if ((!topic && !additionalContext) || !depth || !duration || !language) {
    return Response.json(
      { error: 'Please provide a topic or upload a PDF.' },
      { status: 400 },
    );
  }

  const scriptKey = resolveKey(scriptProvider, scriptApiKey);
  const designKey = resolveKey(designProvider, designApiKey);

  if (!scriptKey) {
    return Response.json(
      { error: `No API key for script provider "${scriptProvider}".` },
      { status: 401 },
    );
  }
  if (!designKey) {
    return Response.json(
      { error: `No API key for design provider "${designProvider}".` },
      { status: 401 },
    );
  }

  const usePipeline = scriptProvider !== designProvider;

  // Use SSE to stream phase updates to the client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }
      function sendDebug(message: string, meta?: Record<string, unknown>, level: 'info' | 'warn' | 'error' = 'info') {
        sendEvent('debug', {
          message,
          meta,
          level,
          ts: new Date().toISOString(),
        });
      }

      async function collectText(params: Parameters<typeof streamText>[0]): Promise<string> {
        const streamed = streamText(params);
        let text = '';
        for await (const delta of streamed.textStream) {
          text += delta;
        }
        return text;
      }

      async function withTimeout<T>(label: string, timeoutMs: number, fn: () => Promise<T>): Promise<T> {
        return await Promise.race([
          fn(),
          new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)), timeoutMs);
          }),
        ]);
      }

      async function enrichPresentationImages(presentation: Record<string, unknown>) {
        const slidesRaw = presentation.slides;
        if (!Array.isArray(slidesRaw) || slidesRaw.length === 0) return;

        type SlideWithImage = {
          id: string;
          type: string;
          imageQuery?: string;
          imageUrl?: string;
          content?: Record<string, unknown>;
        };

        const slides = slidesRaw as SlideWithImage[];

        for (const s of slides) {
          if (!s.imageQuery && s.content?.type === 'image-spotlight' && typeof s.content.imageQuery === 'string') {
            s.imageQuery = s.content.imageQuery;
          }
        }

        const targetSlides = slides.filter((s) => Boolean(s.imageQuery));

        if (targetSlides.length === 0) {
          sendDebug('Image enrichment skipped: no explicit image queries in presentation');
          return;
        }

        sendDebug('Image enrichment: candidate collection started', {
          targetSlides: targetSlides.length,
        });

        const candidatesById: Record<string, { query: string; candidates: string[] }> = {};
        await withTimeout('image candidate collection', 10_000, async () => {
          await Promise.allSettled(
            targetSlides.map(async (s) => {
              const query = (s.imageQuery || '').trim();
              if (!query) return;
              const candidates = await fetchBingImageCandidates(query);
              candidatesById[s.id] = { query, candidates };
            }),
          );
        }).catch((error) => {
          sendDebug('Image enrichment: candidate collection timed out; continuing with partial results', {
            error: error instanceof Error ? error.message : String(error),
          }, 'warn');
        });

        sendDebug('Image enrichment: candidate collection complete', {
          candidateSlides: Object.keys(candidatesById).length,
          candidateCount: Object.values(candidatesById).reduce((sum, entry) => sum + entry.candidates.length, 0),
        });

        const geminiKey = resolveKey('gemini');
        if (geminiKey) {
          try {
            const selectionPrompt = {
              topic,
              subject,
              language,
              slides: targetSlides.map((s) => ({
                id: s.id,
                type: s.type,
                heading: normalizeSlideHeading(s as unknown as Record<string, unknown>),
                query: candidatesById[s.id]?.query || s.imageQuery || '',
                candidates: candidatesById[s.id]?.candidates || [],
              })),
            };

            sendDebug('Image enrichment: Gemini linker started', {
              model: 'gemini-2.0-flash',
              slideCount: targetSlides.length,
            });

            const geminiText = await withTimeout('gemini image linker', 12_000, async () => {
              return await collectText({
                model: createFastGeminiModel(geminiKey),
                system: `You assign best image URLs for slides.\nRules:\n- Return JSON only: {"images":[{"id":"slide-id","imageUrl":"https://...","imageQuery":"..."}]}\n- Use only provided candidate URLs when available.\n- Prefer distinct URLs across slides; avoid repeating same URL.\n- Only assign an image when the candidate clearly matches the slide query and heading.\n- If no candidate is clearly relevant, omit that slide from the output instead of guessing.\n- Relevance is more important than coverage.`,
                prompt: JSON.stringify(selectionPrompt),
                maxOutputTokens: 1800,
                temperature: 0.2,
              });
            });

            const parsed = JSON.parse(repairJson(geminiText)) as {
              images?: Array<{ id?: string; imageUrl?: string; imageQuery?: string }>;
            };
            const selected = Array.isArray(parsed.images) ? parsed.images : [];
            const usedUrls = new Set<string>();

            for (const img of selected) {
              if (!img.id || !img.imageUrl || !isLikelyPhotoUrl(img.imageUrl)) continue;
              if (usedUrls.has(img.imageUrl)) continue;
              const slide = slides.find((s) => s.id === img.id);
              if (!slide) continue;

              slide.imageUrl = img.imageUrl;
              if (typeof img.imageQuery === 'string' && img.imageQuery.trim()) {
                slide.imageQuery = img.imageQuery.trim();
              }
              usedUrls.add(img.imageUrl);
            }

            for (const s of targetSlides) {
              if (s.imageUrl) continue;
              const fallback = (candidatesById[s.id]?.candidates || []).find((u) => !usedUrls.has(u));
              if (!fallback) continue;
              s.imageUrl = fallback;
              usedUrls.add(fallback);
            }

            sendDebug('Gemini image linker complete', {
              targetSlides: targetSlides.length,
              linkedSlides: slides.filter((s) => Boolean(s.imageUrl)).length,
            });
            return;
          } catch (err) {
            sendDebug('Gemini image linker failed; using fallback candidates', {
              error: err instanceof Error ? err.message : String(err),
            }, 'warn');
          }
        }

        // Fallback: assign first non-duplicate candidate per target.
        const usedUrls = new Set<string>();
        for (const s of targetSlides) {
          if (s.imageUrl) {
            usedUrls.add(s.imageUrl);
            continue;
          }
          const fallback = (candidatesById[s.id]?.candidates || []).find((u) => !usedUrls.has(u));
          if (!fallback) continue;
          s.imageUrl = fallback;
          usedUrls.add(fallback);
        }

        sendDebug('Fallback image linker complete', {
          targetSlides: targetSlides.length,
          linkedSlides: slides.filter((s) => Boolean(s.imageUrl)).length,
        }, 'warn');
      }

      async function runWithTimeoutAndHeartbeat<T>(
        label: string,
        timeoutMs: number,
        fn: (signal: AbortSignal) => Promise<T>,
      ): Promise<T> {
        const started = Date.now();
        const heartbeatMs = 15_000;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const timeoutController = new AbortController();
        const heartbeat = setInterval(() => {
          const elapsed = Math.round((Date.now() - started) / 1000);
          sendDebug(`${label} still running...`, { elapsedSeconds: elapsed });
        }, heartbeatMs);

        const timeout = timeoutMs > 0
          ? new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => {
                timeoutController.abort(new Error(`${label} timed out`));
                reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`));
              }, timeoutMs);
            })
          : null;

        try {
          if (timeout) {
            return await Promise.race([fn(timeoutController.signal), timeout]);
          }
          return await fn(timeoutController.signal);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
          clearInterval(heartbeat);
        }
      }

      async function generateTextLive(
        params: Parameters<typeof streamText>[0] & { abortSignal?: AbortSignal },
        label: string,
        options?: {
          endMarker?: string;
          validatePresentation?: boolean;
        },
      ): Promise<{
        text: string;
        usage: { inputTokens: number; outputTokens: number };
      }> {
        function validateEarlyCompletionCandidate(rawJson: string): {
          ok: boolean;
          slides: number;
          narrationSlides: number;
          narrationChars: number;
          reasons: string[];
        } {
          const reasons: string[] = [];
          let parsed: unknown;
          try {
            parsed = JSON.parse(rawJson);
          } catch {
            return {
              ok: false,
              slides: 0,
              narrationSlides: 0,
              narrationChars: 0,
              reasons: ['invalid-json'],
            };
          }

          if (!parsed || typeof parsed !== 'object') {
            return {
              ok: false,
              slides: 0,
              narrationSlides: 0,
              narrationChars: 0,
              reasons: ['root-not-object'],
            };
          }

          const root = parsed as {
            metadata?: unknown;
            slides?: unknown;
            generationComplete?: unknown;
          };
          const slides = Array.isArray(root.slides) ? root.slides : [];
          const slideCount = slides.length;
          if (slideCount === 0) reasons.push('no-slides');

          if (root.metadata == null || typeof root.metadata !== 'object') {
            reasons.push('missing-metadata');
          }

          // If model emits an explicit completion marker, respect it.
          if (root.generationComplete !== undefined && root.generationComplete !== true) {
            reasons.push('generation-not-complete-marker');
          }

          const expectedMinSlides = Math.max(4, Math.ceil(duration * 0.6));
          if (slideCount < expectedMinSlides) {
            reasons.push(`too-few-slides-${slideCount}-lt-${expectedMinSlides}`);
          }

          const indexes: number[] = [];
          let narrationSlides = 0;
          let narrationChars = 0;

          for (const slide of slides) {
            if (!slide || typeof slide !== 'object') {
              reasons.push('slide-not-object');
              continue;
            }

            const s = slide as {
              id?: unknown;
              index?: unknown;
              type?: unknown;
              duration?: unknown;
              content?: unknown;
              narration?: unknown;
            };

            if (typeof s.id !== 'string' || !s.id.trim()) reasons.push('slide-missing-id');
            if (typeof s.index !== 'number' || !Number.isFinite(s.index)) reasons.push('slide-missing-index');
            if (typeof s.type !== 'string' || !s.type.trim()) reasons.push('slide-missing-type');
            if (typeof s.duration !== 'number' || !Number.isFinite(s.duration) || s.duration <= 0) reasons.push('slide-missing-duration');
            if (!s.content || typeof s.content !== 'object') reasons.push('slide-missing-content');

            if (typeof s.index === 'number' && Number.isFinite(s.index)) {
              indexes.push(s.index);
            }

            if (Array.isArray(s.narration) && s.narration.length > 0) {
              narrationSlides += 1;
              for (const cue of s.narration) {
                if (cue && typeof cue === 'object') {
                  const text = (cue as { text?: unknown }).text;
                  if (typeof text === 'string') narrationChars += text.length;
                }
              }
            }
          }

          if (indexes.length > 0) {
            const sorted = [...indexes].sort((a, b) => a - b);
            const unique = new Set(sorted);
            if (unique.size !== sorted.length) reasons.push('duplicate-slide-indexes');

            const start = sorted[0];
            for (let i = 0; i < sorted.length; i++) {
              if (sorted[i] !== start + i) {
                reasons.push('non-contiguous-slide-indexes');
                break;
              }
            }
          }

          const minNarrationSlides = Math.max(2, Math.ceil(slideCount * 0.4));
          if (narrationSlides < minNarrationSlides) {
            reasons.push(`too-few-narration-slides-${narrationSlides}-lt-${minNarrationSlides}`);
          }

          const minNarrationChars = Math.max(220, slideCount * 45);
          if (narrationChars < minNarrationChars) {
            reasons.push(`too-few-narration-chars-${narrationChars}-lt-${minNarrationChars}`);
          }

          return {
            ok: reasons.length === 0,
            slides: slideCount,
            narrationSlides,
            narrationChars,
            reasons,
          };
        }

        const streamed = streamText(params);
        let text = '';
        let lastEmitLen = 0;
        let lastJsonProbeLen = 0;
        let completedByJsonProbe = false;

        const iterator = streamed.textStream[Symbol.asyncIterator]();
        let lastDelta = '';
        let duplicateDeltaCount = 0;
        let duplicateWarned = false;

        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          const delta = typeof next.value === 'string' ? next.value : '';
          text += delta;

          if (options?.endMarker && text.includes(options.endMarker)) {
            const markerIndex = text.indexOf(options.endMarker);
            const beforeMarker = text.slice(0, markerIndex).trimEnd();

            if (options.validatePresentation) {
              const candidate = extractJson(beforeMarker);
              const candidateValidation = validateEarlyCompletionCandidate(candidate);
              if (!candidateValidation.ok) {
                sendDebug('Sentinel detected but payload failed validation; continuing stream', {
                  label,
                  reasons: candidateValidation.reasons.slice(0, 6),
                  slides: candidateValidation.slides,
                }, 'warn');
              } else {
                completedByJsonProbe = true;
                text = candidate;
                sendDebug('Detected explicit output sentinel; finalizing immediately', {
                  label,
                  textLength: text.length,
                  slides: candidateValidation.slides,
                  narrationSlides: candidateValidation.narrationSlides,
                  narrationChars: candidateValidation.narrationChars,
                }, 'warn');
                if (typeof iterator.return === 'function') {
                  try {
                    await iterator.return();
                  } catch {
                    // Best-effort iterator shutdown.
                  }
                }
                break;
              }
            } else {
              completedByJsonProbe = true;
              text = beforeMarker;
              sendDebug('Detected explicit output sentinel', { label, textLength: text.length }, 'warn');
              if (typeof iterator.return === 'function') {
                try {
                  await iterator.return();
                } catch {
                  // Best-effort iterator shutdown.
                }
              }
              break;
            }
          }

          if (delta && delta === lastDelta) {
            duplicateDeltaCount += 1;
          } else {
            duplicateDeltaCount = 0;
            duplicateWarned = false;
            lastDelta = delta;
          }

          // Keep generation alive; only suppress noisy repeated logs.
          if (duplicateDeltaCount >= 12) {
            if (!duplicateWarned) {
              duplicateWarned = true;
              sendDebug('Detected repeated model output chunks; suppressing duplicate live output events', {
                label,
                repeatedDeltaSample: delta.slice(0, 120),
              }, 'warn');
            }
            continue;
          }

          const shouldEmit = text.length - lastEmitLen >= 260 || delta.includes('\n');
          if (shouldEmit) {
            lastEmitLen = text.length;
            sendEvent('model-output', {
              label,
              delta,
              textLength: text.length,
              preview: text.slice(-360),
            });
          }

          // Some providers keep streams open after emitting a complete JSON payload.
          // Finalize early only when strict validation passes and stream goes quiet briefly.
          const shouldProbeJson =
            text.length - lastJsonProbeLen >= 800 ||
            delta.includes(']}') ||
            delta.includes('}}');
          if (shouldProbeJson) {
            lastJsonProbeLen = text.length;
            try {
              const candidate = extractJson(text);
              const candidateValidation = validateEarlyCompletionCandidate(candidate);
              if (candidateValidation.ok) {
                const quietWindowMs = 1200;
                const nextDuringQuietWindow = await Promise.race([
                  iterator.next(),
                  new Promise<null>((resolve) => {
                    setTimeout(() => resolve(null), quietWindowMs);
                  }),
                ]);

                // If stream continues producing output, do not early-complete yet.
                if (nextDuringQuietWindow && !nextDuringQuietWindow.done) {
                  const continuedDelta = typeof nextDuringQuietWindow.value === 'string'
                    ? nextDuringQuietWindow.value
                    : '';
                  text += continuedDelta;
                  continue;
                }

                completedByJsonProbe = true;
                text = candidate;
                sendDebug('Detected complete JSON payload before stream closed; finalizing early', {
                  label,
                  textLength: text.length,
                  slides: candidateValidation.slides,
                  narrationSlides: candidateValidation.narrationSlides,
                  narrationChars: candidateValidation.narrationChars,
                }, 'warn');
                if (typeof iterator.return === 'function') {
                  try {
                    await iterator.return();
                  } catch {
                    // Best-effort iterator shutdown.
                  }
                }
                break;
              } else {
                sendDebug('Early completion candidate rejected by validator', {
                  label,
                  reasons: candidateValidation.reasons.slice(0, 6),
                  slides: candidateValidation.slides,
                  narrationSlides: candidateValidation.narrationSlides,
                  narrationChars: candidateValidation.narrationChars,
                });
              }
            } catch {
              // Not complete yet; continue reading stream.
            }
          }
        }

        let usageRaw: { inputTokens?: number; outputTokens?: number } | null = null;
        if (!completedByJsonProbe) {
          try {
            usageRaw = await Promise.race([
              Promise.resolve(streamed.usage as PromiseLike<{ inputTokens?: number; outputTokens?: number }>),
              new Promise<null>((resolve) => {
                setTimeout(() => resolve(null), 5000);
              }),
            ]);
            if (!usageRaw) {
              sendDebug('Usage metadata timed out; continuing with 0-token fallback', { label }, 'warn');
            }
          } catch {
            usageRaw = null;
          }
        } else {
          sendDebug('Skipped usage wait due to early JSON completion', { label });
        }
        return {
          text,
          usage: {
            inputTokens: usageRaw?.inputTokens ?? 0,
            outputTokens: usageRaw?.outputTokens ?? 0,
          },
        };
      }

      try {
        let presentationJson: string;
        const costs: { phase: string; provider: string; inputCost: number; outputCost: number; total: number; inputTokens: number; outputTokens: number }[] = [];

        sendDebug('Generation request accepted', {
          usePipeline,
          scriptProvider,
          designProvider,
          targetDurationMin: duration,
          language,
          hasAdditionalContext: Boolean(additionalContext),
        });

        if (usePipeline) {
          /* ═══════ TWO-PHASE PIPELINE ═══════ */

          // Phase 1: Script
          sendEvent('phase', { phase: 'researching', message: 'Researching topic and writing script...' });

          const scriptModel = createModel(scriptProvider, scriptKey);
          sendDebug('Script model request started', { provider: scriptProvider });
          const scriptResult = await generateTextLive({
            model: scriptModel,
            system: buildScriptSystemPrompt(language),
            prompt: buildScriptUserPrompt({
              topic,
              subject,
              depth,
              duration,
              language,
              additionalContext,
            }),
            maxOutputTokens: 12000,
            temperature: 0.7,
          }, 'script');

          sendDebug('Script model response received', {
            provider: scriptProvider,
            inputTokens: scriptResult.usage?.inputTokens ?? 0,
            outputTokens: scriptResult.usage?.outputTokens ?? 0,
            textLength: scriptResult.text.length,
          });

          const scriptCost = calcCost(
            scriptProvider,
            scriptResult.usage?.inputTokens ?? 0,
            scriptResult.usage?.outputTokens ?? 0,
          );
          costs.push({ phase: 'script', provider: scriptProvider, ...scriptCost });

          const scriptJson = repairJson(scriptResult.text);
          if (scriptJson !== scriptResult.text) {
            sendDebug('Script JSON required repair', {
              originalLength: scriptResult.text.length,
              repairedLength: scriptJson.length,
            }, 'warn');
          }

          try {
            JSON.parse(scriptJson);
          } catch {
            throw new Error('Script generation produced invalid JSON. Please retry.');
          }

          sendDebug('Script JSON parsed successfully');

          sendEvent('script', { script: scriptJson });

          // Phase 2: Design
          sendEvent('phase', { phase: 'designing', message: 'Designing visual slides...' });

          const designMaxTokens = computeDesignMaxTokens(designProvider, duration);
          const designSystemPrompt = designProvider === 'anthropic-haiku'
            ? buildDesignSystemPromptCompact(language)
            : buildDesignSystemPrompt(language);
          const designUserPrompt = designProvider === 'anthropic-haiku'
            ? buildDesignUserPromptCompact(scriptJson, duration)
            : buildDesignUserPrompt(scriptJson, duration);
          const designModel = createModel(designProvider, designKey);
          sendDebug('Design model request started', {
            provider: designProvider,
            maxOutputTokens: designMaxTokens,
          });
          // Do not force-terminate long-running design generations.
          const designTimeoutMs = 0;
          let designResult: Awaited<ReturnType<typeof generateTextLive>> | null = null;
          let designError: Error | null = null;

          const attemptTokenBudgets = [
            designMaxTokens,
            Math.max(12000, Math.floor(designMaxTokens * 0.8)),
          ];

          for (let attempt = 0; attempt < attemptTokenBudgets.length; attempt++) {
            const maxTokens = attemptTokenBudgets[attempt];
            if (attempt > 0) {
              sendEvent('phase', { phase: 'designing', message: 'Designing visual slides... (retrying with tighter output budget)' });
              sendDebug('Retrying design model after previous failure', {
                attempt: attempt + 1,
                maxOutputTokens: maxTokens,
              }, 'warn');
            }

            try {
              designResult = await runWithTimeoutAndHeartbeat(
                `Design model attempt ${attempt + 1}`,
                designTimeoutMs,
                (signal) => generateTextLive({
                  model: designModel,
                  system: designSystemPrompt,
                  prompt: designUserPrompt,
                  maxOutputTokens: maxTokens,
                  temperature: 0.4,
                  abortSignal: signal,
                }, 'design', { endMarker: FINAL_OUTPUT_SENTINEL, validatePresentation: true }),
              );
              designError = null;
              break;
            } catch (err) {
              designError = err instanceof Error ? err : new Error(String(err));
              sendDebug('Design model attempt failed', {
                attempt: attempt + 1,
                error: designError.message,
              }, 'warn');
            }
          }

          if (!designResult) {
            throw new Error(
              `Design generation failed after retries. Last error: ${designError?.message ?? 'unknown error'}. ` +
              'Try reducing duration or switch Design Provider to "Claude Haiku 4" for faster responses.',
            );
          }

          sendDebug('Design model response received', {
            provider: designProvider,
            inputTokens: designResult.usage?.inputTokens ?? 0,
            outputTokens: designResult.usage?.outputTokens ?? 0,
            textLength: designResult.text.length,
          });

          const designCost = calcCost(
            designProvider,
            designResult.usage?.inputTokens ?? 0,
            designResult.usage?.outputTokens ?? 0,
          );
          costs.push({ phase: 'design', provider: designProvider, ...designCost });

          presentationJson = repairJson(designResult.text);
          if (presentationJson !== designResult.text) {
            sendDebug('Design JSON required repair', {
              originalLength: designResult.text.length,
              repairedLength: presentationJson.length,
            }, 'warn');
          }
        } else {
          /* ═══════ SINGLE-PASS FALLBACK ═══════ */
          sendEvent('phase', { phase: 'researching', message: 'Generating presentation...' });

          const model = createModel(designProvider, designKey);
          sendDebug('Single-pass model request started', { provider: designProvider });
          const singlePassMaxTokens = computeDesignMaxTokens(designProvider, duration);
          const result = await generateTextLive({
            model,
            system: buildSystemPrompt(language),
            prompt: buildUserPrompt({
              topic,
              subject,
              depth,
              duration,
              language,
              additionalContext,
            }),
            maxOutputTokens: singlePassMaxTokens,
            temperature: 0.7,
          }, 'single-pass', { endMarker: FINAL_OUTPUT_SENTINEL, validatePresentation: true });

          sendDebug('Single-pass model response received', {
            provider: designProvider,
            inputTokens: result.usage?.inputTokens ?? 0,
            outputTokens: result.usage?.outputTokens ?? 0,
            textLength: result.text.length,
          });

          const singleCost = calcCost(
            designProvider,
            result.usage?.inputTokens ?? 0,
            result.usage?.outputTokens ?? 0,
          );
          costs.push({ phase: 'single', provider: designProvider, ...singleCost });

          presentationJson = repairJson(result.text);
          if (presentationJson !== result.text) {
            sendDebug('Single-pass JSON required repair', {
              originalLength: result.text.length,
              repairedLength: presentationJson.length,
            }, 'warn');
          }
        }

        // Validate final JSON (repair handles truncated output)
        sendDebug('Parsing final presentation JSON');
        const presentation = JSON.parse(presentationJson);

        // Ensure slides array exists
        if (!presentation.slides || !Array.isArray(presentation.slides) || presentation.slides.length === 0) {
          throw new Error('Generation produced empty slides. Please retry.');
        }

        sendDebug('Presentation JSON validated', {
          totalSlides: presentation.slides.length,
          estimatedDuration: presentation.metadata?.estimatedDuration,
        });

        sendDebug('Running image-link enrichment', {
          totalSlides: presentation.slides.length,
        });
        await enrichPresentationImages(presentation as Record<string, unknown>);

        const totalCost = costs.reduce((acc, c) => acc + c.total, 0);
        sendDebug('Generation pipeline complete', {
          totalCost,
          costPhases: costs.map((c) => ({ phase: c.phase, provider: c.provider, total: c.total })),
        });
        sendEvent('cost', { costs, totalCost });
        sendEvent('phase', { phase: 'complete', message: 'Presentation ready.' });
        sendEvent('result', { presentation });
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        sendDebug('Generation failed', { error: message }, 'error');
        sendEvent('error', { error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
