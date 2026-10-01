import { useColorScheme } from 'react-native';

const palette = {
  light: { bg: '#FFFFFF', surface: '#F4F6F4', text: '#111511', muted: '#5E6A5E', border: '#DCE2DC', primary: '#2F6B3A', onPrimary: '#FFFFFF', danger: '#B3261E' },
  dark: { bg: '#0E120F', surface: '#18201A', text: '#EEF2EE', muted: '#9AA79B', border: '#2A342C', primary: '#7FC08A', onPrimary: '#0E120F', danger: '#F2B8B5' },
};

export type Colors = typeof palette.light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 20 };
