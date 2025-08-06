import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    secondary: '#FF9800',
    tertiary: '#4CAF50',
    error: '#F44336',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    onSurface: '#333333',
    surfaceVariant: '#E0E0E0',
    // 커스텀 색상
    critical: '#D32F2F',
    warning: '#FFA000',
    success: '#388E3C',
    info: '#1976D2',
  },
};

export const darkTheme = {
  ...theme,
  dark: true,
  colors: {
    ...theme.colors,
    background: '#121212',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    surfaceVariant: '#2C2C2C',
  },
};