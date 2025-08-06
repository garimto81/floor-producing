import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store/store';
import MainNavigator from './src/navigation/MainNavigator';
import { theme } from './src/theme/theme';

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer>
            <MainNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}