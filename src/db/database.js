/**
 * database.js — Simple JSON file-based database.
 *
 * No native compilation needed. Data persists to db.json on disk.
 * In production swap this for PostgreSQL/MySQL — only this file changes.
 *
 * Collections:
 *   employees, trusted_routers, attendance_records, otp_codes
 */
const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'db.json');

// ── Default empty schema ───────────────────────────────────────────────────
const DEFAULT_DB = {
  employees:          [],
  trusted_routers:    [],
  attendance_records: [],
  otp_codes:          [],
};

// ── Load / save ────────────────────────────────────────────────────────────
function load() {
  if (!fs.existsSync(DB_FILE)) return JSON.parse(JSON.stringify(DEFAULT_DB));
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Public helpers ─────────────────────────────────────────────────────────

function getCollection(name) {
  return load()[name] || [];
}

function findOne(collection, predicate) {
  return getCollection(collection).find(predicate) || null;
}

function findMany(collection, predicate) {
  const all = getCollection(collection);
  return predicate ? all.filter(predicate) : all;
}

function insert(collection, doc) {
  const db = load();
  if (!db[collection]) db[collection] = [];
  db[collection].push(doc);
  save(db);
  return doc;
}

function upsert(collection, predicate, doc) {
  const db = load();
  if (!db[collection]) db[collection] = [];
  const idx = db[collection].findIndex(predicate);
  if (idx >= 0) {
    db[collection][idx] = { ...db[collection][idx], ...doc };
    save(db);
    return db[collection][idx];
  }
  db[collection].push(doc);
  save(db);
  return doc;
}

function update(collection, predicate, patch) {
  const db = load();
  if (!db[collection]) return null;
  let updated = null;
  db[collection] = db[collection].map(item => {
    if (predicate(item)) {
      updated = { ...item, ...patch };
      return updated;
    }
    return item;
  });
  save(db);
  return updated;
}

function remove(collection, predicate) {
  const db = load();
  if (!db[collection]) return;
  db[collection] = db[collection].filter(item => !predicate(item));
  save(db);
}

function count(collection, predicate) {
  return findMany(collection, predicate).length;
}

module.exports = { getCollection, findOne, findMany, insert, upsert, update, remove, count, load, save };
