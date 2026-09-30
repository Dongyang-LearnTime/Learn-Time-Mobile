import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/themeStore';

export const lightColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F9',
  primary: '#5B50E6',
  primaryDark: '#4338CA',
  primarySoft: '#EFEEFF',
  text: '#171A2B',
  muted: '#697084',
  border: '#E6E8F0',
  danger: '#D92D20',
  success: '#067647',
  warning: '#B54708',
  successSoft: '#ECFDF3',
  successSolid: '#067647',
  dangerSoft: '#FEF3F2',
  warningSoft: '#FFFAEB',
  warningBorder: '#FEDF89',
  onPrimary: '#FFFFFF',
} as const;

export type ThemeColors = { [Key in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#10121C', surface: '#1B1E2D', surfaceMuted: '#272B3E',
  primary: '#A99FFF', primaryDark: '#6555D9', primarySoft: '#302A50',
  text: '#F3F4FA', muted: '#ADB4C9', border: '#3B4158',
  danger: '#FF9A91', success: '#73D9AB', warning: '#F5C56C',
  successSoft: '#193C31', successSolid: '#067647', dangerSoft: '#432724',
  warningSoft: '#3D3220', warningBorder: '#796238', onPrimary: '#FFFFFF',
};

export function useTheme() {
  const system = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark, mode };
}

export const layout = {
  screenPadding: 20,
  compactScreenPadding: 16,
  maxContentWidth: 720,
  cardRadius: 20,
} as const;

export const shadows = {
  card: {
    shadowColor: '#171A2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;
