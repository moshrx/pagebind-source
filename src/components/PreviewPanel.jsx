/**
 * PreviewPanel.jsx
 * HTML representation of the formatted ebook – looks like a physical book page.
 * Renders immediately without spawning an iframe, so it's fast and interactive.
 *
 * A separate "Download PDF" button (using @react-pdf/renderer PDFDownloadLink)
 * lives at the bottom of this panel.
 */

import { PDFDownloadLink } from '@react-pdf/renderer'
import PDFDocument from './PDFDocument.jsx'

// ---------------------------------------------------------------------------
// Empty / placeholder state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16 text-gray-400 select-none">
      <svg
        className="w-16 h-16 mb-5 opacity-30"
        fill="none"
        viewBox="0 0 64 64"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="10" y="6" width="44" height="52" rx="3" />
        <line x1="20" y1="20" x2="44" y2="20" />
        <line x1="20" y1="28" x2="44" y2="28" />
        <line x1="20" y1="36" x2="38" y2="36" />
      </svg>
      <p className="text-lg font-medium text-gray-300">No preview yet</p>
      <p className="text-sm mt-1 text-gray-400">
        Paste your text on the left, then click&nbsp;
        <span className="font-semibold text-indigo-400">Format &amp; Preview</span>.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Book-page preview (HTML)
// ---------------------------------------------------------------------------

function TitlePage({ title, subtitle, author }) {
  return (
    <div className="book-page bg-white rounded-sm mb-6 px-14 py-16 flex flex-col items-center justify-center min-h-[600px] font-serif">
      <h1 className="text-3xl font-bold text-center text-gray-900 leading-snug mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base italic text-gray-500 text-center mb-3 leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="w-12 border-b border-gray-300 my-6" />
      {author && (
        <p className="text-sm text-gray-500 text-center tracking-wide">
          by {author}
        </p>
      )}
    </div>
  )
}

function ChapterPage({ chapter }) {
  return (
    <div className="book-page bg-white rounded-sm mb-6 px-14 py-12 font-serif">
      {chapter.chapterNumber > 0 && (
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
          Chapter {chapter.chapterNumber}
        </p>
      )}
      <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-8">
        {chapter.chapterTitle}
      </h2>

      {chapter.sections.map((section, sIdx) => (
        <div key={sIdx} className="mb-4">
          {section.sectionTitle && (
            <h3 className="text-base font-bold text-gray-800 mt-6 mb-2 leading-snug">
              {section.sectionTitle}
            </h3>
          )}
          {section.content.map((para, pIdx) => (
            <p
              key={pIdx}
              className="text-sm text-gray-700 leading-relaxed mb-3 text-justify"
            >
              {para}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Download button (generates the real PDF on click)
// ---------------------------------------------------------------------------

function DownloadButton({ bookData }) {
  const fileName =
    (bookData.title || 'ebook')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.pdf'

  return (
    <PDFDownloadLink
      document={<PDFDocument bookData={bookData} />}
      fileName={fileName}
      className="block"
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
            ${
              loading
                ? 'bg-indigo-300 cursor-wait text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg'
            }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function PreviewPanel({ bookData }) {
  if (!bookData) return <EmptyState />

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <div className="bg-gray-100 rounded-xl p-5">
          <TitlePage
            title={bookData.title}
            subtitle={bookData.subtitle}
            author={bookData.author}
          />
          {bookData.chapters.map((chapter, idx) => (
            <ChapterPage key={idx} chapter={chapter} />
          ))}
        </div>
      </div>

      {/* Sticky download button */}
      <div className="pt-4 border-t border-gray-100 mt-2">
        <DownloadButton bookData={bookData} />
        <p className="text-xs text-center text-gray-400 mt-2">
          {bookData.chapters.length} chapter{bookData.chapters.length !== 1 ? 's' : ''} detected
          &nbsp;·&nbsp; US Letter · serif · 1-inch margins
        </p>
      </div>
    </div>
  )
}
