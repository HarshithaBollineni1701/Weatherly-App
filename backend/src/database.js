import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.join(here, '..', 'weatherly.sqlite');
let db;

export async function initializeDatabase() {
  const SQL = await initSqlJs({ locateFile: file => path.join(here, '..', 'node_modules', 'sql.js', 'dist', file) });
  db = fs.existsSync(databasePath) ? new SQL.Database(fs.readFileSync(databasePath)) : new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS saved_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  persist();
}
function persist() { fs.writeFileSync(databasePath, Buffer.from(db.export())); }
export function allRequests() {
  const result = db.exec('SELECT id, location, start_date, end_date, notes, created_at FROM saved_requests ORDER BY id DESC');
  if (!result.length) return [];
  return result[0].values.map(([id, location, startDate, endDate, notes, createdAt]) => ({ id, location, startDate, endDate, notes, createdAt }));
}
export function createRequest(item) {
  const statement = db.prepare('INSERT INTO saved_requests (location, start_date, end_date, notes) VALUES (?, ?, ?, ?)');
  statement.run([item.location, item.startDate, item.endDate, item.notes || '']); statement.free(); persist();
  const idResult = db.exec('SELECT last_insert_rowid() AS id');
  return allRequests().find(row => row.id === idResult[0].values[0][0]);
}
export function updateRequest(id, item) {
  const statement = db.prepare('UPDATE saved_requests SET location = ?, start_date = ?, end_date = ?, notes = ? WHERE id = ?');
  statement.run([item.location, item.startDate, item.endDate, item.notes || '', Number(id)]); statement.free(); persist();
  return allRequests().find(row => row.id === Number(id)) || null;
}
export function removeRequest(id) {
  const statement = db.prepare('DELETE FROM saved_requests WHERE id = ?'); statement.run([Number(id)]); statement.free(); persist();
}
