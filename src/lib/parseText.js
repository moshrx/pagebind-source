/**
 * parseText.js
 * Converts raw AI-generated text into a structured ebook object.
 *
 * Output shape:
 * {
 *   title:    string,
 *   subtitle: string,
 *   author:   string,
 *   chapters: [
 *     {
 *       chapterNumber: number,   // 0 = introduction / pre-chapter content
 *       chapterTitle:  string,
 *       sections: [
 *         { sectionTitle: string, content: string[] }
 *       ]
 *     }
 *   ]
 * }
 */

// ---------------------------------------------------------------------------
// Regex helpers
// ---------------------------------------------------------------------------

/** Detects lines like "Chapter 1", "Chapter One", "CHAPTER 3 – Title" */
const CHAPTER_RE =
  /^(chapter|ch\.?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[ivxlcdm]+)[\s:.\-–—]*/i

/** Detects "# Title" or "## Section" markdown headings */
const MD_H1_RE = /^#\s+(.+)/
const MD_H2_RE = /^#{2,3}\s+(.+)/

/** Detects "1. Chapter Title" or "1) Chapter Title" numbering */
const NUMBERED_HEADING_RE = /^(\d+)[.)]\s+([A-Z].{2,})/

/** Detects "by Author Name" or "Author: Name" author lines */
const AUTHOR_RE = /^(by|author:?)\s+(.+)/i

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function parseText(rawText) {
  if (!rawText || !rawText.trim()) return null

  // Normalise line endings, strip trailing whitespace per line
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())

  // Collapse runs of 3+ blank lines into exactly 2
  const normalised = collapseBlankLines(lines)

  // Pull out title / subtitle / author from the top of the document
  const { title, subtitle, author, startIdx } = extractFrontMatter(normalised)

  // Walk the rest of the lines and build chapters
  const chapters = buildChapters(normalised, startIdx)

  // Fallback: if nothing parsed into chapters, treat all content as one chapter
  if (chapters.length === 0) {
    const content = normalised.slice(startIdx).filter((l) => l.trim())
    return {
      title,
      subtitle,
      author,
      chapters: [
        {
          chapterNumber: 1,
          chapterTitle: title,
          sections: [{ sectionTitle: '', content }],
        },
      ],
    }
  }

  return { title, subtitle, author, chapters }
}

// ---------------------------------------------------------------------------
// Front-matter extraction
// ---------------------------------------------------------------------------

