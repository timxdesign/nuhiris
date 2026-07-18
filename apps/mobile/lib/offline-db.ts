import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('nuhiris.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT UNIQUE NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      body TEXT,
      sequence_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cached_patients (
      nuhi TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      sex TEXT NOT NULL,
      state TEXT NOT NULL,
      phone TEXT,
      data_json TEXT NOT NULL,
      cached_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cached_encounters (
      encounter_id TEXT PRIMARY KEY,
      nuhi TEXT NOT NULL,
      encounter_type TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      date_time TEXT NOT NULL,
      data_json TEXT NOT NULL,
      cached_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status);
    CREATE INDEX IF NOT EXISTS idx_cached_encounters_nuhi ON cached_encounters (nuhi);
  `);
}

let sequenceCounter = 0;

export async function enqueueSync(
  method: string,
  path: string,
  body: unknown,
  idempotencyKey: string,
): Promise<void> {
  const database = await getDb();
  sequenceCounter += 1;
  await database.runAsync(
    `INSERT OR IGNORE INTO sync_queue (idempotency_key, method, path, body, sequence_number)
     VALUES (?, ?, ?, ?, ?)`,
    [idempotencyKey, method, path, body ? JSON.stringify(body) : null, sequenceCounter],
  );
}

export async function getPendingQueue(): Promise<Array<{
  id: number;
  idempotencyKey: string;
  method: string;
  path: string;
  body: string | null;
  sequenceNumber: number;
}>> {
  const database = await getDb();
  return database.getAllAsync(
    `SELECT id, idempotency_key as idempotencyKey, method, path, body, sequence_number as sequenceNumber
     FROM sync_queue
     WHERE status = 'pending'
     ORDER BY sequence_number ASC`,
  );
}

export async function markSynced(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE sync_queue SET status = 'synced', synced_at = datetime('now') WHERE id = ?`,
    [id],
  );
}

export async function markFailed(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?`,
    [id],
  );
}

export async function cachePatient(patient: {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
  phone: string | null;
}): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_patients (nuhi, full_name, date_of_birth, sex, state, phone, data_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patient.nuhi, patient.fullName, patient.dateOfBirth, patient.sex, patient.state, patient.phone, JSON.stringify(patient)],
  );
}

export async function searchCachedPatients(query: string): Promise<Array<{
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
}>> {
  const database = await getDb();
  return database.getAllAsync(
    `SELECT nuhi, full_name as fullName, date_of_birth as dateOfBirth, sex, state
     FROM cached_patients
     WHERE full_name LIKE ? OR nuhi LIKE ?
     LIMIT 50`,
    [`%${query}%`, `%${query}%`],
  );
}
