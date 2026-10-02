import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { initDb } from "../db";
import { ensureEveningReminder } from "../notifications";

export default function Layout() {
  useEffect(() => {
    ensureEveningReminder(20, 0); // 20h00 par défaut
  }, []);

  return (
    <SQLiteProvider databaseName="etudes_v4.db" onInit={initDb}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Pour demain 📚" }} />
        <Stack.Screen name="children" options={{ title: "Mes enfants" }} />
        <Stack.Screen
          name="add"
          options={{ title: "Ajouter un devoir", presentation: "modal" }}
        />
        <Stack.Screen name="child/[id]" options={{ title: "Devoirs" }} />
      </Stack>
    </SQLiteProvider>
  );
}
