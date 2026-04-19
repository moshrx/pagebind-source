/**
 * netlify/functions/enhance.js
 * Serverless proxy — calls Gemini to parse raw ebook text into structured JSON.
 * The GEMINI_API_KEY environment variable is set in the Netlify dashboard and
 * is never exposed to the browser.
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SYSTEM_PROMPT = `You are an expert ebook formatter. Parse the raw text below into a structured ebook.

Return ONLY a raw JSON object (no markdown fences, no explanation) with this exact shape:

{
  "title": "Book title string",
  "subtitle": "Subtitle string, or empty string if none",
  "author": "Author name string, or empty string if none",
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Title text WITHOUT the Chapter N prefix",
      "sections": [
        {
          "sectionTitle": "Sub-section heading, or empty string for opening body",
          "content": [
            "First paragraph text.",
            "Second paragraph text.",
            "Short list item without period"
          ]
        }
      ]
    }
  ]
}

Rules you MUST follow:
1. Extract the book title from a "Title: ..." label or the first prominent line.
2. Extract the author from "Author: ...", "By: ...", or "by ..." patterns (may be on the next line after the label).
3. Each chapter marker ("Chapter N:", "Chapter N –", "# Heading") becomes a chapter entry. Preserve the original chapter number.
4. Sub-sections inside a chapter (numbered items "1.", "## Heading", bold "**Heading**", all-caps lines, short title-case headings) become section entries within that chapter.
5. The first section of every chapter has sectionTitle = "" (opening body before any sub-heading).
6. Each paragraph of prose becomes a separate string in content[].
7. Short phrases or list-style lines (e.g. "Sprinting at high speeds") are separate strings in content[].
8. Remove any embedded Table of Contents — it will be auto-generated.
9. Remove metadata labels ("Author:", "Title:", "Table of Contents") from the content.
10. Do not invent or paraphrase content — preserve the original wording exactly.
11. chapterNumber must be an integer matching the number in the source text.
12. If no chapters are found, wrap all content in one chapter with chapterNumber: 1.`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on this server.' }),
    }
  }

  let text
  try {
    ;({ text } = JSON.parse(event.body))
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) }
  }

  if (!text?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No text provided.' }) }
  }

  const prompt = `${SYSTEM_PROMPT}\n\nRaw text:\n${text}`

  let geminiRes
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    })
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Could not reach Gemini API.', detail: err.message }),
    }
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text()
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Gemini API returned an error.', detail }),
    }
  }

  const geminiData = await geminiRes.json()
  const rawContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawContent) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Empty response from Gemini.' }),
    }
  }

  let bookData
  try {
    bookData = JSON.parse(rawContent)
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Gemini returned non-JSON content.', raw: rawContent }),
    }
  }

  // Basic validation
  if (!bookData.title || !Array.isArray(bookData.chapters)) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Gemini response is missing required fields.', raw: bookData }),
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData),
  }
}
