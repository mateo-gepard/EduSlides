import { generateText } from 'ai';
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

      try {
        let presentationJson: string;
        const costs: { phase: string; provider: string; inputCost: number; outputCost: number; total: number; inputTokens: number; outputTokens: number }[] = [];

        if (usePipeline) {
          /* ═══════ TWO-PHASE PIPELINE ═══════ */

          // Phase 1: Script
          sendEvent('phase', { phase: 'researching', message: 'Researching topic and writing script...' });

          const scriptModel = createModel(scriptProvider, scriptKey);
          const scriptResult = await generateText({
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
          });

          const scriptCost = calcCost(
            scriptProvider,
            scriptResult.usage?.inputTokens ?? 0,
            scriptResult.usage?.outputTokens ?? 0,
          );
          costs.push({ phase: 'script', provider: scriptProvider, ...scriptCost });

          const scriptJson = repairJson(scriptResult.text);

          try {
            JSON.parse(scriptJson);
          } catch {
            throw new Error('Script generation produced invalid JSON. Please retry.');
          }

          sendEvent('script', { script: scriptJson });

          // Phase 2: Design
          sendEvent('phase', { phase: 'designing', message: 'Designing visual slides...' });

          const designMaxTokens = designProvider === 'anthropic-haiku' ? 8192 : 16000;
          const designSystemPrompt = designProvider === 'anthropic-haiku'
            ? buildDesignSystemPromptCompact(language)
            : buildDesignSystemPrompt(language);
          const designUserPrompt = designProvider === 'anthropic-haiku'
            ? buildDesignUserPromptCompact(scriptJson, duration)
            : buildDesignUserPrompt(scriptJson, duration);
          const designModel = createModel(designProvider, designKey);
          const designResult = await generateText({
            model: designModel,
            system: designSystemPrompt,
            prompt: designUserPrompt,
            maxOutputTokens: designMaxTokens,
            temperature: 0.4,
          });

          const designCost = calcCost(
            designProvider,
            designResult.usage?.inputTokens ?? 0,
            designResult.usage?.outputTokens ?? 0,
          );
          costs.push({ phase: 'design', provider: designProvider, ...designCost });

          presentationJson = repairJson(designResult.text);
        } else {
          /* ═══════ SINGLE-PASS FALLBACK ═══════ */
          sendEvent('phase', { phase: 'researching', message: 'Generating presentation...' });

          const model = createModel(designProvider, designKey);
          const result = await generateText({
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
            maxOutputTokens: 16000,
            temperature: 0.7,
          });

          const singleCost = calcCost(
            designProvider,
            result.usage?.inputTokens ?? 0,
            result.usage?.outputTokens ?? 0,
          );
          costs.push({ phase: 'single', provider: designProvider, ...singleCost });

          presentationJson = repairJson(result.text);
        }

        // Validate final JSON (repair handles truncated output)
        const presentation = JSON.parse(presentationJson);

        // Ensure slides array exists
        if (!presentation.slides || !Array.isArray(presentation.slides) || presentation.slides.length === 0) {
          throw new Error('Generation produced empty slides. Please retry.');
        }

        const totalCost = costs.reduce((acc, c) => acc + c.total, 0);
        sendEvent('cost', { costs, totalCost });
        sendEvent('phase', { phase: 'complete', message: 'Presentation ready.' });
        sendEvent('result', { presentation });
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
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
