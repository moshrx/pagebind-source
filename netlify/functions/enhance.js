/**
 * netlify/functions/enhance.js
 * Serverless proxy — calls Gemini to parse raw ebook text into structured JSON.
 * The GEMINI_API_KEY environment variable is set in the Netlify dashboard and
 * is never exposed to the browser.
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = `You are a professional ebook editor and formatter. Your job is to transform raw pasted text into a clean, well-structured ebook JSON that will be rendered into a beautifully typeset PDF.

Return ONLY a raw JSON object — no markdown fences, no explanation, no extra keys. Use this exact shape:

{
  "title": "Book title",
  "subtitle": "Subtitle or empty string",
  "author": "Author name or empty string",
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Chapter title WITHOUT any 'Chapter N' prefix",
      "sections": [
        {
          "sectionTitle": "Sub-section heading, or empty string for the opening body of the chapter",
          "content": [
            "A full paragraph of prose as one string.",
            "Another paragraph as a separate string.",
            "A short list-style item (no period needed)"
          ]
        }
      ]
    }
  ]
}

━━━ FRONT MATTER ━━━
• title: Take from a "Title:" label, the first prominent line, or the most book-like heading at the top.
• subtitle: Take from a "Subtitle:" label or a descriptive line directly below the title (short, no period). Leave empty if none.
• author: Take from "by ...", "Author: ...", "By: ...", or a byline near the top. May appear on the line after a label. Leave empty if not found.
• Strip all metadata labels ("Title:", "Author:", "By:", "Subtitle:") from the final text — they must NOT appear in any content[].

━━━ TABLE OF CONTENTS ━━━
• If the source contains a Table of Contents section, remove it entirely. The PDF renderer auto-generates a TOC.

━━━ CHAPTERS ━━━
• Every "Chapter N", "Chapter N –", "Chapter N:", "# Heading", or numbered heading like "1. Title" becomes a new chapter entry.
• chapterNumber must be the integer from the source (e.g. "Chapter 3" → 3). Never renumber or reorder chapters.
• chapterTitle is ONLY the title words — strip any "Chapter N", "Chapter N –", "#", or number prefix entirely.
• If the text has no chapter markers, put all content in a single chapter with chapterNumber: 1 and a sensible chapterTitle derived from the topic.

━━━ SECTIONS ━━━
• Every sub-heading inside a chapter becomes a section entry: "## Heading", "### Heading", bold lines "**Heading**", all-caps short phrases, numbered items "1.", "2.", or short title-case headings.
• The FIRST section of every chapter always has sectionTitle: "" — this holds the opening body text before the first sub-heading.
• sectionTitle must be clean plain text — strip all markdown (**, *, ##, numbers like "1.").
• If a chapter has no sub-headings, it has exactly one section with sectionTitle: "".

━━━ CONTENT PARAGRAPHS ━━━
• Each paragraph of prose (multiple sentences) is one separate string in content[].
• Each short phrase, bullet point, or list item is its own string in content[].
• Merge lines that are part of the same paragraph (separated only by a soft line break) into one string.
• Split on blank lines to determine paragraph boundaries.
• Strip ALL inline markdown from content strings: **bold**, *italic*, \`code\`, > blockquotes → plain text.
• Do NOT strip em-dashes, smart quotes, or other typographic characters.
• Do NOT invent, summarise, reorder, or paraphrase any content. Preserve the author's exact words.
• Do NOT include sectionTitle text as the first item of content[].
• Do NOT include chapterTitle text as the first item of content[].

━━━ QUALITY CHECKS ━━━
• Every chapter must have at least one section.
• Every section must have at least one string in content[].
• content[] must never contain empty strings.
• chapterNumber is always a positive integer (1, 2, 3 …).
• The JSON must be valid and complete — no trailing commas, no comments.`

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
          temperature: 0,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
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
