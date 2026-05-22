import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeDatabase } from '../src/db/schema';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { Typography } from '../src/theme';

function AppNavigator() {
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgSurface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: Typography.semibold,
            fontSize: Typography.md,
          },
          contentStyle: { backgroundColor: colors.bgBase },
          headerShadowVisible: false,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Suspense fallback={<View><ActivityIndicator /></View>}>
          <SQLiteProvider
            databaseName="san-alejo.db"
            onInit={initializeDatabase}
            useSuspense
          >
            <AppNavigator />
          </SQLiteProvider>
        </Suspense>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
