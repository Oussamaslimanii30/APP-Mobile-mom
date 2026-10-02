import { SQLiteDatabase } from "expo-sqlite";

export async function initDb(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      color TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      chapters TEXT NOT NULL DEFAULT '',
      exam_date TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      day INTEGER NOT NULL,
      subject TEXT NOT NULL,
      time TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      score REAL NOT NULL,
      max_score REAL NOT NULL DEFAULT 20,
      grade_date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      child_id INTEGER NOT NULL,
      review_date TEXT NOT NULL,
      content TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    );
  `);
}
