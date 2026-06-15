/* ============================================================
   Spyglass Matrix — server-side Anthropic call
   A thin fetch wrapper so we don't pull in the SDK. The API key
   is read from the environment and never leaves the server.
   Returns null when no key is configured or the call fails, so
   callers can gracefully fall back to the bundled sample Matrix.
   ============================================================ */

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function complete(prompt: string, maxTokens = 1500): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error('Anthropic API error', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const text = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
      : '';
    return text || null;
  } catch (err) {
    console.error('Anthropic request failed', err);
    return null;
  }
}
