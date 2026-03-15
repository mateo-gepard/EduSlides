import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  buildScriptSystemPrompt,
  buildScriptUserPrompt,
  buildDesignSystemPrompt,
  buildDesignUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/prompts';

export const maxDuration = 180;

/* ─── Cost per 1M tokens (USD) ─── */
const PRICING: Record<string, { input: number; output: number }> = {
  gemini: { input: 1.25, output: 10.0 },       // Gemini 2.5 Pro
  anthropic: { input: 3.0, output: 15.0 },      // Claude Sonnet 4
  openai: { input: 2.5, output: 10.0 },         // GPT-4o
};

function calcCost(provider: string, promptTokens: number, completionTokens: number) {
  const p = PRICING[provider] ?? { input: 0, output: 0 };
  const inputCost = (promptTokens / 1_000_000) * p.input;
  const outputCost = (completionTokens / 1_000_000) * p.output;
  return { inputCost, outputCost, total: inputCost + outputCost, promptTokens, completionTokens };
}

function resolveKey(provider: string, clientKey?: string): string | undefined {
  if (clientKey) return clientKey;
  switch (provider) {
    case 'gemini':
      return process.env.GOOGLE_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createModel(provider: string, apiKey: string): any {
  switch (provider) {
    case 'gemini':
      return createGoogleGenerativeAI({ apiKey })('gemini-2.5-pro-preview-06-05');
    case 'anthropic':
      return createAnthropic({ apiKey })('claude-sonnet-4-20250514');
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

  if (!topic || !depth || !duration || !language) {
    return Response.json(
      { error: 'Missing required fields: topic, depth, duration, language' },
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
        const costs: { phase: string; provider: string; inputCost: number; outputCost: number; total: number; promptTokens: number; completionTokens: number }[] = [];

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
            maxTokens: 12000,
            temperature: 0.7,
          });

          const scriptCost = calcCost(
            scriptProvider,
            scriptResult.usage?.promptTokens ?? 0,
            scriptResult.usage?.completionTokens ?? 0,
          );
          costs.push({ phase: 'script', provider: scriptProvider, ...scriptCost });

          const scriptJson = extractJson(scriptResult.text);

          try {
            JSON.parse(scriptJson);
          } catch {
            throw new Error('Script generation produced invalid JSON. Please retry.');
          }

          sendEvent('script', { script: scriptJson });

          // Phase 2: Design
          sendEvent('phase', { phase: 'designing', message: 'Designing visual slides...' });

          const designModel = createModel(designProvider, designKey);
          const designResult = await generateText({
            model: designModel,
            system: buildDesignSystemPrompt(language),
            prompt: buildDesignUserPrompt(scriptJson, duration),
            maxTokens: 16000,
            temperature: 0.5,
          });

          const designCost = calcCost(
            designProvider,
            designResult.usage?.promptTokens ?? 0,
            designResult.usage?.completionTokens ?? 0,
          );
          costs.push({ phase: 'design', provider: designProvider, ...designCost });

          presentationJson = extractJson(designResult.text);
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
            maxTokens: 16000,
            temperature: 0.7,
          });

          const singleCost = calcCost(
            designProvider,
            result.usage?.promptTokens ?? 0,
            result.usage?.completionTokens ?? 0,
          );
          costs.push({ phase: 'single', provider: designProvider, ...singleCost });

          presentationJson = extractJson(result.text);
        }

        // Validate final JSON
        const presentation = JSON.parse(presentationJson);

        const totalCost = costs.reduce((acc, c) => acc + c.total, 0);
        sendEvent('cost', { costs, totalCost });
        sendEvent('phase', { phase: 'complete', message: 'Presentation ready.' });
        sendEvent('result', { presentation });
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Generation failed';
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
