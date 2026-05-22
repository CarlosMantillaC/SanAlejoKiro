import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { initializeDatabase } from '../src/db/schema';
import { Colors, Typography } from '../src/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="san-alejo.db" onInit={initializeDatabase}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bgSurface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontWeight: Typography.semibold,
            fontSize: Typography.md,
          },
          contentStyle: { backgroundColor: Colors.bgBase },
          headerShadowVisible: false,
        }}
      />
    </SQLiteProvider>
  );
}
