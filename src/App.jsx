/**
 * App.jsx – Pagebind MVP
 * Paste text → pick template + font → Format & Preview → Download PDF
 */

import { useState, useCallback } from 'react'
import { parseText } from './lib/parseText.js'
import { enhanceWithAI } from './lib/enhanceWithAI.js'
import { TEMPLATES, TEMPLATE_ORDER, FONTS, FONT_ORDER } from './lib/themes.js'
import PreviewPanel from './components/PreviewPanel.jsx'

// ---------------------------------------------------------------------------
// Password gate
// ---------------------------------------------------------------------------

const ACCESS_CODE = 'BIND14'
const STORAGE_KEY = 'pb_unlocked'

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    if (value.trim() === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, '1')
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-gray-900">Pagebind</span>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Enter access code</p>
          <p className="text-xs text-gray-400 mt-1">This tool is invite-only</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            placeholder="Access code"
            autoFocus
            className={`w-full rounded-xl border px-4 py-3 text-sm text-center tracking-widest font-mono outline-none transition
              ${error
                ? 'border-red-300 bg-red-50 focus:border-red-400'
                : 'border-gray-200 bg-gray-50 focus:border-indigo-300 focus:bg-white'
              }`}
          />
          {error && (
            <p className="text-xs text-red-600 text-center">Invalid access code</p>
          )}
          <button
            onClick={attempt}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold transition-all"
          >
            Access
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        <span className="text-lg font-bold tracking-tight text-gray-900">Pagebind</span>
      </div>
      <span className="hidden sm:inline text-xs text-gray-400 tracking-widest uppercase font-medium">
        Paste · Format · Download
      </span>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Template picker
// ---------------------------------------------------------------------------

function TemplatePicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Template
      </label>
      <div className="grid grid-cols-4 gap-2">
        {TEMPLATE_ORDER.map((id) => {
          const tpl = TEMPLATES[id]
          const active = value === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              title={tpl.description}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all text-center
                ${active
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              {/* Colour swatch */}
              <div
                className="w-10 h-7 rounded shadow-sm border border-black/10 flex items-end pb-0.5 px-0.5 gap-px"
                style={{ backgroundColor: tpl.swatch.page }}
              >
                <div className="flex-1 h-1 rounded-sm" style={{ backgroundColor: tpl.swatch.heading }} />
                <div className="flex-1 h-0.5 rounded-sm" style={{ backgroundColor: tpl.swatch.accent }} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                {tpl.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Font picker
// ---------------------------------------------------------------------------

function FontPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Font
      </label>
      <div className="flex gap-2">
        {FONT_ORDER.map((id) => {
          const fnt = FONTS[id]
          const active = value === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border-2 transition-all
                ${active
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <span
                className={`text-xl font-bold leading-none ${active ? 'text-indigo-700' : 'text-gray-700'}`}
                style={{ fontFamily: fnt.css }}
              >
                Aa
              </span>
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-indigo-600' : 'text-gray-500'}`}>
                {fnt.name}
              </span>
              <span className="text-[9px] text-gray-400 leading-none">{fnt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New-user guide
// ---------------------------------------------------------------------------

const EBOOK_SCRIPT_TEMPLATE = `The Quiet Shape of Better Work

A Practical Guide to Clear Thinking and Consistent Output

by Alex Harper

Chapter 1 - Start with a strong promise

Open with a short paragraph that explains what the reader will gain.

## Why this matters

Use section headings when you want cleaner structure inside a chapter.

Add paragraphs as normal body text. Keep each paragraph separated by a blank line.

Chapter 2 - Keep one idea per section

Each new chapter should start with "Chapter N - Title" so Pagebind can detect it reliably.

## Keep formatting simple

Avoid tables, stray bullets, and chat-style labels when possible if you want the cleanest ebook layout.`

function HowToUse({ onUseTemplate }) {
  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            New here?
          </p>
          <h2 className="mt-1 text-base font-semibold text-gray-900">
            How to get the best ebook layout
          </h2>
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-100">
          Recommended
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-gray-600">
        <p>
          Start with an ebook-style script, not a chat transcript. When your text follows a clear title,
          subtitle, author, chapter, and section pattern, the parser can align the design much better.
        </p>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Best structure</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
            <li>`Title` on the first line</li>
            <li>`Subtitle` and optional `by Author` below it</li>
            <li>`Chapter 1 - Title` for each chapter</li>
            <li>`## Section Title` for sub-sections inside chapters</li>
            <li>Blank lines between paragraphs</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          Use plain prose whenever possible. Heavy bullets, pasted prompts, or mixed note formats can lead to awkward page flow.
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onUseTemplate}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          Use ebook script template
        </button>
        <a
          href="#paste-area"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
        >
          Jump to editor
        </a>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Left panel (paste + options + button)
// ---------------------------------------------------------------------------

const SAMPLE_TEXT = `The Art of Deep Work

A Guide to Focused Productivity

Chapter 1 – Why Distraction Is the Enemy

In the modern workplace, the ability to focus without distraction on a cognitively demanding task has become increasingly rare — and increasingly valuable.

Chapter 2 – The Deep Work Hypothesis

The Deep Work Hypothesis states that the ability to perform deep work is both increasingly rare and increasingly valuable in our economy. Those who cultivate this skill and make it the core of their working life will thrive.

Chapter 3 – Rules for Deep Work

To master deep work, you need more than inspiration — you need a system. The following rules form the foundation of a productive deep-work practice.`

function LeftPanel({
  text,
  onChange,
  onUseTemplate,
  templateId,
  onTemplateChange,
  fontId,
  onFontChange,
  onFormat,
  isFormatting,
  onEnhance,
  isEnhancing,
}) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const busy = isFormatting || isEnhancing

  return (
    <div className="flex flex-col h-full gap-5">
      <HowToUse onUseTemplate={onUseTemplate} />

      {/* ── Section 1: Paste text ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="paste-area" className="text-sm font-semibold text-gray-700">
            1 · Paste your text
          </label>
          <span className="text-xs text-gray-400">{wordCount.toLocaleString()} words</span>
        </div>
        <textarea
          id="paste-area"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={SAMPLE_TEXT}
          spellCheck={false}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3.5
            text-sm text-gray-800 font-mono leading-relaxed
            placeholder:text-gray-300 placeholder:font-sans placeholder:text-xs
            focus:border-indigo-300 focus:bg-white transition-colors"
          style={{ minHeight: '220px', maxHeight: '340px' }}
        />
        <p className="text-xs text-gray-400">
          First line = book title. Use <code className="bg-gray-100 px-1 rounded">Chapter N - Title</code> for chapters and <code className="bg-gray-100 px-1 rounded">## Section Title</code> for sections.
        </p>
      </div>

      {/* ── Section 2: Style options ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-700">2 · Choose style</p>
        <TemplatePicker value={templateId} onChange={onTemplateChange} />
        <FontPicker value={fontId} onChange={onFontChange} />
      </div>

      {/* ── Section 3: Format / Enhance buttons ──────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700">3 · Preview &amp; download</p>

        {/* Primary: AI Enhance */}
        <button
          onClick={onEnhance}
          disabled={!text.trim() || busy}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            font-semibold text-sm transition-all duration-150
            ${!text.trim() || busy
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow hover:shadow-md'
            }`}
        >
          {isEnhancing ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Enhancing with AI…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Enhance with AI
            </>
          )}
        </button>

        {/* Secondary: quick local format */}
        <button
          onClick={onFormat}
          disabled={!text.trim() || busy}
          className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
            font-semibold text-sm transition-all duration-150 border
            ${!text.trim() || busy
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700'
            }`}
        >
          {isFormatting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Parsing…
            </>
          ) : (
            'Quick Format (no AI)'
          )}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export default function App() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
  const [text, setText] = useState('')
  const [templateId, setTemplateId] = useState('classic')
  const [fontId, setFontId] = useState('serif')
  const [bookData, setBookData] = useState(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [error, setError] = useState(null)

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  const handleFormat = useCallback(() => {
    if (!text.trim()) return
    setIsFormatting(true)
    setError(null)
    setTimeout(() => {
      try {
        const parsed = parseText(text)
        if (!parsed) {
          setError('Could not detect structure. Make sure the first line is your book title.')
          setBookData(null)
        } else {
          setBookData(parsed)
        }
      } catch (err) {
        setError('Parse error: ' + err.message)
        setBookData(null)
      } finally {
        setIsFormatting(false)
      }
    }, 40)
  }, [text])

  const handleEnhance = useCallback(async () => {
    if (!text.trim()) return
    setIsEnhancing(true)
    setError(null)
    try {
      const parsed = await enhanceWithAI(text)
      setBookData(parsed)
    } catch (err) {
      setError('AI enhance failed: ' + err.message)
      setBookData(null)
    } finally {
      setIsEnhancing(false)
    }
  }, [text])

  const handleUseTemplate = useCallback(() => {
    setText(EBOOK_SCRIPT_TEMPLATE)
    setBookData(null)
    setError(null)
  }, [])

  // Re-format automatically when template or font changes (if we already have data)
  const handleTemplateChange = (id) => {
    setTemplateId(id)
    // If preview is showing, re-trigger so the preview updates
    if (bookData) setBookData((prev) => ({ ...prev }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left: controls ────────────────────────────────────────────────── */}
        <section className="w-full lg:w-[44%] xl:w-[42%] bg-white border-b lg:border-b-0 lg:border-r border-gray-200
          px-6 py-6 overflow-y-auto">
          <LeftPanel
            text={text}
            onChange={setText}
            onUseTemplate={handleUseTemplate}
            templateId={templateId}
            onTemplateChange={handleTemplateChange}
            fontId={fontId}
            onFontChange={setFontId}
            onFormat={handleFormat}
            isFormatting={isFormatting}
            onEnhance={handleEnhance}
            isEnhancing={isEnhancing}
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </section>

        {/* ── Right: preview ────────────────────────────────────────────────── */}
        <section className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Preview</h2>
            {bookData && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-0.5 font-medium">
                ✓ Ready to download
              </span>
            )}
          </div>
          <PreviewPanel bookData={bookData} templateId={templateId} fontId={fontId} />
        </section>
      </main>

      <footer className="shrink-0 text-center py-2.5 text-xs text-gray-300 border-t border-gray-100 bg-white">
        Pagebind — client-side PDF ebook generator
      </footer>
    </div>
  )
}
