import { NextRequest } from 'next/server';

async function bingImageSearch(query: string): Promise<string | null> {
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

  if (!res.ok) return null;

  const html = await res.text();
  const urls: string[] = [];

  for (const m of html.matchAll(/"murl"\s*:\s*"(https?:\/\/[^"]+)"/g)) {
    urls.push(m[1]);
  }
  for (const m of html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&"]+)/g)) {
    urls.push(m[1]);
  }

  const filtered = urls.filter(
    (u) => !u.match(/\.(gif|svg|bmp|ico)(\?|$)/i)
  );

  return filtered[0] || urls[0] || null;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  // Retry up to 3 times on failure
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const imageUrl = await bingImageSearch(q);
      if (imageUrl) return Response.json({ imageUrl });
    } catch {
      // retry
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }

  return Response.json({ imageUrl: null });
}
