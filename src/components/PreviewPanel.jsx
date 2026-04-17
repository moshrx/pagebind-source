/**
 * PreviewPanel.jsx
 * Fast HTML preview that mirrors the chosen template + font.
 * The "Download PDF" button triggers the real @react-pdf/renderer output.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import PDFDocument from './PDFDocument.jsx'
import { TEMPLATES, FONTS } from '../lib/themes.js'

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8 select-none">
      <svg className="w-14 h-14 mb-4 text-gray-200" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
        <rect x="10" y="6" width="44" height="52" rx="3" />
        <line x1="20" y1="20" x2="44" y2="20" />
        <line x1="20" y1="28" x2="44" y2="28" />
        <line x1="20" y1="36" x2="38" y2="36" />
      </svg>
      <p className="text-base font-medium text-gray-300">Preview will appear here</p>
      <p className="text-sm mt-1 text-gray-400">
        Paste text → pick a template → click&nbsp;
        <span className="text-indigo-400 font-semibold">Format &amp; Preview</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Title page preview
// ---------------------------------------------------------------------------

function TitlePagePreview({ title, subtitle, author, tpl, fnt }) {
  return (
    <div
      className={`book-page rounded mb-5 px-12 py-14 flex flex-col items-${tpl.headingAlign === 'center' ? 'center' : 'start'} justify-center min-h-[480px] ${tpl.previewBg}`}
      style={{ fontFamily: fnt.css }}
    >
      <h1
        className={`text-2xl font-bold leading-snug mb-3 ${tpl.previewHeading}`}
        style={{ textAlign: tpl.headingAlign === 'center' ? 'center' : 'left' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className={`text-sm italic leading-relaxed mb-2 ${tpl.previewLabel}`}
           style={{ textAlign: tpl.headingAlign === 'center' ? 'center' : 'left' }}>
          {subtitle}
        </p>
      )}
      <div className={`w-10 border-b my-5 ${tpl.previewAccent}`} />
      {author && (
        <p className={`text-xs tracking-wide ${tpl.previewLabel}`}
           style={{ textAlign: tpl.headingAlign === 'center' ? 'center' : 'left' }}>
          by {author}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table of Contents preview
// ---------------------------------------------------------------------------

function TOCPreview({ chapters, tpl, fnt }) {
  if (chapters.length <= 1) return null
  return (
    <div
      className={`book-page rounded mb-5 px-12 py-10 ${tpl.previewBg}`}
      style={{ fontFamily: fnt.css }}
    >
      <h2
        className={`text-xl font-bold mb-6 ${tpl.previewHeading}`}
        style={{ textAlign: tpl.headingAlign === 'center' ? 'center' : 'left' }}
      >
        Contents
      </h2>
      {chapters.map((chapter, idx) => (
        <div
          key={idx}
          className={`flex items-baseline gap-2 py-2.5 border-b ${tpl.previewAccent}`}
        >
          <span className={`text-[10px] uppercase tracking-widest w-20 shrink-0 ${tpl.previewLabel}`}>
            {chapter.chapterNumber > 0 ? `Chapter ${chapter.chapterNumber}` : 'Intro'}
          </span>
          <span className={`text-xs mx-1 ${tpl.previewLabel}`}>···</span>
          <span className={`text-sm font-semibold ${tpl.previewHeading}`}>
            {chapter.chapterTitle || `Chapter ${chapter.chapterNumber}`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chapter page preview
// ---------------------------------------------------------------------------

function ChapterPreview({ chapter, tpl, fnt }) {
  return (
    <div
      className={`book-page rounded mb-5 px-12 py-10 ${tpl.previewBg}`}
      style={{ fontFamily: fnt.css }}
    >
      {chapter.chapterNumber > 0 && (
        <p className={`text-xs uppercase tracking-widest mb-1.5 ${tpl.previewLabel}`}>
          Chapter {chapter.chapterNumber}
        </p>
      )}
      <h2 className={`text-xl font-bold leading-snug mb-6 ${tpl.previewHeading}`}
          style={{ textAlign: tpl.headingAlign === 'center' ? 'center' : 'left' }}>
        {chapter.chapterTitle}
      </h2>

      {chapter.sections.map((section, sIdx) => (
        <div key={sIdx} className="mb-3">
          {section.sectionTitle && (
            <h3 className={`text-sm font-bold mt-4 mb-1.5 leading-snug ${tpl.previewHeading}`}>
              {section.sectionTitle}
            </h3>
          )}
          {section.content.slice(0, 3).map((para, pIdx) => (
            <p key={pIdx} className={`text-xs leading-relaxed mb-2 text-justify ${tpl.previewBody}`}>
              {para}
            </p>
          ))}
          {section.content.length > 3 && (
            <p className={`text-xs italic ${tpl.previewLabel}`}>
              +{section.content.length - 3} more paragraph{section.content.length - 3 !== 1 ? 's' : ''}…
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Download button
// ---------------------------------------------------------------------------

function DownloadButton({ bookData, templateId, fontId }) {
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [hasConsent, setHasConsent] = useState(false)
  const [error, setError] = useState('')
  const [canDownload, setCanDownload] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileName =
    (bookData.title || 'ebook')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.pdf'

  const pdfDocument = useMemo(
    () => <PDFDocument bookData={bookData} templateId={templateId} fontId={fontId} />,
    [bookData, templateId, fontId]
  )

  const closePrompt = () => {
    setIsPromptOpen(false)
    setError('')
  }

  const submitLead = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    const payload = new URLSearchParams({
      'form-name': 'download-leads',
      email: trimmedEmail,
      bookTitle: bookData.title || 'Untitled',
      templateId,
      fontId,
      consentedAt: new Date().toISOString(),
      permissionReason: 'User opted in to share email for download follow-up and Pagebind updates.',
    })

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      return true
    } catch {
      setError('We could not save your email right now. Please try again.')
      return false
    }
  }

  const handleConsentDownload = async () => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setError('Enter your email to continue.')
      return
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    if (!isValidEmail) {
      setError('Enter a valid email address.')
      return
    }

    if (!hasConsent) {
      setError('Please confirm that we can store your email before downloading.')
      return
    }

    setIsSubmitting(true)
    const didSubmit = await submitLead()
    setIsSubmitting(false)

    if (!didSubmit) return

    setError('')
    setIsPromptOpen(false)
    setCanDownload(true)
  }

  return (
    <>
      <PDFDownloadLink
        document={pdfDocument}
        fileName={fileName}
        className="hidden"
      >
        {({ url, loading }) => (
          <AutoDownloadAnchor
            canDownload={canDownload}
            loading={loading}
            url={url}
            fileName={fileName}
            onComplete={() => setCanDownload(false)}
          />
        )}
      </PDFDownloadLink>

      <button
        type="button"
        onClick={() => setIsPromptOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Download PDF
      </button>

      {isPromptOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  Download access
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                  Share your email before downloading
                </h3>
              </div>
              <button
                type="button"
                onClick={closePrompt}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close download prompt"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              With your permission, we’ll store your email with this download so we can follow up with interested users and share Pagebind updates.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(event) => setHasConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm leading-relaxed text-gray-700">
                I agree to let Pagebind store my email with this download for follow-up and product updates.
              </span>
            </label>

            {error && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePrompt}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConsentDownload}
                disabled={isSubmitting}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
                  isSubmitting ? 'bg-indigo-300 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save and download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AutoDownloadAnchor({ canDownload, loading, url, fileName, onComplete }) {
  const linkRef = useRef(null)

  useEffect(() => {
    if (!canDownload || loading || !url) return
    linkRef.current?.click()
    onComplete()
  }, [canDownload, loading, onComplete, url])

  return <a ref={linkRef} href={url || undefined} download={fileName} className="hidden">hidden download</a>
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function PreviewPanel({ bookData, templateId, fontId }) {
  const tpl = TEMPLATES[templateId] || TEMPLATES.classic
  const fnt = FONTS[fontId] || FONTS.serif

  if (!bookData) return <EmptyState />

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable preview */}
      <div className={`flex-1 overflow-y-auto rounded-xl p-4 ${tpl.previewPage}`}
           style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <TitlePagePreview
          title={bookData.title}
          subtitle={bookData.subtitle}
          author={bookData.author}
          tpl={tpl}
          fnt={fnt}
        />
        <TOCPreview chapters={bookData.chapters} tpl={tpl} fnt={fnt} />
        {bookData.chapters.map((chapter, idx) => (
          <ChapterPreview key={idx} chapter={chapter} tpl={tpl} fnt={fnt} />
        ))}
      </div>

      {/* Download + meta */}
      <div className="pt-4 mt-2 border-t border-gray-100">
        <DownloadButton bookData={bookData} templateId={templateId} fontId={fontId} />
        <p className="text-xs text-center text-gray-400 mt-2">
          {bookData.chapters.length} chapter{bookData.chapters.length !== 1 ? 's' : ''}
          &nbsp;·&nbsp;
          {tpl.name} template &nbsp;·&nbsp; {fnt.label} font
        </p>
      </div>
    </div>
  )
}
