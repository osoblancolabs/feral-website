# FERAL Form Backend Setup

One Apps Script handles two application forms from a single deployment URL:

| Form                              | Page                      | Sheet tab              |
| --------------------------------- | ------------------------- | ---------------------- |
| Creative Director application     | `creative-team.html`      | "Creative Director"    |
| Ascension application (creators)  | `apply-ascension.html`    | "Ascension"            |

Both forms POST to the same Web app URL. The script reads the hidden `form_type` field on each form and routes the submission to the correct tab in a single Google Sheet workbook ("FERAL Applications"). Email notifications go to `kiefer@feralagency.net` with a form-specific subject line and the applicant's email as reply-to.

This file walks you through deploying (or redeploying) the script.

---

## First-time deploy

If you've never deployed the script:

1. Open https://script.google.com while logged in to the Google account that should OWN the application data.
2. Click **New project** (top left).
3. Delete the default `function myFunction() {}` placeholder.
4. Open `form-setup/creative-team-apps-script.gs` from this repo. Copy ALL of it. Paste into the Apps Script editor.
5. Rename the project at the top to `FERAL Application Forms`.
6. Save (Cmd+S).
7. Click **Deploy** → **New deployment** → gear icon → **Web app**.
8. Description: `FERAL forms v1`. Execute as: **Me**. Who has access: **Anyone**.
9. Click **Deploy** and authorize when prompted (Advanced → Go to FERAL Application Forms → Allow).
10. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).
11. Paste that URL into BOTH `creative-team.html` line ~751 AND `apply-ascension.html` (search for `script.google.com` in each file and replace the action URL).
12. Commit and push. Vercel redeploys.

---

## Redeploying the existing script (current state)

The repo already has a deployed URL wired into `creative-team.html` and `apply-ascension.html`:

```
https://script.google.com/macros/s/AKfycbybwEq0ZzOS1t7OwlQ3YQAtJgW_Bv6w7bmal5fGRi3jqB8NYQIu02n6T5TkocZ7O1UT/exec
```

When the `.gs` file changes (like now, after adding the ascension form), you need to push a new version under the SAME deployment URL so the wired-up URLs keep working.

1. Open the existing Apps Script project at https://script.google.com.
2. Replace the entire contents of `Code.gs` with the latest `form-setup/creative-team-apps-script.gs` from this repo.
3. Save (Cmd+S).
4. Click **Deploy** → **Manage deployments** (top right).
5. Click the pencil icon on the active deployment.
6. Set **Version** to **New version**, add description like `Add ascension form routing`, click **Deploy**.
7. The Web app URL stays the same. Nothing on the website needs to change.

---

## What happens on first ascension submission

The script keeps using the SAME Google Sheet that the Creative Director form created. On the first ascension submission, the script:

1. Renames the original sheet tab from its old name to **"Creative Director"** (so the named-tab routing works).
2. Creates a new tab called **"Ascension"** with headers matching the ascension form fields.
3. Appends the submission as a row.
4. Emails `kiefer@feralagency.net` with subject `New Ascension Application: <applicant name>`.

If for some reason the script can't find the original sheet (e.g. it was trashed), it creates a fresh "FERAL Applications" workbook and emails you the URL.

---

## Smoke test after redeploy

1. Paste the Web app URL directly into a browser. Should respond:
   ```json
   {"ok":true,"message":"FERAL form endpoint is live.","forms":["creative_director","ascension_application"]}
   ```
2. Submit a test through `stayferal.com/apply-ascension`. Check that:
   - The applicant email arrives at `kiefer@feralagency.net`.
   - A new row appears on the "Ascension" tab of the Sheet.
3. Submit a test through `stayferal.com/creative-team`. Check that:
   - The Creative Director applicant email arrives.
   - The row lands on the "Creative Director" tab (not Ascension).

---

## Adding new form fields

If you change `apply-ascension.html` or `creative-team.html` to add/remove a field, update the matching form's `fields` array in `creative-team-apps-script.gs` (look for the `FORMS` constant near the top). Then redeploy following the "Redeploying" section above.

The column order on the Sheet matches the order of the `fields` array. Renaming labels here changes future header rows on new tabs but doesn't rewrite existing headers, so for the cleanest result, delete the affected tab in the Sheet and let the script recreate it on next submission.

---

## Adding a third form

The script is built to scale. To add a new form (e.g., Ghost System application):

1. Add a new entry to the `FORMS` object in the `.gs` file:
   ```js
   ghost_system: {
     sheet: 'Ghost System',
     defaultSubject: 'New Ghost System Application',
     fields: [
       { key: 'submitted_at', label: 'Submitted (ET)' },
       // ... rest of fields ...
     ],
   },
   ```
2. Add a hidden `<input type="hidden" name="form_type" value="ghost_system" />` to the new form's HTML.
3. Redeploy.

---

## Troubleshooting

**Submission shows success but nothing in Sheet or inbox.**
Apps Script editor → **Executions** (left sidebar). Open the latest execution. The error tells you what failed. Most common: the script doesn't have the required permissions on the Sheet. Re-auth (Deploy → New deployment → authorize → don't actually finish, just dismiss; the auth grant carries over).

**Ascension submissions landing on the Creative Director tab.**
The hidden `form_type` field on `apply-ascension.html` is missing or set to the wrong value. Verify it reads `<input type="hidden" name="form_type" value="ascension_application" />`.

**You want to change where notifications go.**
Edit the `NOTIFY_EMAIL` constant at the top of the `.gs` file, redeploy via Manage deployments → New version.
