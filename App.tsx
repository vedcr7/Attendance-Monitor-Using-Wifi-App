import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initTrustedRouters } from './src/config/trustedRouters';
import { AppNavigator } from './src/navigation/AppNavigator';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3F51B5',
    secondary: '#5C6BC0',
    surface: '#FFFFFF',
    background: '#F0F2FF',
  },
};

export default function App() {
  // Load user-managed trusted routers from storage into memory cache
  useEffect(() => { initTrustedRouters(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
