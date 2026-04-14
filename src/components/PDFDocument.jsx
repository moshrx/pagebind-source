/**
 * PDFDocument.jsx
 * The @react-pdf/renderer document that gets rendered into a downloadable PDF.
 *
 * Design:
 *  - US Letter pages (8.5 × 11 in)
 *  - 1-inch margins on all sides (72 pt)
 *  - Times-Roman / Times-Bold for body & headings (clean serif)
 *  - Title page → Chapters (each starts on a new page)
 *  - Footer: book title (left) + page number (right)
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IN = 72          // 1 inch in PDF points
const MARGIN = IN      // 1 inch margin
const FOOTER_H = 30    // height reserved for footer

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
  // ── Page base ─────────────────────────────────────────────────────────────
  page: {
    size: 'LETTER',
    paddingTop: MARGIN,
    paddingBottom: MARGIN + FOOTER_H,
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    backgroundColor: '#ffffff',
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: '#1a1a1a',
  },

  // ── Title page ────────────────────────────────────────────────────────────
  titlePageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 1.25,
    marginBottom: 20,
    color: '#111111',
  },
  bookSubtitle: {
    fontFamily: 'Times-Roman',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#444444',
    marginBottom: 14,
    lineHeight: 1.4,
  },
  divider: {
    width: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#bbbbbb',
    marginTop: 28,
    marginBottom: 28,
    alignSelf: 'center',
  },
  bookAuthor: {
    fontFamily: 'Times-Roman',
    fontSize: 14,
    textAlign: 'center',
    color: '#555555',
    letterSpacing: 0.5,
  },

  // ── Chapter page ──────────────────────────────────────────────────────────
  chapterLabel: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  chapterTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 26,
    lineHeight: 1.3,
    color: '#111111',
    marginBottom: 36,
  },
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    color: '#222222',
    marginTop: 22,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  paragraph: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.75,
    textAlign: 'justify',
    color: '#1a1a1a',
    marginBottom: 10,
  },

  // ── Footer (fixed – appears on every page) ────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: MARGIN / 2,
    left: MARGIN,
    right: MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#dddddd',
    paddingTop: 6,
  },
  footerTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    color: '#999999',
    maxWidth: '70%',
  },
  footerPage: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    color: '#999999',
  },
})

// ---------------------------------------------------------------------------
// Footer component (fixed = renders on every page automatically)
// ---------------------------------------------------------------------------

function Footer({ bookTitle }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerTitle} numberOfLines={1}>
        {bookTitle}
      </Text>
      <Text
        style={S.footerPage}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main document
// ---------------------------------------------------------------------------

export default function PDFDocument({ bookData }) {
  const { title, subtitle, author, chapters } = bookData

  return (
    <Document
      title={title}
      author={author || undefined}
      creator="Pagebind"
      producer="Pagebind"
    >
      {/* ── Title page ────────────────────────────────────────────────────── */}
      <Page size="LETTER" style={S.page}>
        <View style={S.titlePageWrapper}>
          <Text style={S.bookTitle}>{title}</Text>

          {subtitle ? (
            <Text style={S.bookSubtitle}>{subtitle}</Text>
          ) : null}

          <View style={S.divider} />

          {author ? (
            <Text style={S.bookAuthor}>by {author}</Text>
          ) : null}
        </View>

        <Footer bookTitle={title} />
      </Page>

      {/* ── Chapter pages ─────────────────────────────────────────────────── */}
      {chapters.map((chapter, cIdx) => (
        <Page key={cIdx} size="LETTER" style={S.page}>
          {/* Chapter label – skip for chapter 0 (intro) */}
          {chapter.chapterNumber > 0 && (
            <Text style={S.chapterLabel}>
              Chapter {chapter.chapterNumber}
            </Text>
          )}

          <Text style={S.chapterTitle}>{chapter.chapterTitle}</Text>

          {chapter.sections.map((section, sIdx) => (
            <View key={sIdx}>
              {section.sectionTitle ? (
                <Text style={S.sectionTitle}>{section.sectionTitle}</Text>
              ) : null}

              {section.content.map((para, pIdx) => (
                <Text key={pIdx} style={S.paragraph}>
                  {para}
                </Text>
              ))}
            </View>
          ))}

          <Footer bookTitle={title} />
        </Page>
      ))}
    </Document>
  )
}
