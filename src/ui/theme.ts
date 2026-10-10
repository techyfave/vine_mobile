/**
 * Vine design tokens — taken from the Figma file and the web app's theme (vineplatform/src/app/globals.css).
 * Light only: the design has no dark mode yet.
 */
export const colors = {
  primary: '#264A74', // navy: text, primary buttons, active states
  secondary: '#3B73B5',
  link: '#4A90E2', // icons, links, dashed tab rings
  softBlue: '#8BB8ED',
  border: '#B5D1F4',
  backgroundLight: '#D0E1F8',
  background: '#E1ECFA', // app background
  card: '#FFFFFF',
  cardMuted: '#ECF3FC', // inputs, search pill, notification rows
  subtle: '#F3F7FD', // auth sheet
  white: '#FFFFFF',
  textMuted: 'rgba(38, 74, 116, 0.5)', // #264A7480
  live: '#E5383B',
  danger: '#C62828',
  overlay: 'rgba(38, 74, 116, 0.5)',
} as const;

/**
 * Type: two rounded families that match the logo's soft, rounded "ine".
 * - Fredoka (brand): display text, titles, hero lines. Closest match to the logo lettering.
 * - Nunito (text): everything people read: body, labels, buttons, inputs.
 * Never set fontWeight on top of these; pick the family weight instead.
 */
export const fonts = {
  regular: 'Nunito_500Medium',
  medium: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
  brand: 'Fredoka_600SemiBold',
  brandMedium: 'Fredoka_500Medium',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 30, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#264A74',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bar: {
    shadowColor: '#1F2937',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
} as const;
