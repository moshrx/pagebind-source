/**
 * PreviewPanel.jsx
 * Fast HTML preview that mirrors the chosen template + font.
 * The "Download PDF" button triggers the real @react-pdf/renderer output.
 */

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
  const fileName =
    (bookData.title || 'ebook')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.pdf'

  return (
    <PDFDownloadLink
      document={<PDFDocument bookData={bookData} templateId={templateId} fontId={fontId} />}
      fileName={fileName}
      className="block"
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all
            ${loading
              ? 'bg-indigo-300 cursor-wait text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg'
            }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
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
