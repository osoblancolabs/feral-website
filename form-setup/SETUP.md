# Creative Team Form: Backend Setup

The application form on `creative-team.html` posts to a Google Apps Script web app that writes each submission to a Google Sheet AND emails `kiefer@feralagency.net`.

This file walks you through deploying the script once. Total time: about 10 minutes.

---

## Step 1: Create the Apps Script project

1. Open https://script.google.com while logged in to the Google account that should OWN the application data (probably the `kiefer@feralagency.net` account, or a workspace account you control).
2. Click **New project** (top left).
3. Delete the default `function myFunction() {}` placeholder.
4. Open `form-setup/creative-team-apps-script.gs` from this repo, copy ALL of it, and paste into the Apps Script editor.
5. Rename the project to `FERAL Creative Director Form` (top of page, click "Untitled project").
6. Click the save icon (or Cmd+S).

## Step 2: Deploy as a web app

1. In the Apps Script editor, click the blue **Deploy** button (top right) and choose **New deployment**.
2. Click the gear icon next to "Select type" and pick **Web app**.
3. Fill in:
   - **Description:** Creative Director form v1
   - **Execute as:** Me (your.email@example.com)
   - **Who has access:** **Anyone** (this is required so anonymous form submissions can reach the endpoint; the script only writes to YOUR Sheet)
4. Click **Deploy**.
5. Google will ask you to authorize the script. Click **Authorize access**, pick the same Google account, click **Advanced** → **Go to FERAL Creative Director Form (unsafe)** → **Allow**. (The "unsafe" warning is normal for unverified personal scripts.)
6. Copy the **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb...long-string.../exec
   ```

## Step 3: Wire the URL into the website

Open `creative-team.html`, find line ~751:

```html
<form id="ct-form" action="https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec" method="POST" novalidate>
```

Replace the entire URL with the Web app URL you copied. Save, commit, push. Vercel redeploys.

## Step 4: Smoke test

1. Open `https://stayferal.com/creative-team` in a private/incognito window.
2. Paste your Web app URL into the browser address bar directly. You should see:
   ```json
   {"ok":true,"message":"FERAL Creative Director form endpoint is live."}
   ```
3. Submit a test application through the form on the site.
4. Check `kiefer@feralagency.net` inbox:
   - First-ever submission triggers TWO emails: one with the Sheet URL ("FERAL form: new Sheet created") plus the application itself.
   - Every submission after that sends one email per application.
5. Open the Sheet from that first email. You should see a header row plus your test submission. Bookmark the Sheet URL.

---

## When you change the form

If you add or remove fields on `creative-team.html`, update the `FIELDS` array at the top of `creative-team-apps-script.gs`, then redeploy:

1. Apps Script editor → **Deploy** → **Manage deployments**.
2. Click the pencil icon on the active deployment.
3. Change **Version** to **New version**, click **Deploy**.
4. The URL stays the same. No need to touch the website.

If you change a field NAME (the `name="..."` attribute on the input), update the matching `key` in the FIELDS array OR your Sheet will end up with blank cells for that column.

---

## Troubleshooting

**Form shows the success screen but nothing arrives.**
Check the Apps Script editor → **Executions** (left sidebar). Click the latest one. If it shows an error, fix the script and redeploy. Most common cause: the email address has a typo, or the script failed to create the Sheet because of permissions (re-auth via Step 2.5).

**Email arrives but the Sheet is empty.**
The `SHEET_ID` script property got cleared, or the Sheet was moved to Trash. Open the Apps Script editor → **Project Settings** (gear icon) → scroll to **Script Properties**. If `SHEET_ID` is missing or pointing to a trashed file, delete it. Next submission will create a fresh Sheet.

**You want to change the notification email.**
Edit the `NOTIFY_EMAIL` constant at the top of `creative-team-apps-script.gs`, then redeploy (Manage deployments → pencil → New version).
