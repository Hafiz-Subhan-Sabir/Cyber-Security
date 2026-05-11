/**
 * Intentional dual-stack demo: legacy vs hardened SQL handling.
 * Listen on 127.0.0.1 only; do not expose legacy routes publicly.
 */
const path = require("path");
const express = require("express");
const { openDatabase } = require("./db");

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attrEsc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function qs(route, params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `${route}?${q}` : route;
}

function siteALoginPayloadAside() {
  const rows = [
    {
      title: "OR tautology (classic)",
      desc: "Both fields break out of the string literals so the predicate becomes true.",
      user: "' OR '1'='1",
      pass: "' OR '1'='1",
    },
    {
      title: "Comment out password check",
      desc: "Ends username string, targets admin if present; `--` comments the rest of the line (trailing space after `--`).",
      user: "admin' -- ",
      pass: "x",
    },
    {
      title: "OR true + line comment",
      desc: "Username side becomes always true; remainder of line commented.",
      user: "' OR 1=1-- ",
      pass: "anything",
    },
  ];

  const blocks = rows
    .map(
      (r) => `
    <div class="payload-row">
      <h3>${escHtml(r.title)}</h3>
      <p>${escHtml(r.desc)}</p>
      <div class="mono">Username: ${escHtml(r.user)}\nPassword: ${escHtml(r.pass)}</div>
      <div class="payload-actions">
        <button type="button" class="btn-ghost btn-fill" data-fill-user="${attrEsc(r.user)}" data-fill-pass="${attrEsc(r.pass)}">Fill form</button>
        <button type="button" class="btn-ghost" data-copy="${attrEsc(`Username: ${r.user} | Password: ${r.pass}`)}">Copy pair</button>
      </div>
    </div>`
    )
    .join("");

  return `
  <aside class="panel panel--glass" aria-label="Assessment reference">
    <h2>Site A · staged inputs</h2>
    ${blocks}
  </aside>`;
}

function siteACatalogPayloadAside() {
  const u1 = qs("/insecure/catalog", {
    q: "' OR 1=1 OR name LIKE '",
    category: "",
    sort: "name",
  });
  const u2 = qs("/insecure/catalog", {
    q: "",
    category: "books' OR 1=1-- ",
    sort: "name",
  });
  const u3 = qs("/insecure/catalog", { q: "Notebook", category: "", sort: "price DESC" });
  const u4 = qs("/insecure/catalog", { q: "", category: "furniture", sort: "name, price" });
  const u5 = qs("/insecure/catalog", { q: "x", category: "", sort: "name));" });

  return `
  <aside class="panel panel--glass" aria-label="Assessment reference">
    <h2>Site A · staged requests</h2>

    <div class="payload-row">
      <h3>Bypass search (OR inside LIKE)</h3>
      <p>Breaks out of the LIKE pattern so every product row can match.</p>
      <div class="mono">${escHtml(u1)}</div>
      <div class="payload-actions">
        <a class="btn-ghost btn-fill" href="${escHtml(u1)}">Open</a>
        <button type="button" class="btn-ghost" data-copy="${attrEsc(u1)}">Copy URL</button>
      </div>
    </div>

    <div class="payload-row">
      <h3>Bypass category filter</h3>
      <p>Tampered <code>category</code> parameter (not limited to the dropdown values).</p>
      <div class="mono">${escHtml(u2)}</div>
      <div class="payload-actions">
        <a class="btn-ghost btn-fill" href="${escHtml(u2)}">Open</a>
        <button type="button" class="btn-ghost" data-copy="${attrEsc(u2)}">Copy URL</button>
      </div>
    </div>

    <div class="payload-row">
      <h3>ORDER BY injection (sorting)</h3>
      <p>Extra SQL appended after <code>ORDER BY</code> on Site A.</p>
      <div class="mono">${escHtml(u3)}</div>
      <div class="payload-actions">
        <a class="btn-ghost btn-fill" href="${escHtml(u3)}">Open</a>
        <button type="button" class="btn-ghost" data-copy="${attrEsc(u3)}">Copy URL</button>
      </div>
    </div>

    <div class="payload-row">
      <h3>Multi-column ORDER BY</h3>
      <p>SQLite accepts multiple sort keys when injected raw.</p>
      <div class="mono">${escHtml(u4)}</div>
      <div class="payload-actions">
        <a class="btn-ghost btn-fill" href="${escHtml(u4)}">Open</a>
        <button type="button" class="btn-ghost" data-copy="${attrEsc(u4)}">Copy URL</button>
      </div>
    </div>

    <div class="payload-row">
      <h3>Error / syntax probe</h3>
      <p>May return a service error; useful for in-band reconnaissance screenshots.</p>
      <div class="mono">${escHtml(u5)}</div>
      <div class="payload-actions">
        <a class="btn-ghost btn-fill" href="${escHtml(u5)}">Open</a>
        <button type="button" class="btn-ghost" data-copy="${attrEsc(u5)}">Copy URL</button>
      </div>
    </div>
  </aside>`;
}

