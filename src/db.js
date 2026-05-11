const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const dbPath = path.join(__dirname, "..", "data", "lab.sqlite");

function schemaAndSeed(db) {
  db.exec(`
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL
    );
  `);
  db.run("INSERT INTO users (username, password, role) VALUES ('alice', 'alice123', 'user');");
  db.run("INSERT INTO users (username, password, role) VALUES ('bob', 'bob123', 'user');");
  db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin_secret_2026', 'admin');");
  db.run("INSERT INTO products (name, category, price) VALUES ('Notebook', 'stationery', 4.5);");
  db.run("INSERT INTO products (name, category, price) VALUES ('Ballpoint pen', 'stationery', 1.2);");
  db.run("INSERT INTO products (name, category, price) VALUES ('Desk lamp', 'furniture', 29.99);");
  db.run("INSERT INTO products (name, category, price) VALUES ('Office chair', 'furniture', 199.0);");
  db.run("INSERT INTO products (name, category, price) VALUES ('SQL guide book', 'books', 39.0);");
}

function saveDatabase(db) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function getOneBound(db, sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const ok = stmt.step();
  const row = ok ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function getAllBound(db, sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function getOneRaw(db, sql) {
  const stmt = db.prepare(sql);
  const ok = stmt.step();
  const row = ok ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function getAllRaw(db, sql) {
  const stmt = db.prepare(sql);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function openDatabase() {
  const wasmPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );
  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  let db;
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)));
  } else {
    db = new SQL.Database();
    schemaAndSeed(db);
    saveDatabase(db);
  }

  return {
    db,
    dbPath,
    save: () => saveDatabase(db),
    getOneBound,
    getAllBound,
    getOneRaw,
    getAllRaw,
  };
}

async function initDbCli() {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  const { db, save } = await openDatabase();
  save();
  db.close();
  console.log("Database initialized:", dbPath);
}

if (require.main === module) {
  initDbCli().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { openDatabase, dbPath, schemaAndSeed, saveDatabase };
