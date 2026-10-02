import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { addDays, toISO } from "../utils";

type Row = {
  id: number;
  subject: string;
  description: string;
  due_date: string;
  name: string;
  color: string;
};
type ExamAlert = {
  id: number;
  subject: string;
  exam_date: string;
  name: string;
  color: string;
};

function label(iso: string) {
  const today = toISO(new Date());
  const tomorrow = toISO(addDays(1));
  if (iso === today) return "aujourd'hui";
  if (iso === tomorrow) return "demain";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function Home() {
  const db = useSQLiteContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [childCount, setChildCount] = useState(0);
  const [exams, setExams] = useState<ExamAlert[]>([]);

  const load = useCallback(async () => {
    const n = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM children",
    );
    setChildCount(n?.n ?? 0);
    setRows(
      await db.getAllAsync<Row>(
        `SELECT h.id, h.subject, h.description, h.due_date, c.name, c.color
         FROM homework h JOIN children c ON c.id = h.child_id
         WHERE h.done = 0 AND h.due_date <= ?
         ORDER BY h.due_date, c.name, h.id`,
        toISO(addDays(1)),
      ),
    );
    setExams(
      await db.getAllAsync<ExamAlert>(
        `SELECT e.id, e.subject, e.exam_date, c.name, c.color
         FROM exams e JOIN children c ON c.id = e.child_id
         WHERE e.done = 0 AND e.exam_date <= ?
         ORDER BY e.exam_date`,
        toISO(addDays(3)),
      ),
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function check(id: number) {
    await db.runAsync("UPDATE homework SET done = 1 WHERE id = ?", id);
    load();
  }

  const today = toISO(new Date());
  const tomorrow = toISO(addDays(1));
  const sections = [
    {
      title: "En retard",
      icon: "alert-circle" as const,
      color: theme.colors.danger,
      data: rows.filter((r) => r.due_date < today),
    },
    {
      title: "Aujourd'hui",
      icon: "today" as const,
      color: theme.colors.warning,
      data: rows.filter((r) => r.due_date === today),
    },
    {
      title: "Pour demain",
      icon: "moon" as const,
      color: theme.colors.primary,
      data: rows.filter((r) => r.due_date === tomorrow),
    },
  ];

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={s.greeting}>Bonjour 👋</Text>
        <Text style={s.dateText}>
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        {exams.length > 0 && (
          <View style={s.examBox}>
            {exams.map((e) => (
              <View key={e.id} style={s.examRow}>
                <Ionicons
                  name="warning"
                  size={18}
                  color={theme.colors.warning}
                />
                <Text style={s.examText}>
                  {e.name} · {e.subject} · {label(e.exam_date)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {childCount === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="people" size={48} color={theme.colors.textMuted} />
            <Text style={s.emptyText}>Commençons par ajouter un enfant</Text>
            <Pressable
              style={s.button}
              onPress={() => router.push("/children" as any)}
            >
              <Text style={s.buttonText}>Ajouter un enfant</Text>
            </Pressable>
          </View>
        ) : rows.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={theme.colors.success}
            />
            <Text style={s.allDone}>
              Tout est fait !{"\n"}Rien à faire pour demain.
            </Text>
          </View>
        ) : (
          sections.map((sec) =>
            sec.data.length === 0 ? null : (
              <View key={sec.title} style={{ marginBottom: 22 }}>
                <View style={s.sectionHeader}>
                  <Ionicons name={sec.icon} size={18} color={sec.color} />
                  <Text style={[s.sectionTitle, { color: sec.color }]}>
                    {sec.title}
                  </Text>
                </View>
                {sec.data.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => check(r.id)}
                    style={s.card}
                  >
                    <View style={[s.dot, { backgroundColor: r.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.child}>{r.name}</Text>
                      <Text style={s.subject}>
                        {r.subject}
                        {r.description ? ` · ${r.description}` : ""}
                      </Text>
                    </View>
                    <Ionicons
                      name="ellipse-outline"
                      size={26}
                      color={theme.colors.border}
                    />
                  </Pressable>
                ))}
              </View>
            ),
          )
        )}

        <Pressable
          onPress={() => router.push("/children" as any)}
          style={s.link}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={s.linkText}>Gérer les enfants</Text>
        </Pressable>
      </ScrollView>

      {childCount > 0 && (
        <Pressable style={s.fab} onPress={() => router.push("/add" as any)}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  greeting: { fontSize: 26, fontWeight: "800", color: theme.colors.text },
  dateText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 18,
    textTransform: "capitalize",
  },
  examBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  examRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  examText: { fontSize: 14, fontWeight: "600", color: "#92400E", flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    ...theme.shadow,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  child: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subject: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: 2,
  },
  allDone: {
    textAlign: "center",
    fontSize: 18,
    color: theme.colors.text,
    lineHeight: 26,
    marginTop: 12,
  },
  emptyBox: { alignItems: "center", marginTop: 60, gap: 14 },
  emptyText: { fontSize: 17, color: theme.colors.textMuted },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 26,
    borderRadius: theme.radius.lg,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
  },
  linkText: { fontSize: 15, color: theme.colors.primary, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 34,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
