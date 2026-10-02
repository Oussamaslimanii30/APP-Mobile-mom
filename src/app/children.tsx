import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Child = { id: number; name: string; grade: string; color: string };
const COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

export default function Children() {
  const db = useSQLiteContext();
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const load = useCallback(async () => {
    setChildren(
      await db.getAllAsync<Child>("SELECT * FROM children ORDER BY id"),
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function add() {
    if (!name.trim() || !grade.trim()) return;
    await db.runAsync(
      "INSERT INTO children (name, grade, color) VALUES (?, ?, ?)",
      name.trim(),
      grade.trim(),
      color,
    );
    setName("");
    setGrade("");
    load();
  }

  async function remove(id: number) {
    await db.runAsync("DELETE FROM children WHERE id = ?", id);
    load();
  }

  return (
    <View style={s.container}>
      <FlatList
        data={children}
        keyExtractor={(c) => String(c.id)}
        ListEmptyComponent={
          <Text style={s.empty}>Ajoutez votre premier enfant 👇</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/child/[id]", params: { id: item.id } })
            }
            style={[s.card, { borderLeftColor: item.color }]}
          >
            <View>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.grade}>{item.grade}</Text>
            </View>
            <Pressable onPress={() => remove(item.id)} hitSlop={12}>
              <Text style={s.del}>🗑️</Text>
            </Pressable>
          </Pressable>
        )}
      />

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Prénom"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={s.input}
          placeholder="Classe (ex : 5e année)"
          value={grade}
          onChangeText={setGrade}
        />
        <View style={s.colors}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                s.dot,
                { backgroundColor: c },
                color === c && s.dotActive,
              ]}
            />
          ))}
        </View>
        <Pressable style={s.button} onPress={add}>
          <Text style={s.buttonText}>Ajouter l'enfant</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 18, color: "#6B7280" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 8,
  },
  name: { fontSize: 20, fontWeight: "700" },
  grade: { fontSize: 16, color: "#6B7280" },
  del: { fontSize: 22 },
  form: { paddingTop: 12, gap: 10 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  colors: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  dot: { width: 40, height: 40, borderRadius: 20 },
  dotActive: { borderWidth: 4, borderColor: "#111827" },
  button: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
