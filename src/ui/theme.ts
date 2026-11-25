/**
 * Vine design tokens: the "Pulse" direction (redesign canvas, Nov 2026).
 * Off-white ground, near-black ink, an electric lime accent, chunky display type.
 * Light only for now.
 *
 * Rules that keep Pulse sharp:
 * - Lime is a highlight, not a background for reading: at most one or two lime things per screen
 *   (the Create button, the active tab, a liked post, the one main action).
 * - Text on lime is always ink. Never put lime text on a light surface.
 * - Surfaces are flat: no drop shadows; cards get a thin ink outline instead.
 */
export const colors = {
  ink: '#111113', // text, outlines, dark surfaces (tab bar, dark cards)
  accent: '#C6F24E', // electric lime
  primary: '#111113', // kept for existing call sites: same as ink
  secondary: '#3A3A40',
  link: '#111113', // links are ink and underlined; icons are ink
  softBlue: '#C4C4CB', // placeholder glyphs (empty avatar)
  border: '#DCDCD6', // soft dividers and quiet borders
  outline: '#111113', // the thin ink outline on cards, inputs, outlined buttons
  backgroundLight: '#E8E8E3',
  background: '#F2F2EE', // app ground
  card: '#FFFFFF',
  cardMuted: '#EAEAE5', // inputs, search pill, quiet fills
  subtle: '#F7F7F4',
  white: '#FFFFFF',
  textMuted: '#5C5C66', // 5.9:1 on the ground, 6.4:1 on white
  inkMuted: '#B9B9C2', // inactive icons on dark surfaces
  inkRaised: '#2A2A30', // active pill on dark surfaces
  live: '#E5383B',
  danger: '#C62828',
  overlay: 'rgba(17, 17, 19, 0.55)',
  lift: '#9A5B12', // warm gold for Lift (prayer and support), dark enough for text
  liftSoft: '#FDF1DF',
  liftBorder: '#EFD3A6',
} as const;

/**
 * Type:
 * - Bricolage Grotesque (brand): display text, screen titles, names, buttons. Chunky and expressive.
 * - Inter (text): everything people read: body, captions, inputs.
 * Never set fontWeight on top of these; pick the family weight instead.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  brand: 'BricolageGrotesque_800ExtraBold',
  brandMedium: 'BricolageGrotesque_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { sm: 8, md: 14, lg: 18, xl: 24, xxl: 30, pill: 999 } as const;
/** Width of the ink outline on cards, inputs and outlined buttons. */
export const stroke = 1.5;

/** Pulse is flat; these stay only for floating layers (sheets, the tab bar over content). */
export const shadow = {
  card: {},
  bar: {
    shadowColor: '#111113',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
} as const;
