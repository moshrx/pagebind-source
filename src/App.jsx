/**
 * App.jsx – Pagebind MVP
 *
 * Single-page app with one goal: paste raw text → format → download PDF ebook.
 *
 * Layout (desktop):  two-column — left = paste area, right = preview
 * Layout (mobile):   single column — textarea on top, preview below
 */

import { useState, useCallback } from 'react'
import { parseText } from './lib/parseText.js'
import PreviewPanel from './components/PreviewPanel.jsx'

// ---------------------------------------------------------------------------
// Sample placeholder text shown in the textarea on first load
// ---------------------------------------------------------------------------

const PLACEHOLDER = `The Art of Deep Work

A Guide to Focused Productivity

Chapter 1 – Why Distraction Is the Enemy

In the modern workplace, the ability to focus without distraction on a cognitively demanding task has become increasingly rare — and increasingly valuable.

We live in an era of constant connectivity. Notifications, open-plan offices, and the always-on culture of email and messaging apps have eroded our capacity for sustained attention. Yet the work that matters most — the work that creates real value — demands exactly that: long, uninterrupted stretches of concentrated effort.

This book is about reclaiming that capacity.

Chapter 2 – The Deep Work Hypothesis

The Deep Work Hypothesis states that the ability to perform deep work is becoming both increasingly rare and increasingly valuable in our economy.

Those who cultivate this skill and then make it the core of their working life will thrive. The shallow work that fills most knowledge workers' days — attending meetings, responding to emails, browsing social media — produces little that is hard to replicate.

Deep work, by contrast, produces breakthroughs.

Chapter 3 – Rules for Deep Work

To master deep work, you need more than inspiration — you need a system. The following rules form the foundation of a productive deep-work practice.

Scheduling Your Deep Work

Schedule your deep work sessions in advance. Treat them like unmovable appointments. Morning sessions, before the day's noise accumulates, tend to be the most productive.

Embracing Boredom

Learning to be comfortable with boredom is essential. The ability to resist distraction is a skill that must be practised deliberately, not just when it's convenient.`

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {/* Simple book icon */}
        <svg
          className="w-7 h-7 text-indigo-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          <line x1="12" y1="6" x2="16" y2="6" />
          <line x1="12" y1="10" x2="16" y2="10" />
        </svg>
        <span className="text-xl font-bold tracking-tight text-gray-900">
          Pagebind
        </span>
      </div>
      <span className="text-xs text-gray-400 font-medium tracking-wide uppercase hidden sm:inline">
        Paste · Format · Download
      </span>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Text input panel (left column)
// ---------------------------------------------------------------------------

function InputPanel({ text, onChange, onFormat, isFormatting }) {
  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col h-full">
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="paste-area"
          className="text-sm font-semibold text-gray-700"
        >
          Paste your text
        </label>
        <span className="text-xs text-gray-400">
          {wordCount.toLocaleString()} words
        </span>
      </div>

      {/* Textarea */}
      <textarea
        id="paste-area"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        className="
          flex-1 w-full resize-none rounded-xl border border-gray-200 bg-gray-50
          p-4 text-sm text-gray-800 font-mono leading-relaxed
          placeholder:text-gray-300 placeholder:font-sans
          focus:border-indigo-300 focus:bg-white transition-colors
        "
        style={{ minHeight: '340px' }}
      />

      {/* Helper text */}
      <p className="text-xs text-gray-400 mt-2">
        AI-generated text works best. Start with the book title on the first line,
        then use &ldquo;Chapter N – Title&rdquo; headings.
      </p>

      {/* Format button */}
      <button
        onClick={onFormat}
        disabled={!text.trim() || isFormatting}
        className={`
          mt-4 w-full flex items-center justify-center gap-2
          px-6 py-3 rounded-xl font-semibold text-sm
          transition-all duration-150
          ${
            !text.trim() || isFormatting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow hover:shadow-md'
          }
        `}
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
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export default function App() {
  const [text, setText] = useState('')
  const [bookData, setBookData] = useState(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [error, setError] = useState(null)

  const handleFormat = useCallback(() => {
    if (!text.trim()) return
    setIsFormatting(true)
    setError(null)

    // Use a short timeout so the spinner renders before the (synchronous) parse
    setTimeout(() => {
      try {
        const parsed = parseText(text)
        if (!parsed) {
          setError('Could not parse the text. Make sure it has at least a title.')
          setBookData(null)
        } else {
          setBookData(parsed)
        }
      } catch (err) {
        setError('Unexpected parsing error: ' + err.message)
        setBookData(null)
      } finally {
        setIsFormatting(false)
      }
    }, 50)
  }, [text])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* ── Left column: paste area ─────────────────────────────────────── */}
        <section className="
          w-full lg:w-[45%] xl:w-[42%]
          flex flex-col
          px-6 py-6
          border-b lg:border-b-0 lg:border-r border-gray-200
          bg-white
        ">
          <InputPanel
            text={text}
            onChange={setText}
            onFormat={handleFormat}
            isFormatting={isFormatting}
          />

          {/* Error toast */}
          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </section>

        {/* ── Right column: preview ────────────────────────────────────────── */}
        <section className="
          flex-1
          flex flex-col
          px-6 py-6
          bg-gray-50
        ">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Preview</h2>
            {bookData && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-0.5 font-medium">
                Ready to download
              </span>
            )}
          </div>

          <PreviewPanel bookData={bookData} />
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-gray-300 border-t border-gray-100 bg-white">
        Pagebind — client-side PDF ebook generator
      </footer>
    </div>
  )
}
