/**
 * FERAL Creative Director Application — Apps Script web app backend.
 *
 * What it does:
 *   1. Receives POST from creative-team.html form.
 *   2. On first run, creates a Google Sheet named "FERAL Creative Director Applications"
 *      and stores its ID in script properties so future runs reuse it.
 *   3. Appends each submission as a row.
 *   4. Emails NOTIFY_EMAIL with the formatted application.
 *
 * Setup:
 *   1. Go to https://script.google.com and create a new project.
 *   2. Replace the default Code.gs contents with this file.
 *   3. Deploy as "Web app":
 *        Execute as: Me (your Google account)
 *        Who has access: Anyone
 *      Copy the deployment URL.
 *   4. Paste that URL into creative-team.html line 751
 *      (replace the REPLACE_WITH_DEPLOYMENT_ID placeholder).
 *   5. Submit a test application to verify the Sheet is created and the email lands.
 */

// ============================================================
// CONFIG — change these if needed
// ============================================================
const NOTIFY_EMAIL = 'kiefer@feralagency.net';
const SHEET_NAME = 'FERAL Creative Director Applications';

// Form field order. Anything new added to the form gets a new entry here.
const FIELDS = [
  { key: 'submitted_at',     label: 'Submitted (ET)' },
  { key: 'full_name',        label: 'Full name' },
  { key: 'email',            label: 'Email' },
  { key: 'phone',            label: 'Phone' },
  { key: 'location',         label: 'Location' },
  { key: 'instagram_handle', label: 'Instagram' },
  { key: 'portfolio_url',    label: 'Portfolio' },
  { key: 'loom_url',         label: 'Loom video' },
  { key: 'experience_years', label: 'Experience' },
  { key: 'best_win',         label: 'Best win' },
  { key: 'why_feral',        label: 'Why FERAL' },
  { key: 'start_date',       label: 'Earliest start' },
  { key: 'compensation',     label: 'Compensation expectations' },
];

// ============================================================
// MAIN HANDLER
// ============================================================
function doPost(e) {
  try {
    const params = e.parameter || {};
    const row = buildRow(params);
    const sheet = getOrCreateSheet();
    sheet.appendRow(row);
    sendEmail(params);
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, error: err.message });
  }
}

// Visiting the deployment URL in a browser hits doGet — used as a smoke test.
function doGet() {
  return jsonResponse({ ok: true, message: 'FERAL Creative Director form endpoint is live.' });
}

// ============================================================
// SHEET
// ============================================================
function getOrCreateSheet() {
  const props = PropertiesService.getScriptProperties();
  let sheetId = props.getProperty('SHEET_ID');

  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId).getActiveSheet();
    } catch (err) {
      // Stored ID no longer valid (sheet trashed). Fall through and create new.
      sheetId = null;
    }
  }

  const ss = SpreadsheetApp.create(SHEET_NAME);
  props.setProperty('SHEET_ID', ss.getId());

  const sheet = ss.getActiveSheet();
  sheet.appendRow(FIELDS.map(f => f.label));
  sheet.getRange(1, 1, 1, FIELDS.length)
       .setFontWeight('bold')
       .setBackground('#0a0a0a')
       .setFontColor('#f5f5f5');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, FIELDS.length);

  // Email a one-time setup notice with the Sheet URL.
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'FERAL form: new Sheet created',
    body: 'New Google Sheet was created for Creative Director applications:\n\n'
        + ss.getUrl()
        + '\n\nFuture submissions will append to this sheet.',
  });

  return sheet;
}

function buildRow(params) {
  const tz = 'America/New_York';
  const now = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  return FIELDS.map(f => f.key === 'submitted_at' ? now : (params[f.key] || ''));
}

// ============================================================
// EMAIL
// ============================================================
function sendEmail(params) {
  const name = params.full_name || 'New applicant';
  const subject = params.form_subject || ('New Creative Director Application: ' + name);

  const lines = FIELDS
    .filter(f => f.key !== 'submitted_at')
    .map(f => f.label + ':\n' + (params[f.key] || '(blank)') + '\n');

  const body = lines.join('\n') + '\n---\nSubmitted via stayferal.com/creative-team';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: params.email || NOTIFY_EMAIL,
    subject: subject,
    body: body,
  });
}

// ============================================================
// UTIL
// ============================================================
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
