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

/** Detects "by Author Name" or "Author: Name" author lines (name on same line) */
const AUTHOR_RE = /^(by|author:?)\s+(.+)/i

/** Detects a bare author label with no name — e.g. "Author:" or "By:" */
const AUTHOR_LABEL_RE = /^(author|by)\s*:?\s*$/i

/** Detects Table of Contents section headers */
const TOC_RE = /^(table of contents|contents)$/i

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
  let title = rawTitle
    .replace(/^#+\s*/, '')
    .replace(/^title\s*:\s*/i, '')
    .trim()
  idx++

  // If the title line was a bare label like "Title:" with no value,
  // look ahead to the next non-empty line for the actual title text.
  if (!title) {
    while (idx < lines.length && !lines[idx].trim()) idx++
    if (idx < lines.length) {
      const candidate = lines[idx].trim()
      if (!isChapterHeading(candidate) && !TOC_RE.test(candidate)) {
        title = candidate.replace(/^#+\s*/, '').replace(/^title\s*:\s*/i, '').trim()
        idx++
      }
    }
  }
  title = title || 'Untitled'

  let subtitle = ''
  let author = ''

  // Look ahead up to 8 lines for subtitle / author
  for (let lookahead = 0; lookahead < 8 && idx < lines.length; lookahead++) {
    const line = lines[idx].trim()

    if (!line) { idx++; continue }

    // Stop if we hit a chapter heading or a well-known section word – body has started
    if (isChapterHeading(line)) break
    if (/^(introduction|preface|foreword|prologue|epilogue|conclusion|afterword)$/i.test(line)) break
    if (TOC_RE.test(line)) break

    // "Author: Name" on the same line
    const authorMatch = line.match(AUTHOR_RE)
    if (authorMatch) {
      author = authorMatch[2].trim()
      idx++
      continue
    }

    // "Author:" / "By:" label on its own line — name is on the next non-empty line
    if (AUTHOR_LABEL_RE.test(line)) {
      idx++
      while (idx < lines.length && !lines[idx].trim()) idx++
      if (idx < lines.length) {
        const nameLine = lines[idx].trim()
        if (nameLine && !isChapterHeading(nameLine) && !TOC_RE.test(nameLine)) {
          author = nameLine
          idx++
        }
      }
      continue
    }

    // Short line that isn't the author → treat as subtitle
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

    // ── Skip embedded Table of Contents blocks ──────────────────────────────
    // Advance past all TOC lines until the first real chapter heading.
    if (TOC_RE.test(line)) {
      i++
      while (i < lines.length) {
        const nextLine = lines[i].trim()
        if (nextLine && isChapterHeading(nextLine)) { i--; break }
        i++
      }
      continue
    }

    // ── Chapter heading vs. numbered sub-item ───────────────────────────────
    // "1. Sub Title" is a numbered item. When we are already inside a chapter
    // it becomes a section, NOT a new top-level chapter.
    const isNumberedItem = NUMBERED_HEADING_RE.test(line)

    if (isChapterHeading(line) && !(currentChapter && isNumberedItem)) {
      pushChapter()
      // Preserve the explicit number written in the text (e.g. "Chapter 3")
      // so chapters always match what the author intended.
      const explicitNum = extractChapterNumber(line)
      chapterCount = explicitNum !== null ? explicitNum : chapterCount + 1
      currentChapter = {
        chapterNumber: chapterCount,
        chapterTitle: cleanChapterTitle(line),
        sections: [],
      }
      currentSection = { sectionTitle: '', content: [] }
      continue
    }

    // ── Section / sub-chapter heading ────────────────────────────────────────
    // Catches: ## markdown, all-caps phrases, title-case phrases before long
    // paragraphs, **bold** full-line headings, and numbered sub-items (1. / 2.)
    // that appear inside an existing chapter.
    if (currentChapter && (isSectionHeading(line, lines, i) || isNumberedItem)) {
      pushSection()
      currentSection = { sectionTitle: cleanSectionTitle(line), content: [] }
      continue
    }

    // ── Regular paragraph ────────────────────────────────────────────────────
    // Auto-create an intro chapter if content appears before any chapter heading.
    // Do NOT increment chapterCount so that the first explicit "Chapter N" keeps
    // its original number.
    if (!currentChapter) {
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
  // "## Chapter N" / "### Chapter N" — chapter keyword overrides the ## level
  const noHash = line.replace(/^#+\s*/, '')
  if (noHash !== line && CHAPTER_RE.test(noHash)) return true
  // "1. Chapter Title" (numbered, starts with capital after number)
  if (NUMBERED_HEADING_RE.test(line)) return true
  return false
}

function isSectionHeading(line, lines, idx) {
  // Markdown H2/H3
  if (MD_H2_RE.test(line)) return true

  // Full-line bold markdown: **Section Title**
  if (/^\*\*[^*]+\*\*$/.test(line)) return true

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

  // Title-case multi-word line followed by a paragraph of decent length.
  // e.g. "Getting Started", "The Core Principles", "Why This Matters"
  // Must: 2–8 words, no sentence-end punctuation, most content words capitalised.
  // Threshold lowered to 60 chars so sections with shorter opening sentences
  // are still detected.
  const stripped = line.replace(/^\*\*(.+?)\*\*$/, '$1') // unwrap bold for this check
  const words = stripped.trim().split(/\s+/)
  const contentWords = words.filter((w) => w.length > 3)
  const isTitleCase =
    contentWords.length > 0 &&
    contentWords.every((w) => /^[A-Z]/.test(w))
  const nextLine = lines.slice(idx + 1).find((l) => l.trim())

  if (
    words.length >= 2 &&
    words.length <= 8 &&
    stripped.length <= 70 &&
    !stripped.endsWith('.') &&
    !stripped.endsWith(',') &&
    !stripped.endsWith(':') &&
    !stripped.endsWith(';') &&
    !stripped.endsWith('?') &&
    isTitleCase &&
    nextLine &&
    nextLine.trim().length > 60
  )
    return true

  return false
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clean a section / sub-chapter title: strip numbered prefix and markdown. */
function cleanSectionTitle(line) {
  return line
    .replace(/^(\d+)[.)]\s+/, '')          // strip "1. " or "2) " prefix
    .replace(/^\*\*(.+?)\*\*$/, '$1')      // unwrap **bold**
    .replace(/\*\*(.+?)\*\*/g, '$1')       // strip inline bold
    .replace(/\*(.+?)\*/g, '$1')           // strip italic
    .replace(/`(.+?)`/g, '$1')             // strip code
    .replace(/^#+\s+/, '')                 // strip markdown heading markers
    .replace(/^>\s*/, '')                  // strip blockquote marker
    .trim()
}

/** Extract the numeric part of a "Chapter N" heading, or null if not present. */
function extractChapterNumber(line) {
  const match = line.match(/^(?:chapter|ch\.?)\s+(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

function cleanChapterTitle(line) {
  // Strip leading # markers first so CHAPTER_RE matches cleanly
  const noHash = line.replace(/^#+\s*/, '')
  return noHash
    .replace(CHAPTER_RE, '')
    .replace(NUMBERED_HEADING_RE, '$2')
    .replace(/^[\s:.\-–—]+/, '')
    .trim() || ''
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
