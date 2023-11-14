import {style, createTheme} from '@vanilla-extract/css'

const [_root, anatomy] = createTheme({
  layout: {
    lineSpacing: '8px',
    padding: '8px',
    sectionSpacing: '12px',
    radii: '4px',
    minWidth: '220px',
  },
  colors: {
    fg: 'oklch(0.95 0 0)',
    bg: 'oklch(0 0 0 / 0.8)',
  },
})

export const root = _root

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: anatomy.layout.sectionSpacing,
  position: 'fixed',
  top: 4,
  right: 4,
  padding: anatomy.layout.padding,
  borderRadius: anatomy.layout.radii,
  minWidth: anatomy.layout.minWidth,
  backgroundColor: anatomy.colors.bg,
})

export const sectionTitle = style({
  fontSize: 12,
  color: anatomy.colors.fg,
  lineHeight: '16px',
})

export const text = style({
  fontSize: 10,
  color: anatomy.colors.fg,
  lineHeight: '16px',
})