function extractFrontMatter(lines) {
  // Find the first non-empty line as title
  let idx = 0
  while (idx < lines.length && !lines[idx].trim()) idx++

  if (idx >= lines.length) {
    return { title: 'Untitled', subtitle: '', author: '', startIdx: 0 }
  }

  // Title – strip leading markdown "#" and common AI-generated "Title: " prefixes
  const rawTitle = lines[idx].trim()
  const title = rawTitle
    .replace(/^#+\s*/, '')
    .replace(/^title\s*:\s*/i, '')
    .trim() || 'Untitled'
  idx++

  let subtitle = ''
  let author = ''

  // Look ahead up to 4 more lines for subtitle / author
  for (let lookahead = 0; lookahead < 4 && idx < lines.length; lookahead++) {
    const line = lines[idx].trim()

    if (!line) { idx++; continue }

    // Stop if we hit a chapter heading or a well-known section word – body has started
    if (isChapterHeading(line)) break
    if (/^(introduction|preface|foreword|prologue|epilogue|conclusion|afterword)$/i.test(line)) break

    const authorMatch = line.match(AUTHOR_RE)
    if (authorMatch) {
      author = authorMatch[2].trim()
      idx++
      continue
    }

    // Short line that isn't already the author → treat as subtitle
    if (!subtitle && line.length < 120 && !line.endsWith('.')) {
      subtitle = line.replace(/^#+\s*/, '')
      idx++
      continue
    }

    break
  }

  return { title, subtitle, author, startIdx: idx }
}

// ---------------------------------------------------------------------------
// Chapter / section builder
// ---------------------------------------------------------------------------

function buildChapters(lines, startIdx) {
  const chapters = []
  let currentChapter = null
  let currentSection = null
  let chapterCount = 0

  const pushSection = () => {
    if (currentSection && currentSection.content.length > 0) {
      currentChapter.sections.push(currentSection)
    }
    currentSection = null
  }

  const pushChapter = () => {
    if (currentChapter) {
      pushSection()
      if (currentChapter.sections.length > 0) {
        chapters.push(currentChapter)
      }
    }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()

    // ── Blank line ──────────────────────────────────────────────────────────
    if (!line) continue

    // ── Chapter heading ─────────────────────────────────────────────────────
    if (isChapterHeading(line)) {
      pushChapter()
      chapterCount++
      currentChapter = {
        chapterNumber: chapterCount,
        chapterTitle: cleanChapterTitle(line),
        sections: [],
      }
      currentSection = { sectionTitle: '', content: [] }
      continue
    }

    // ── Section heading ──────────────────────────────────────────────────────
    if (currentChapter && isSectionHeading(line, lines, i)) {
      pushSection()
      currentSection = { sectionTitle: cleanMarkdown(line), content: [] }
      continue
    }

    // ── Regular paragraph ────────────────────────────────────────────────────
    // Auto-create an intro chapter if content appears before any chapter heading
    if (!currentChapter) {
      chapterCount++
      currentChapter = {
        chapterNumber: 0,
        chapterTitle: 'Introduction',
        sections: [],
      }
      currentSection = { sectionTitle: '', content: [] }
    }
    if (!currentSection) {
      currentSection = { sectionTitle: '', content: [] }
    }

    currentSection.content.push(cleanMarkdown(line))
  }

  pushChapter()
  return chapters
}

// ---------------------------------------------------------------------------
// Heading detectors
// ---------------------------------------------------------------------------

function isChapterHeading(line) {
  if (CHAPTER_RE.test(line)) return true
  if (MD_H1_RE.test(line)) return true
  // "1. Chapter Title" (numbered, starts with capital after number)
  if (NUMBERED_HEADING_RE.test(line)) return true
  return false
}

function isSectionHeading(line, lines, idx) {
  // Markdown H2/H3
  if (MD_H2_RE.test(line)) return true

  // All-caps multi-word line (e.g. "THE BEGINNING", "KEY CONCEPTS")
  // Require at least two words and a space to avoid single-word abbreviations
  if (
    line === line.toUpperCase() &&
    /\s/.test(line) &&
    line.length >= 6 &&
    line.length <= 60 &&
    !/^\d/.test(line)
  )
    return true

  // Title-case multi-word line followed by a long paragraph
  // e.g. "Getting Started", "The Core Principles", "Why This Matters"
  // Must: 2–7 words, no sentence-end punctuation, most content words capitalised
  const words = line.trim().split(/\s+/)
  const contentWords = words.filter((w) => w.length > 3)
  const isTitleCase =
    contentWords.length > 0 &&
    contentWords.every((w) => /^[A-Z]/.test(w))
  const nextLine = lines.slice(idx + 1).find((l) => l.trim())

  if (
    words.length >= 2 &&
    words.length <= 7 &&
    line.length <= 60 &&
    !line.endsWith('.') &&
    !line.endsWith(',') &&
    !line.endsWith(':') &&
    !line.endsWith(';') &&
    !line.endsWith('?') &&
    isTitleCase &&
    nextLine &&
    nextLine.trim().length > 80
  )
    return true

  return false
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanChapterTitle(line) {
  // Remove "Chapter N –" prefix, strip markdown #
  return line
    .replace(CHAPTER_RE, '')
    .replace(/^#+\s*/, '')
    .replace(NUMBERED_HEADING_RE, '$2')
    .replace(/^[\s:.\-–—]+/, '')
    .trim() || line.trim()
}

function cleanMarkdown(line) {
  // Strip **bold**, *italic*, `code`, > blockquote markers
  return line
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^>\s*/, '')
    .trim()
}

function collapseBlankLines(lines) {
  const result = []
  let blanks = 0
  for (const line of lines) {
    if (!line.trim()) {
      blanks++
      if (blanks <= 2) result.push(line)
    } else {
      blanks = 0
      result.push(line)
    }
  }
  return result
}
