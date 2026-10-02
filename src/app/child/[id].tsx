import {
    router,
    Stack,
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { addDays, toISO } from "../../utils";

type Child = { id: number; name: string; grade: string; color: string };
type Grade = {
  id: number;
  subject: string;
  score: number;
  max_score: number;
  grade_date: string;
  note: string;
};
type Homework = {
  id: number;
  subject: string;
  description: string;
  due_date: string;
  done: number;
};
type Exam = {
  id: number;
  subject: string;
  chapters: string;
  exam_date: string;
  done: number;
};
type Lesson = { id: number; day: number; subject: string; time: string };
type Revision = {
  id: number;
  exam_id: number;
  review_date: string;
  content: string;
  done: number;
};

const SUBJECTS = [
  "Maths",
  "Français",
  "Arabe",
  "Sciences",
  "Histoire",
  "Anglais",
  "Autre",
];
const DATE_OPTIONS = [
  { n: 1, t: "Demain" },
  { n: 3, t: "Dans 3 jours" },
  { n: 7, t: "Dans 1 semaine" },
];
const DAYS = [
  { n: 1, t: "Lundi" },
  { n: 2, t: "Mardi" },
  { n: 3, t: "Mercredi" },
  { n: 4, t: "Jeudi" },
  { n: 5, t: "Vendredi" },
  { n: 6, t: "Samedi" },
];

function label(iso: string) {
  const today = toISO(new Date());
  const tomorrow = toISO(addDays(1));
  if (iso === today) return "Aujourd'hui";
  if (iso === tomorrow) return "Demain";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ChildPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [child, setChild] = useState<Child | null>(null);
  const [tab, setTab] = useState<"homework" | "exams" | "week" | "grades">(
    "homework",
  );

  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeSubject, setGradeSubject] = useState(SUBJECTS[0]);
  const [score, setScore] = useState("");
  const [gradeNote, setGradeNote] = useState("");

  const [items, setItems] = useState<Homework[]>([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [description, setDescription] = useState("");
  const [offset, setOffset] = useState(1);

  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubject, setExamSubject] = useState(SUBJECTS[0]);
  const [chapters, setChapters] = useState("");
  const [examOffset, setExamOffset] = useState(3);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonSubject, setLessonSubject] = useState(SUBJECTS[0]);
  const [lessonTime, setLessonTime] = useState("");
  const [lessonDay, setLessonDay] = useState(1);

  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [expandedExam, setExpandedExam] = useState<number | null>(null);

  const load = useCallback(async () => {
    const c = await db.getFirstAsync<Child>(
      "SELECT * FROM children WHERE id = ?",
      Number(id),
    );
    setChild(c ?? null);
    setItems(
      await db.getAllAsync<Homework>(
        "SELECT id, subject, description, due_date, done FROM homework WHERE child_id = ? ORDER BY done, due_date, id",
        Number(id),
      ),
    );
    setExams(
      await db.getAllAsync<Exam>(
        "SELECT id, subject, chapters, exam_date, done FROM exams WHERE child_id = ? ORDER BY done, exam_date, id",
        Number(id),
      ),
    );
    setLessons(
      await db.getAllAsync<Lesson>(
        "SELECT id, day, subject, time FROM lessons WHERE child_id = ? ORDER BY day, time, id",
        Number(id),
      ),
    );
    setGrades(
      await db.getAllAsync<Grade>(
        "SELECT id, subject, score, max_score, grade_date, note FROM grades WHERE child_id = ? ORDER BY grade_date DESC, id DESC",
        Number(id),
      ),
    );
    setRevisions(
      await db.getAllAsync<Revision>(
        "SELECT id, exam_id, review_date, content, done FROM revisions WHERE child_id = ? ORDER BY review_date, id",
        Number(id),
      ),
    );
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function add() {
    await db.runAsync(
      "INSERT INTO homework (child_id, subject, description, due_date) VALUES (?, ?, ?, ?)",
      Number(id),
      subject,
      description.trim(),
      toISO(addDays(offset)),
    );
    setDescription("");
    load();
  }

  async function toggle(h: Homework) {
    await db.runAsync(
      "UPDATE homework SET done = ? WHERE id = ?",
      h.done ? 0 : 1,
      h.id,
    );
    load();
  }

  async function remove(hid: number) {
    await db.runAsync("DELETE FROM homework WHERE id = ?", hid);
    load();
  }

  async function addExam() {
    await db.runAsync(
      "INSERT INTO exams (child_id, subject, chapters, exam_date) VALUES (?, ?, ?, ?)",
      Number(id),
      examSubject,
      chapters.trim(),
      toISO(addDays(examOffset)),
    );
    setChapters("");
    load();
  }

  async function toggleExam(e: Exam) {
    await db.runAsync(
      "UPDATE exams SET done = ? WHERE id = ?",
      e.done ? 0 : 1,
      e.id,
    );
    load();
  }

  async function removeExam(eid: number) {
    await db.runAsync("DELETE FROM exams WHERE id = ?", eid);
    load();
  }

  async function addLesson() {
    await db.runAsync(
      "INSERT INTO lessons (child_id, day, subject, time) VALUES (?, ?, ?, ?)",
      Number(id),
      lessonDay,
      lessonSubject,
      lessonTime.trim(),
    );
    setLessonTime("");
    load();
  }

  async function removeLesson(lid: number) {
    await db.runAsync("DELETE FROM lessons WHERE id = ?", lid);
    load();
  }

  async function addGrade() {
    const value = parseFloat(score.replace(",", "."));
    if (isNaN(value)) return;
    await db.runAsync(
      "INSERT INTO grades (child_id, subject, score, max_score, grade_date, note) VALUES (?, ?, ?, ?, ?, ?)",
      Number(id),
      gradeSubject,
      value,
      20,
      toISO(new Date()),
      gradeNote.trim(),
    );
    setScore("");
    setGradeNote("");
    load();
  }

  async function removeGrade(gid: number) {
    await db.runAsync("DELETE FROM grades WHERE id = ?", gid);
    load();
  }

  function average(subjectFilter?: string) {
    const list = subjectFilter
      ? grades.filter((g) => g.subject === subjectFilter)
      : grades;
    if (list.length === 0) return null;
    const sum = list.reduce((a, g) => a + (g.score / g.max_score) * 20, 0);
    return (sum / list.length).toFixed(1);
  }

  async function generatePlan(exam: Exam) {
    const examD = new Date(exam.exam_date);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    examD.setHours(0, 0, 0, 0);

    const daysAvailable = Math.max(
      1,
      Math.round((examD.getTime() - start.getTime()) / 86400000),
    );
    const sessionsCount = Math.min(5, daysAvailable);

    const chaptersList = exam.chapters
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (chaptersList.length === 0) chaptersList.push(`Réviser ${exam.subject}`);

    const groups: string[][] = Array.from({ length: sessionsCount }, () => []);
    chaptersList.forEach((c, i) => groups[i % sessionsCount].push(c));

    await db.runAsync("DELETE FROM revisions WHERE exam_id = ?", exam.id);

    for (let i = 0; i < sessionsCount; i++) {
      const dayOffset = Math.round(
        ((i + 1) * daysAvailable) / (sessionsCount + 1),
      );
      const d = new Date(start);
      d.setDate(d.getDate() + Math.max(0, dayOffset));
      await db.runAsync(
        "INSERT INTO revisions (exam_id, child_id, review_date, content) VALUES (?, ?, ?, ?)",
        exam.id,
        Number(id),
        toISO(d),
        groups[i].join(", "),
      );
    }
    setExpandedExam(exam.id);
    load();
  }

  async function toggleRevision(r: Revision) {
    await db.runAsync(
      "UPDATE revisions SET done = ? WHERE id = ?",
      r.done ? 0 : 1,
      r.id,
    );
    load();
  }

  const color = child?.color ?? "#111827";

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: child ? child.name : "Devoirs" }} />

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/child/kid/[id]",
            params: { id: Number(id) },
          })
        }
        style={[s.kidButton, { backgroundColor: color }]}
      >
        <Text style={s.kidButtonText}>👦 Mode enfant</Text>
      </Pressable>

      <View style={s.tabs}>
        <Pressable
          onPress={() => setTab("homework")}
          style={[
            s.tab,
            tab === "homework" && {
              borderBottomColor: color,
              borderBottomWidth: 3,
            },
          ]}
        >
          <Text
            style={[
              s.tabText,
              tab === "homework" && { color, fontWeight: "800" },
            ]}
          >
            📚 Devoirs
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("exams")}
          style={[
            s.tab,
            tab === "exams" && {
              borderBottomColor: color,
              borderBottomWidth: 3,
            },
          ]}
        >
          <Text
            style={[s.tabText, tab === "exams" && { color, fontWeight: "800" }]}
          >
            📝 Examens
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("week")}
          style={[
            s.tab,
            tab === "week" && {
              borderBottomColor: color,
              borderBottomWidth: 3,
            },
          ]}
        >
          <Text
            style={[s.tabText, tab === "week" && { color, fontWeight: "800" }]}
          >
            📅 Semaine
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("grades")}
          style={[
            s.tab,
            tab === "grades" && {
              borderBottomColor: color,
              borderBottomWidth: 3,
            },
          ]}
        >
          <Text
            style={[
              s.tabText,
              tab === "grades" && { color, fontWeight: "800" },
            ]}
          >
            📊 Notes
          </Text>
        </Pressable>
      </View>

      {tab === "homework" ? (
        <>
          <FlatList
            data={items}
            keyExtractor={(h) => String(h.id)}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={s.empty}>Aucun devoir 🎉</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => toggle(item)}
                style={[
                  s.card,
                  { borderLeftColor: color },
                  item.done === 1 && s.cardDone,
                ]}
              >
                <Text style={s.check}>{item.done ? "☑" : "☐"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.subject, item.done === 1 && s.strike]}>
                    {item.subject}
                  </Text>
                  {item.description ? (
                    <Text style={[s.desc, item.done === 1 && s.strike]}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={s.date}>Pour : {label(item.due_date)}</Text>
                </View>
                <Pressable onPress={() => remove(item.id)} hitSlop={12}>
                  <Text style={s.del}>🗑️</Text>
                </Pressable>
              </Pressable>
            )}
          />
          <View style={s.form}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {SUBJECTS.map((sub) => (
                <Pressable
                  key={sub}
                  onPress={() => setSubject(sub)}
                  style={[
                    s.chip,
                    subject === sub && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[s.chipText, subject === sub && { color: "#fff" }]}
                  >
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={s.input}
              placeholder="Exercices p.42 (facultatif)"
              value={description}
              onChangeText={setDescription}
            />
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
            <Pressable style={s.button} onPress={add}>
              <Text style={s.buttonText}>Enregistrer le devoir</Text>
            </Pressable>
          </View>
        </>
      ) : tab === "exams" ? (
        <>
          <FlatList
            data={exams}
            keyExtractor={(e) => String(e.id)}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <Text style={s.empty}>Aucun examen prévu 🎉</Text>
            }
            renderItem={({ item }) => {
              const plan = revisions.filter((r) => r.exam_id === item.id);
              const expanded = expandedExam === item.id;
              return (
                <View style={{ marginBottom: 10 }}>
                  <Pressable
                    onPress={() => toggleExam(item)}
                    style={[
                      s.card,
                      { borderLeftColor: color, marginBottom: 0 },
                      item.done === 1 && s.cardDone,
                    ]}
                  >
                    <Text style={s.check}>{item.done ? "✅" : "📝"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.subject, item.done === 1 && s.strike]}>
                        {item.subject}
                      </Text>
                      {item.chapters ? (
                        <Text style={[s.desc, item.done === 1 && s.strike]}>
                          Réviser : {item.chapters}
                        </Text>
                      ) : null}
                      <Text style={s.date}>{label(item.exam_date)}</Text>
                    </View>
                    <Pressable onPress={() => removeExam(item.id)} hitSlop={12}>
                      <Text style={s.del}>🗑️</Text>
                    </Pressable>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      plan.length > 0
                        ? setExpandedExam(expanded ? null : item.id)
                        : generatePlan(item)
                    }
                    style={s.planLink}
                  >
                    <Text style={[s.planLinkText, { color }]}>
                      {plan.length > 0
                        ? expanded
                          ? "▲ Masquer le planning"
                          : `▼ Voir le planning (${plan.length})`
                        : "📅 Générer un planning de révision"}
                    </Text>
                  </Pressable>

                  {expanded &&
                    plan.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => toggleRevision(r)}
                        style={[s.revCard, r.done === 1 && s.cardDone]}
                      >
                        <Text style={s.check}>{r.done ? "☑" : "☐"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.revDate, r.done === 1 && s.strike]}>
                            {label(r.review_date)}
                          </Text>
                          <Text style={[s.desc, r.done === 1 && s.strike]}>
                            {r.content}
                          </Text>
                        </View>
                      </Pressable>
                    ))}

                  {plan.length > 0 && expanded && (
                    <Pressable
                      onPress={() => generatePlan(item)}
                      style={s.regenLink}
                    >
                      <Text style={s.regenText}>🔄 Refaire le planning</Text>
                    </Pressable>
                  )}
                </View>
              );
            }}
          />
          <View style={s.form}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {SUBJECTS.map((sub) => (
                <Pressable
                  key={sub}
                  onPress={() => setExamSubject(sub)}
                  style={[
                    s.chip,
                    examSubject === sub && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      examSubject === sub && { color: "#fff" },
                    ]}
                  >
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={s.input}
              placeholder="Chapitres séparés par des virgules"
              value={chapters}
              onChangeText={setChapters}
            />
            <View style={s.row}>
              {DATE_OPTIONS.map((o) => (
                <Pressable
                  key={o.n}
                  onPress={() => setExamOffset(o.n)}
                  style={[
                    s.chip,
                    { flex: 1 },
                    examOffset === o.n && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      { textAlign: "center" },
                      examOffset === o.n && { color: "#fff" },
                    ]}
                  >
                    {o.t}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={s.button} onPress={addExam}>
              <Text style={s.buttonText}>Enregistrer l'examen</Text>
            </Pressable>
          </View>
        </>
      ) : tab === "week" ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            {DAYS.map((d) => {
              const dayLessons = lessons.filter((l) => l.day === d.n);
              return (
                <View key={d.n} style={{ marginBottom: 16 }}>
                  <Text style={[s.dayTitle, { color }]}>{d.t}</Text>
                  {dayLessons.length === 0 ? (
                    <Text style={s.noLesson}>Pas de cours</Text>
                  ) : (
                    dayLessons.map((l) => (
                      <View
                        key={l.id}
                        style={[s.card, { borderLeftColor: color }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={s.subject}>{l.subject}</Text>
                          {l.time ? <Text style={s.desc}>{l.time}</Text> : null}
                        </View>
                        <Pressable
                          onPress={() => removeLesson(l.id)}
                          hitSlop={12}
                        >
                          <Text style={s.del}>🗑️</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </ScrollView>
          <View style={s.form}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {DAYS.map((d) => (
                <Pressable
                  key={d.n}
                  onPress={() => setLessonDay(d.n)}
                  style={[
                    s.chip,
                    lessonDay === d.n && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[s.chipText, lessonDay === d.n && { color: "#fff" }]}
                  >
                    {d.t}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {SUBJECTS.map((sub) => (
                <Pressable
                  key={sub}
                  onPress={() => setLessonSubject(sub)}
                  style={[
                    s.chip,
                    lessonSubject === sub && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      lessonSubject === sub && { color: "#fff" },
                    ]}
                  >
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={s.input}
              placeholder="Heure (ex : 8h - 9h, facultatif)"
              value={lessonTime}
              onChangeText={setLessonTime}
            />
            <Pressable style={s.button} onPress={addLesson}>
              <Text style={s.buttonText}>Ajouter au planning</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            <View style={s.avgBox}>
              <Text style={s.avgLabel}>Moyenne générale</Text>
              <Text style={[s.avgValue, { color }]}>
                {average() ?? "—"} / 20
              </Text>
            </View>

            {SUBJECTS.filter((sub) =>
              grades.some((g) => g.subject === sub),
            ).map((sub) => (
              <View key={sub} style={{ marginBottom: 16 }}>
                <View style={s.subjectRow}>
                  <Text style={s.dayTitle}>{sub}</Text>
                  <Text style={[s.subjectAvg, { color }]}>
                    Moy. {average(sub)} / 20
                  </Text>
                </View>
                {grades
                  .filter((g) => g.subject === sub)
                  .map((g) => (
                    <View
                      key={g.id}
                      style={[s.card, { borderLeftColor: color }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.subject}>
                          {g.score} / {g.max_score}
                        </Text>
                        {g.note ? <Text style={s.desc}>{g.note}</Text> : null}
                        <Text style={s.date}>{label(g.grade_date)}</Text>
                      </View>
                      <Pressable onPress={() => removeGrade(g.id)} hitSlop={12}>
                        <Text style={s.del}>🗑️</Text>
                      </Pressable>
                    </View>
                  ))}
              </View>
            ))}

            {grades.length === 0 && (
              <Text style={s.empty}>Aucune note enregistrée</Text>
            )}
          </ScrollView>

          <View style={s.form}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {SUBJECTS.map((sub) => (
                <Pressable
                  key={sub}
                  onPress={() => setGradeSubject(sub)}
                  style={[
                    s.chip,
                    gradeSubject === sub && { backgroundColor: color },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      gradeSubject === sub && { color: "#fff" },
                    ]}
                  >
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={s.row}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Note (ex : 14.5)"
                value={score}
                onChangeText={setScore}
                keyboardType="decimal-pad"
              />
            </View>
            <TextInput
              style={s.input}
              placeholder="Remarque (facultatif)"
              value={gradeNote}
              onChangeText={setGradeNote}
            />
            <Pressable style={s.button} onPress={addGrade}>
              <Text style={s.buttonText}>Enregistrer la note</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", paddingTop: 6 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 15, color: "#6B7280" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 18, color: "#6B7280" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 8,
  },
  cardDone: { opacity: 0.5 },
  check: { fontSize: 26 },
  subject: { fontSize: 18, fontWeight: "700" },
  desc: { fontSize: 16, color: "#374151" },
  date: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  strike: { textDecorationLine: "line-through" },
  del: { fontSize: 22 },
  form: { padding: 16, paddingTop: 10, gap: 10 },
  chip: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: { flexDirection: "row", gap: 8 },
  button: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  dayTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  noLesson: { fontSize: 15, color: "#9CA3AF", fontStyle: "italic" },
  avgBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  avgLabel: { fontSize: 14, color: "#6B7280" },
  avgValue: { fontSize: 32, fontWeight: "800", marginTop: 4 },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subjectAvg: { fontSize: 14, fontWeight: "700" },
  planLink: { paddingVertical: 8, paddingLeft: 4 },
  planLinkText: { fontSize: 14, fontWeight: "700" },
  revCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    marginLeft: 12,
  },
  kidButton: {
    margin: 12,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  kidButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  revDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textTransform: "capitalize",
  },
  regenLink: { alignSelf: "flex-start", marginLeft: 12, marginBottom: 4 },
  regenText: { fontSize: 13, color: "#9CA3AF" },
});
