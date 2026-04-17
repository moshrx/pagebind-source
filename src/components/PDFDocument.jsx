/**
 * PDFDocument.jsx
 * @react-pdf/renderer document. Driven entirely by bookData + template + font props.
 *
 * Layout: US Letter, 1-inch margins, footer on every page.
 * Pages: Title → Table of Contents → Chapters
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { TEMPLATES, FONTS } from '../lib/themes.js'

const IN = 72        // 1 inch in PDF points
const MARGIN = IN
const FOOTER_CLEARANCE = 32

// ---------------------------------------------------------------------------
// Build a StyleSheet from the chosen template + font
// ---------------------------------------------------------------------------

function makeStyles(tpl, fnt) {
  return StyleSheet.create({
    page: {
      paddingTop: MARGIN,
      paddingBottom: MARGIN + FOOTER_CLEARANCE,
      paddingLeft: MARGIN,
      paddingRight: MARGIN,
      backgroundColor: tpl.pageBackground,
      fontFamily: fnt.pdf.body,
      fontSize: 12,
      color: tpl.bodyColor,
    },

    // ── Title page ───────────────────────────────────────────────────────────
    titleWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: tpl.headingAlign === 'center' ? 'center' : 'flex-start',
    },
    bookTitle: {
      fontFamily: fnt.pdf.bold,
      fontSize: 34,
      color: tpl.headingColor,
      textAlign: tpl.headingAlign,
      lineHeight: 1.25,
      marginBottom: 18,
    },
    bookSubtitle: {
      fontFamily: fnt.pdf.italic,
      fontSize: 15,
      color: tpl.subtitleColor,
      textAlign: tpl.headingAlign,
      lineHeight: 1.4,
      marginBottom: 12,
    },
    divider: {
      width: 56,
      borderBottomWidth: 1,
      borderBottomColor: tpl.dividerColor,
      marginTop: 26,
      marginBottom: 26,
      alignSelf: tpl.headingAlign === 'center' ? 'center' : 'flex-start',
    },
    bookAuthor: {
      fontFamily: fnt.pdf.body,
      fontSize: 13,
      color: tpl.subtitleColor,
      textAlign: tpl.headingAlign,
      letterSpacing: 0.5,
    },

    // ── Table of Contents ────────────────────────────────────────────────────
    tocHeading: {
      fontFamily: fnt.pdf.bold,
      fontSize: 22,
      color: tpl.headingColor,
      textAlign: tpl.headingAlign,
      marginBottom: 32,
      letterSpacing: 0.3,
    },
    tocRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: tpl.dividerColor,
    },
    tocChapterLabel: {
      fontFamily: fnt.pdf.body,
      fontSize: 8,
      color: tpl.chapterLabelColor,
      letterSpacing: 1.5,
      width: 72,
      textTransform: 'uppercase',
    },
    tocChapterTitle: {
      fontFamily: fnt.pdf.bold,
      fontSize: 12,
      color: tpl.headingColor,
      flex: 1,
    },
    tocDots: {
      fontFamily: fnt.pdf.body,
      fontSize: 10,
      color: tpl.dividerColor,
      marginHorizontal: 6,
    },

    // ── Chapter pages ────────────────────────────────────────────────────────
    chapterLabel: {
      fontFamily: fnt.pdf.body,
      fontSize: 10,
      color: tpl.chapterLabelColor,
      textTransform: 'uppercase',
      letterSpacing: 2.5,
      marginBottom: 8,
      textAlign: tpl.headingAlign,
    },
    chapterTitle: {
      fontFamily: fnt.pdf.bold,
      fontSize: 26,
      color: tpl.headingColor,
      lineHeight: 1.3,
      marginBottom: 32,
      textAlign: tpl.headingAlign,
    },
    chapterDivider: {
      width: 40,
      borderBottomWidth: 1,
      borderBottomColor: tpl.dividerColor,
      marginBottom: 28,
      alignSelf: tpl.headingAlign === 'center' ? 'center' : 'flex-start',
    },
    sectionTitle: {
      fontFamily: fnt.pdf.bold,
      fontSize: 14,
      color: tpl.headingColor,
      marginTop: 22,
      marginBottom: 8,
      lineHeight: 1.3,
    },
    paragraph: {
      fontFamily: fnt.pdf.body,
      fontSize: 12,
      color: tpl.bodyColor,
      lineHeight: 1.75,
      textAlign: 'justify',
      marginBottom: 10,
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
      position: 'absolute',
      bottom: MARGIN / 2,
      left: MARGIN,
      right: MARGIN,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: tpl.dividerColor,
      paddingTop: 5,
    },
    footerText: {
      fontFamily: fnt.pdf.body,
      fontSize: 9,
      color: tpl.footerColor,
    },
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Footer({ title, S }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText} numberOfLines={1}>{title}</Text>
      <Text style={S.footerText} render={({ pageNumber, totalPages }) =>
        `${pageNumber} / ${totalPages}`
      } />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function PDFDocument({ bookData, templateId = 'classic', fontId = 'serif' }) {
  const tpl = TEMPLATES[templateId] || TEMPLATES.classic
  const fnt = FONTS[fontId] || FONTS.serif
  const S = makeStyles(tpl, fnt)
  const { title, subtitle, author, chapters } = bookData

  return (
    <Document title={title} author={author || undefined} creator="Pagebind" producer="Pagebind">

      {/* ── Title page ─────────────────────────────────────────────────────── */}
      <Page size="LETTER" style={S.page}>
        <View style={S.titleWrapper}>
          <Text style={S.bookTitle}>{title}</Text>
          {subtitle ? <Text style={S.bookSubtitle}>{subtitle}</Text> : null}
          <View style={S.divider} />
          {author ? <Text style={S.bookAuthor}>by {author}</Text> : null}
        </View>
        <Footer title={title} S={S} />
      </Page>

      {/* ── Table of Contents ──────────────────────────────────────────────── */}
      {chapters.length > 1 && (
        <Page size="LETTER" style={S.page}>
          <Text style={S.tocHeading}>Contents</Text>
          {chapters.map((chapter, idx) => (
            <View key={idx} style={S.tocRow}>
              <Text style={S.tocChapterLabel}>
                {chapter.chapterNumber > 0 ? `Chapter ${chapter.chapterNumber}` : 'Intro'}
              </Text>
              <Text style={S.tocDots}>···</Text>
              <Text style={S.tocChapterTitle}>{chapter.chapterTitle || `Chapter ${chapter.chapterNumber}`}</Text>
            </View>
          ))}
          <Footer title={title} S={S} />
        </Page>
      )}

      {/* ── Chapters ───────────────────────────────────────────────────────── */}
      {chapters.map((chapter, cIdx) => (
        <Page key={cIdx} size="LETTER" style={S.page}>
          {chapter.chapterNumber > 0 && (
            <Text style={S.chapterLabel}>Chapter {chapter.chapterNumber}</Text>
          )}
          {/* Only show title text if it differs from "Chapter N" bare label */}
          {chapter.chapterTitle ? (
            <Text style={S.chapterTitle}>{chapter.chapterTitle}</Text>
          ) : null}
          <View style={S.chapterDivider} />

          {chapter.sections.map((section, sIdx) => (
            <View key={sIdx} wrap>
              {section.sectionTitle ? (
                <Text style={S.sectionTitle}>{section.sectionTitle}</Text>
              ) : null}
              {section.content.map((para, pIdx) => (
                <Text key={pIdx} style={S.paragraph}>{para}</Text>
              ))}
            </View>
          ))}

          <Footer title={title} S={S} />
        </Page>
      ))}
    </Document>
  )
}
