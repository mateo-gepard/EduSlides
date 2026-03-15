import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&first=1&qft=+filterui:photo-photo+filterui:imagesize-large`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return Response.json({ imageUrl: null });
    }

    const html = await res.text();

    // Bing embeds image URLs in JSON data attributes as "murl":"<url>"
    // Handle both raw and HTML-entity-escaped variants
    const urls: string[] = [];

    for (const m of html.matchAll(/"murl"\s*:\s*"(https?:\/\/[^"]+)"/g)) {
      urls.push(m[1]);
    }
    for (const m of html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&"]+)/g)) {
      urls.push(m[1]);
    }

    // Prefer common photo formats, skip gifs/svgs
    const filtered = urls.filter(
      (u) => !u.match(/\.(gif|svg|bmp|ico)(\?|$)/i)
    );

    return Response.json({ imageUrl: filtered[0] || urls[0] || null });
  } catch {
    return Response.json({ imageUrl: null });
  }
}
