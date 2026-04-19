/**
 * enhanceWithAI.js
 * Calls the Netlify serverless function which proxies Gemini.
 * The API key never touches the browser.
 *
 * Returns a bookData object  { title, subtitle, author, chapters[] }
 * or throws an Error with a user-facing message.
 */

export async function enhanceWithAI(text) {
  const res = await fetch('/.netlify/functions/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const msg = data?.error || `Server error (${res.status})`
    throw new Error(msg)
  }

  if (!data?.title || !Array.isArray(data?.chapters)) {
    throw new Error('AI returned an unexpected response shape.')
  }

  return data
}
