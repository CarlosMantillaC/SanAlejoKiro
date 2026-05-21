import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { initializeDatabase } from '../src/db/schema';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="san-alejo.db" onInit={initializeDatabase}>
      <Stack />
    </SQLiteProvider>
  );
}