function layout(title, body, opts = {}) {
  const scripts = opts.scripts
    ? `<div id="toast" role="status" aria-live="polite"></div><script src="/ui.js" defer></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escHtml(title)}</title>
  <!-- meridian-ui v2 -->
  <link rel="stylesheet" href="/style.css"/>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span> Meridian Supply</a>
    <nav class="nav" aria-label="Primary">
      <a href="/">Home</a>
      <a class="nav--a" href="/insecure/login">Sign in · A</a>
      <a class="nav--a" href="/insecure/catalog">Inventory · A</a>
      <a class="nav--b" href="/secure/login">Sign in · B</a>
      <a class="nav--b" href="/secure/catalog">Inventory · B</a>
    </nav>
  </header>
  <main class="main">${body}</main>
  ${scripts}
</body>
</html>`;
}

const ALLOW_SORT = new Set(["name", "price", "category"]);

function mountRoutes(app, { db, getOneBound, getAllBound, getOneRaw, getAllRaw }) {
  app.get("/", (req, res) => {
    res.type("html").send(
      layout(
        "Meridian Supply — Internal",
        `
      <div class="panel">
        <h1>Internal portal</h1>
        <p class="subtitle">Staging environments for employee access and stock lookup. Site A is the legacy gateway; Site B is the hardened release candidate.</p>
        <div class="card-grid">
          <div class="card">
            <h2>Site A</h2>
            <p>Legacy employee sign-in and inventory.</p>
            <div class="card-actions">
              <a href="/insecure/login">Sign in</a>
              <a href="/insecure/catalog">Inventory</a>
            </div>
          </div>
          <div class="card">
            <h2>Site B</h2>
            <p>Current build — same workflows, updated data path.</p>
            <div class="card-actions">
              <a href="/secure/login">Sign in</a>
              <a href="/secure/catalog">Inventory</a>
            </div>
          </div>
        </div>
      </div>
    `,
        {}
      )
    );
  });

  app.get("/insecure/login", (req, res) => {
    res.type("html").send(
      layout(
        "Sign in · Site A",
        `
      <div class="page-split">
        <div class="panel">
          <h1>Employee sign-in</h1>
          <p class="subtitle">Site A · legacy authentication gateway</p>
          <form method="post" action="/insecure/login">
            <label>Username <input name="username" type="text" autocomplete="username" spellcheck="false"/></label>
            <label>Password <input name="password" type="password" autocomplete="current-password"/></label>
            <button type="submit">Sign in</button>
          </form>
        </div>
        ${siteALoginPayloadAside()}
      </div>
    `,
        { scripts: true }
      )
    );
  });

  app.post("/insecure/login", (req, res) => {
    const username = String(req.body.username ?? "");
    const password = String(req.body.password ?? "");
    const sql = `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}'`;
    let row;
    try {
      row = getOneRaw(db, sql);
    } catch (e) {
      return res.type("html").send(
        layout(
          "Sign in · Site A",
          `
        <div class="panel">
          <h1>Service error</h1>
          <p class="subtitle">The authentication service returned a database error.</p>
          <pre>${escHtml(String(e.message))}</pre>
          <details open><summary>Diagnostics</summary><pre>${escHtml(sql)}</pre></details>
          <p><a href="/insecure/login">Back to sign-in</a></p>
        </div>
      `,
          { scripts: true }
        )
      );
    }
    if (!row) {
      return res.type("html").send(
        layout(
          "Sign in · Site A",
          `
        <div class="panel">
          <h1>Sign-in failed</h1>
          <p class="subtitle">Credentials were not accepted.</p>
          <details open><summary>Diagnostics</summary><pre>${escHtml(sql)}</pre></details>
          <p><a href="/insecure/login">Back to sign-in</a></p>
        </div>
      `,
          { scripts: true }
        )
      );
    }
    res.type("html").send(
      layout(
        "Signed in · Site A",
        `
      <div class="panel">
        <h1>Signed in</h1>
        <p class="subtitle">Site A session established.</p>
        <p>Account: <strong>${escHtml(String(row.username))}</strong> · Role: <strong>${escHtml(String(row.role))}</strong></p>
        <details open><summary>Diagnostics</summary><pre>${escHtml(sql)}</pre></details>
        <p><a href="/insecure/login">Sign out</a></p>
      </div>
    `,
        { scripts: true }
      )
    );
  });

  app.get("/insecure/catalog", (req, res) => {
    const q = String(req.query.q ?? "");
    const category = String(req.query.category ?? "");
    const sort = String(req.query.sort ?? "name");
    const hasFilter = "q" in req.query || "category" in req.query || "sort" in req.query;

    const form = `
    <form method="get" action="/insecure/catalog" class="filters">
      <label>Search <input name="q" type="text" value="${escHtml(q)}" spellcheck="false"/></label>
      <label>Category
        <select name="category">
          <option value="" ${category === "" ? "selected" : ""}>All</option>
          <option value="stationery" ${category === "stationery" ? "selected" : ""}>stationery</option>
          <option value="furniture" ${category === "furniture" ? "selected" : ""}>furniture</option>
          <option value="books" ${category === "books" ? "selected" : ""}>books</option>
        </select>
      </label>
      <label>Sort
        <select name="sort">
          <option value="name" ${sort === "name" ? "selected" : ""}>name</option>
          <option value="price" ${sort === "price" ? "selected" : ""}>price</option>
          <option value="category" ${sort === "category" ? "selected" : ""}>category</option>
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
    <p class="hint">Tip: staged GET links on the right also exercise legacy parsing.</p>
  `;

    if (!hasFilter) {
      return res.type("html").send(
        layout(
          "Inventory · Site A",
          `
        <div class="page-split">
          <div class="panel">
            <h1>Stock &amp; catalog</h1>
            <p class="subtitle">Site A · legacy inventory service</p>
            ${form}
          </div>
          ${siteACatalogPayloadAside()}
        </div>
      `,
          { scripts: true }
        )
      );
    }

    let sql;
    let rows;
    try {
      let where = "1=1";
      if (q !== "") {
        where += ` AND name LIKE '%${q}%'`;
      }
      if (category !== "") {
        where += ` AND category = '${category}'`;
      }
      sql = `SELECT id, name, category, price FROM products WHERE ${where} ORDER BY ${sort}`;
      rows = getAllRaw(db, sql);
    } catch (e) {
      return res.type("html").send(
        layout(
          "Inventory · Site A",
          `
        <div class="page-split">
          <div class="panel">
            <h1>Stock &amp; catalog</h1>
            <p class="subtitle">Site A · legacy inventory service</p>
            ${form}
            <h2>Service error</h2>
            <pre>${escHtml(String(e.message))}</pre>
          </div>
          ${siteACatalogPayloadAside()}
        </div>
      `,
          { scripts: true }
        )
      );
    }

    const list = rows
      .map(
        (r) =>
          `<tr><td>${escHtml(String(r.name))}</td><td>${escHtml(String(r.category))}</td><td>${r.price}</td></tr>`
      )
      .join("");

    res.type("html").send(
      layout(
        "Inventory · Site A",
        `
      <div class="page-split">
        <div class="panel">
          <h1>Stock &amp; catalog</h1>
          <p class="subtitle">Site A · legacy inventory service</p>
          ${form}
          <details open><summary>Diagnostics</summary><pre>${escHtml(sql)}</pre></details>
          <table class="tbl"><thead><tr><th>Name</th><th>Category</th><th>Price</th></tr></thead><tbody>${list || "<tr><td colspan='3'>No rows</td></tr>"}</tbody></table>
        </div>
        ${siteACatalogPayloadAside()}
      </div>
    `,
        { scripts: true }
      )
    );
  });

  app.get("/secure/login", (req, res) => {
    res.type("html").send(
      layout(
        "Sign in · Site B",
        `
      <div class="panel">
        <h1>Employee sign-in</h1>
        <p class="subtitle">Site B · current release candidate</p>
        <p class="note">Bound parameters — same UI as Site A, different backend contract.</p>
        <form method="post" action="/secure/login">
          <label>Username <input name="username" type="text" autocomplete="username" spellcheck="false"/></label>
          <label>Password <input name="password" type="password" autocomplete="current-password"/></label>
          <button type="submit">Sign in</button>
        </form>
      </div>
    `,
        {}
      )
    );
  });

  app.post("/secure/login", (req, res) => {
    const username = String(req.body.username ?? "");
    const password = String(req.body.password ?? "");
    const sql = "SELECT id, username, role FROM users WHERE username = ? AND password = ?";
    const row = getOneBound(db, sql, [username, password]);
    if (!row) {
      return res.type("html").send(
        layout(
          "Sign in · Site B",
          `
        <div class="panel">
          <h1>Sign-in failed</h1>
          <p class="subtitle">Credentials were not accepted.</p>
          <details open><summary>Diagnostics</summary><pre>${escHtml(sql)}</pre></details>
          <p><a href="/secure/login">Back to sign-in</a></p>
        </div>
      `,
          {}
        )
      );
    }
    res.type("html").send(
      layout(
        "Signed in · Site B",
        `
      <div class="panel">
        <h1>Signed in</h1>
        <p class="subtitle">Site B session established.</p>
        <p>Account: <strong>${escHtml(String(row.username))}</strong> · Role: <strong>${escHtml(String(row.role))}</strong></p>
        <details open><summary>Diagnostics</summary><pre>${escHtml(sql)}</pre></details>
        <p><a href="/secure/login">Sign out</a></p>
      </div>
    `,
        {}
      )
    );
  });

  app.get("/secure/catalog", (req, res) => {
    const q = String(req.query.q ?? "");
    const category = String(req.query.category ?? "");
    const sortRaw = String(req.query.sort ?? "name");
    const sort = ALLOW_SORT.has(sortRaw) ? sortRaw : "name";
    const hasFilter = "q" in req.query || "category" in req.query || "sort" in req.query;

    const form = `
    <form method="get" action="/secure/catalog" class="filters">
      <label>Search <input name="q" type="text" value="${escHtml(q)}" spellcheck="false"/></label>
      <label>Category
        <select name="category">
          <option value="" ${category === "" ? "selected" : ""}>All</option>
          <option value="stationery" ${category === "stationery" ? "selected" : ""}>stationery</option>
          <option value="furniture" ${category === "furniture" ? "selected" : ""}>furniture</option>
          <option value="books" ${category === "books" ? "selected" : ""}>books</option>
        </select>
      </label>
      <label>Sort
        <select name="sort">
          <option value="name" ${sort === "name" ? "selected" : ""}>name</option>
          <option value="price" ${sort === "price" ? "selected" : ""}>price</option>
          <option value="category" ${sort === "category" ? "selected" : ""}>category</option>
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
    <p class="hint">Sort column is allow-listed; search uses bound parameters.</p>
  `;

    if (!hasFilter) {
      return res.type("html").send(
        layout(
          "Inventory · Site B",
          `
        <div class="panel">
          <h1>Stock &amp; catalog</h1>
          <p class="subtitle">Site B · current inventory service</p>
          ${form}
        </div>
      `,
          {}
        )
      );
    }

    const sqlParts = ["SELECT id, name, category, price FROM products WHERE 1=1"];
    const params = [];
    if (q !== "") {
      sqlParts.push("AND name LIKE ?");
      params.push(`%${q}%`);
    }
    if (category !== "") {
      sqlParts.push("AND category = ?");
      params.push(category);
    }
    sqlParts.push(`ORDER BY ${sort}`);
    const sql = sqlParts.join(" ");
    const rows = getAllBound(db, sql, params);

    const list = rows
      .map(
        (r) =>
          `<tr><td>${escHtml(String(r.name))}</td><td>${escHtml(String(r.category))}</td><td>${r.price}</td></tr>`
      )
      .join("");

    res.type("html").send(
      layout(
        "Inventory · Site B",
        `
      <div class="panel">
        <h1>Stock &amp; catalog</h1>
        <p class="subtitle">Site B · current inventory service</p>
        ${form}
        <details open><summary>Diagnostics</summary>
          <pre>${escHtml(sql)}\n-- bound: ${escHtml(JSON.stringify(params))}</pre>
        </details>
        <table class="tbl"><thead><tr><th>Name</th><th>Category</th><th>Price</th></tr></thead><tbody>${list || "<tr><td colspan='3'>No rows</td></tr>"}</tbody></table>
      </div>
    `,
        {}
      )
    );
  });
}

async function main() {
  const ctx = await openDatabase();
  const app = express();
  app.set("etag", false);
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    next();
  });
  app.use(express.urlencoded({ extended: false }));
  app.use(
    express.static(path.join(__dirname, "..", "public"), {
      setHeaders(res) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      },
    })
  );
  mountRoutes(app, ctx);

  const host = "127.0.0.1";
  const port = Number(process.env.PORT) || 3648;
  app.listen(port, host, () => {
    console.log(`Meridian Supply (demo) at http://${host}:${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Glued = your input is part of the sentence.
//Fixed = the sentence is already written; your input only fills empty slots.