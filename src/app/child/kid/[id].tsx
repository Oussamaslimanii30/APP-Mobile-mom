import {
    Stack,
    router,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { addDays, toISO } from "../../../utils";

type Child = { id: number; name: string; color: string };
type Homework = {
  id: number;
  subject: string;
  description: string;
  due_date: string;
  done: number;
};

export default function KidMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [child, setChild] = useState<Child | null>(null);
  const [items, setItems] = useState<Homework[]>([]);

  const load = useCallback(async () => {
    const c = await db.getFirstAsync<Child>(
      "SELECT id, name, color FROM children WHERE id = ?",
      Number(id),
    );
    setChild(c ?? null);
    setItems(
      await db.getAllAsync<Homework>(
        "SELECT id, subject, description, due_date, done FROM homework WHERE child_id = ? AND due_date <= ? ORDER BY done, due_date, id",
        Number(id),
        toISO(addDays(1)),
      ),
    );
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggle(h: Homework) {
    await db.runAsync(
      "UPDATE homework SET done = ? WHERE id = ?",
      h.done ? 0 : 1,
      h.id,
    );
    load();
  }

  const color = child?.color ?? "#111827";
  const remaining = items.filter((i) => i.done === 0).length;

  return (
    <View style={[s.container, { backgroundColor: color }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.header}>
        <Text style={s.hello}>Salut {child?.name} ! 👋</Text>
        <Text style={s.sub}>
          {remaining === 0
            ? "Tout est fait, bravo ! 🎉"
            : `${remaining} chose${remaining > 1 ? "s" : ""} à faire`}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(h) => String(h.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={s.empty}>Rien à faire, profite ! 🎉</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggle(item)}
            style={[s.card, item.done === 1 && s.cardDone]}
          >
            <Text style={s.bigCheck}>{item.done ? "✅" : "⬜"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.subject, item.done === 1 && s.strike]}>
                {item.subject}
              </Text>
              {item.description ? (
                <Text style={[s.desc, item.done === 1 && s.strike]}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      <Pressable style={s.exit} onPress={() => router.back()}>
        <Text style={s.exitText}>← Retour</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 20 },
  hello: { fontSize: 28, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 18, color: "#fff", opacity: 0.9, marginTop: 4 },
  empty: {
    textAlign: "center",
    marginTop: 60,
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
  },
  cardDone: { opacity: 0.5 },
  bigCheck: { fontSize: 36 },
  subject: { fontSize: 22, fontWeight: "800" },
  desc: { fontSize: 17, color: "#374151", marginTop: 2 },
  strike: { textDecorationLine: "line-through" },
  exit: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  exitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
