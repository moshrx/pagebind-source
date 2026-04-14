/**
 * App.jsx – Pagebind MVP
 * Paste text → pick template + font → Format & Preview → Download PDF
 */

import { useState, useCallback } from 'react'
import { parseText } from './lib/parseText.js'
import { TEMPLATES, TEMPLATE_ORDER, FONTS, FONT_ORDER } from './lib/themes.js'
import PreviewPanel from './components/PreviewPanel.jsx'

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

function LeftPanel({ text, onChange, templateId, onTemplateChange, fontId, onFontChange, onFormat, isFormatting }) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col h-full gap-5">

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
          First line = book title. Use <code className="bg-gray-100 px-1 rounded">Chapter N – Title</code> for chapters.
        </p>
      </div>

      {/* ── Section 2: Style options ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-700">2 · Choose style</p>
        <TemplatePicker value={templateId} onChange={onTemplateChange} />
        <FontPicker value={fontId} onChange={onFontChange} />
      </div>

      {/* ── Section 3: Format button ──────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-700">3 · Preview &amp; download</p>
        <button
          onClick={onFormat}
          disabled={!text.trim() || isFormatting}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            font-semibold text-sm transition-all duration-150
            ${!text.trim() || isFormatting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow hover:shadow-md'
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
            <>
              Format &amp; Preview
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
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
  const [text, setText] = useState('')
  const [templateId, setTemplateId] = useState('classic')
  const [fontId, setFontId] = useState('serif')
  const [bookData, setBookData] = useState(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [error, setError] = useState(null)

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
            templateId={templateId}
            onTemplateChange={handleTemplateChange}
            fontId={fontId}
            onFontChange={setFontId}
            onFormat={handleFormat}
            isFormatting={isFormatting}
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
