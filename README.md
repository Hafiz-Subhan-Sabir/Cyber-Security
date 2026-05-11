# Meridian Supply — dual-stack demo (local only)

Staging app with two parallel “sites”: **Site A** (legacy SQL construction) and **Site B** (parameterized + validated). Serves **127.0.0.1** only. Do not deploy Site A paths to the public internet.

## Run

```powershell
cd "d:\subhan\main rs\sqli-learning-lab"
npm install
npm run init-db
npm start
```

Open **http://127.0.0.1:3648** (default). On Windows, `npm start` runs `prestart` first to stop any process already listening on that port—otherwise an **old Node server** can keep serving the previous UI (including the removed top banner).

To use another port: `$env:PORT=3847; npm start` (the prestart script uses the same `PORT` when set).

**Check you have the new UI:** View page source (Ctrl+U) and look for `<!-- meridian-ui v2 -->`. The home page title should be **Internal portal** and the nav should show **Sign in · A**, not “Insecure login”.

## Presenter reference — test accounts

Keep this off-screen during recording; use only on your machine for authorized coursework.

| Username | Password           | Role  |
|----------|--------------------|-------|
| alice    | alice123           | user  |
| bob      | bob123             | user  |
| admin    | admin_secret_2026  | admin |

Reset data: `npm run init-db`, then restart the server.

## How to perform the demo (suggested flow)

1. **Set the scene (30 seconds)**  
   Show the home page: “Meridian Supply” internal portal with **Site A** vs **Site B** as two staging stacks for the same features.

2. **Happy path on both (1–2 minutes)**  
   - **Site B** first: **Sign in · Site B** → log in as `alice` / `alice123` → expand **Diagnostics** and point out the static query template (`?` placeholders).  
   - **Inventory · Site B** → run a normal search and filter → show diagnostics: `LIKE ?`, bound values, and sort limited to allowed columns.

3. **Contrast with Site A (2–4 minutes)**  
   - **Sign in · Site A** → same legitimate credentials → show **Diagnostics**: full SQL with literals visible.  
   - Explain (verbally, per your course rules) that on legacy stacks, crafted input can change query meaning; expand diagnostics after a controlled example **only if your instructor allows live injection on this local host**.  
   - **Inventory · Site A** → normal use, then optionally show how **query-string** parameters map directly into the displayed SQL (sort / search), compared to Site B where the same UI inputs do not become raw SQL fragments.

4. **Close (30 seconds)**  
   Summarize: Site B uses bound parameters and validation; Site A represents risky patterns still seen in legacy code. Mention scope (localhost, your data only) and remediation (parameterize, least privilege, logging).

**Recording tip:** Use two browser windows or tabs labeled “Site A” and “Site B” so cuts between them are obvious to the audience.

## URLs (direct)

| Feature   | Site A (legacy)        | Site B (hardened)     |
|-----------|------------------------|------------------------|
| Sign-in   | `/insecure/login`      | `/secure/login`        |
| Inventory | `/insecure/catalog`    | `/secure/catalog`      |
