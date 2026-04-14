/**
 * themes.js
 * Defines all available templates and font options.
 * Used by both PDFDocument (PDF output) and PreviewPanel (HTML preview).
 */

// ---------------------------------------------------------------------------
// Templates – control colours, layout style, and decorative elements
// ---------------------------------------------------------------------------

export const TEMPLATES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional book — centered headings, clean white',
    swatch: { page: '#ffffff', heading: '#111111', accent: '#888888' },
    // PDF
    pageBackground: '#ffffff',
    headingColor: '#111111',
    chapterLabelColor: '#888888',
    subtitleColor: '#555555',
    bodyColor: '#1a1a1a',
    footerColor: '#aaaaaa',
    dividerColor: '#cccccc',
    headingAlign: 'center',
    // HTML preview
    previewBg: 'bg-white',
    previewHeading: 'text-gray-900',
    previewLabel: 'text-gray-400',
    previewBody: 'text-gray-700',
    previewAccent: 'border-gray-300',
    previewPage: 'bg-gray-100',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Minimal and sharp — indigo accents, left-aligned',
    swatch: { page: '#ffffff', heading: '#0f172a', accent: '#4f46e5' },
    pageBackground: '#ffffff',
    headingColor: '#0f172a',
    chapterLabelColor: '#4f46e5',
    subtitleColor: '#475569',
    bodyColor: '#1e293b',
    footerColor: '#94a3b8',
    dividerColor: '#e2e8f0',
    headingAlign: 'left',
    previewBg: 'bg-white',
    previewHeading: 'text-slate-900',
    previewLabel: 'text-indigo-500',
    previewBody: 'text-slate-700',
    previewAccent: 'border-slate-200',
    previewPage: 'bg-slate-50',
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    description: 'Cozy editorial — cream pages, amber headings',
    swatch: { page: '#faf7f0', heading: '#7c2d12', accent: '#c2762a' },
    pageBackground: '#faf7f0',
    headingColor: '#7c2d12',
    chapterLabelColor: '#c2762a',
    subtitleColor: '#a16207',
    bodyColor: '#292524',
    footerColor: '#a8a29e',
    dividerColor: '#d6c9b0',
    headingAlign: 'center',
    previewBg: 'bg-amber-50',
    previewHeading: 'text-red-900',
    previewLabel: 'text-amber-600',
    previewBody: 'text-stone-800',
    previewAccent: 'border-amber-200',
    previewPage: 'bg-amber-100',
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'High contrast — deep navy, violet accents',
    swatch: { page: '#1a1a2e', heading: '#e8e8f0', accent: '#818cf8' },
    pageBackground: '#1a1a2e',
    headingColor: '#e8e8f0',
    chapterLabelColor: '#818cf8',
    subtitleColor: '#94a3b8',
    bodyColor: '#c8c8d8',
    footerColor: '#4b5563',
    dividerColor: '#2d2d4e',
    headingAlign: 'left',
    previewBg: 'bg-[#1a1a2e]',
    previewHeading: 'text-slate-100',
    previewLabel: 'text-indigo-300',
    previewBody: 'text-slate-300',
    previewAccent: 'border-indigo-900',
    previewPage: 'bg-[#141428]',
  },
}

export const TEMPLATE_ORDER = ['classic', 'modern', 'warm', 'dark']

// ---------------------------------------------------------------------------
// Fonts – body typeface (bold variant auto-derived)
// ---------------------------------------------------------------------------

export const FONTS = {
  serif: {
    id: 'serif',
    name: 'Serif',
    label: 'Times New Roman',
    pdf: { body: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic' },
    css: 'Georgia, "Times New Roman", serif',
    sample: 'Aa',
    sampleClass: 'font-serif',
  },
  sans: {
    id: 'sans',
    name: 'Sans-serif',
    label: 'Helvetica',
    pdf: { body: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique' },
    css: 'system-ui, -apple-system, Helvetica, Arial, sans-serif',
    sample: 'Aa',
    sampleClass: 'font-sans',
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    label: 'Courier',
    pdf: { body: 'Courier', bold: 'Courier-Bold', italic: 'Courier-Oblique' },
    css: '"Courier New", Courier, monospace',
    sample: 'Aa',
    sampleClass: 'font-mono',
  },
}

export const FONT_ORDER = ['serif', 'sans', 'mono']
