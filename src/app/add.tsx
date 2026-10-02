import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { addDays, toISO } from "../utils";

type Child = { id: number; name: string; color: string };
const SUBJECTS = [
  "Maths",
  "Français",
  "Arabe",
  "Sciences",
  "Histoire",
  "Anglais",
  "Autre",
];

export default function Add() {
  const db = useSQLiteContext();
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState<number | null>(null);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [description, setDescription] = useState("");
  const [offset, setOffset] = useState(1);

  useEffect(() => {
    db.getAllAsync<Child>(
      "SELECT id, name, color FROM children ORDER BY id",
    ).then((c) => {
      setChildren(c);
      if (c.length > 0) setChildId(c[0].id);
    });
  }, [db]);

  const color = children.find((c) => c.id === childId)?.color ?? "#111827";

  async function save() {
    if (childId === null) return;
    await db.runAsync(
      "INSERT INTO homework (child_id, subject, description, due_date) VALUES (?, ?, ?, ?)",
      childId,
      subject,
      description.trim(),
      toISO(addDays(offset)),
    );
    router.back();
  }

  return (
    <ScrollView
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.label}>Pour qui ?</Text>
      <View style={s.wrap}>
        {children.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setChildId(c.id)}
            style={[s.chip, childId === c.id && { backgroundColor: c.color }]}
          >
            <Text style={[s.chipText, childId === c.id && { color: "#fff" }]}>
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Matière</Text>
      <View style={s.wrap}>
        {SUBJECTS.map((sub) => (
          <Pressable
            key={sub}
            onPress={() => setSubject(sub)}
            style={[s.chip, subject === sub && { backgroundColor: color }]}
          >
            <Text style={[s.chipText, subject === sub && { color: "#fff" }]}>
              {sub}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Pour quand ?</Text>
      <View style={s.row}>
        {[
          { n: 0, t: "Aujourd'hui" },
          { n: 1, t: "Demain" },
          { n: 2, t: "Après-demain" },
        ].map((o) => (
          <Pressable
            key={o.n}
            onPress={() => setOffset(o.n)}
            style={[
              s.chip,
              { flex: 1 },
              offset === o.n && { backgroundColor: color },
            ]}
          >
            <Text
              style={[
                s.chipText,
                { textAlign: "center" },
                offset === o.n && { color: "#fff" },
              ]}
            >
              {o.t}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Exercices p.42 (facultatif)"
        value={description}
        onChangeText={setDescription}
      />

      <Pressable style={s.button} onPress={save}>
        <Text style={s.buttonText}>Enregistrer</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  chipText: { fontSize: 17, fontWeight: "600", color: "#111827" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 6,
  },
  button: {
    backgroundColor: "#111827",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
