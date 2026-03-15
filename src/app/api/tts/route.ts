export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    text,
    provider,
    apiKey,
    voice,
  } = body as {
    text: string;
    provider: 'openai' | 'elevenlabs';
    apiKey?: string;
    voice?: string;
  };

  if (!text) {
    return Response.json({ error: 'Missing text' }, { status: 400 });
  }

  if (provider === 'openai') {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      return Response.json({ error: 'No OpenAI API key' }, { status: 401 });
    }

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice || 'nova',
        response_format: 'mp3',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json(
        { error: `OpenAI TTS failed: ${err}` },
        { status: res.status },
      );
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (provider === 'elevenlabs') {
    const key = apiKey || process.env.ELEVENLABS_API_KEY;
    if (!key) {
      return Response.json(
        { error: 'No ElevenLabs API key' },
        { status: 401 },
      );
    }

    const voiceId = voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      return Response.json(
        { error: `ElevenLabs TTS failed: ${err}` },
        { status: res.status },
      );
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return Response.json(
    { error: `Unsupported TTS provider: ${provider}` },
    { status: 400 },
  );
}
