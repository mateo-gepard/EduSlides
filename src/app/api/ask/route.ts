import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { question, slideContent, slideNarration, presentationTitle, language } =
    (await req.json()) as {
      question: string;
      slideContent: string;
      slideNarration: string;
      presentationTitle: string;
      language: string;
    };

  if (!question?.trim()) {
    return Response.json({ error: 'No question provided.' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Google API key not configured.' },
      { status: 401 },
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google('gemini-2.0-flash');

  const result = await generateText({
    model,
    system: `You are a helpful educational tutor assisting a student who is watching a presentation titled "${presentationTitle}". Answer their question about the current slide concisely and accurately. Use the slide content and narration as context. Answer in ${language}. Keep answers brief (2-4 sentences) unless the student asks for detail. Use markdown for formatting if helpful.`,
    prompt: `CURRENT SLIDE CONTENT:
${slideContent}

SLIDE NARRATION:
${slideNarration}

STUDENT QUESTION:
${question}`,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });

  return Response.json({ answer: result.text });
}
