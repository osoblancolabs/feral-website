/**
 * FERAL Application Forms — Apps Script web app backend.
 *
 * Handles TWO form types from a single deployment URL:
 *   1. Creative Director applications (creative-team.html)
 *   2. Ascension applications (apply-ascension.html)
 *
 * Routing is by the hidden `form_type` field on each form.
 * Each form_type writes to its own tab in the same Google Sheet.
 * Email notifications go to NOTIFY_EMAIL with form-specific subject lines.
 *
 * Setup: see form-setup/SETUP.md
 */

// ============================================================
// CONFIG
// ============================================================
const NOTIFY_EMAIL = 'kiefer@feralagency.net';
const WORKBOOK_NAME = 'FERAL Applications';

// Form definitions. Add new forms by adding a new key here.
// `key` matches the hidden form_type field on the HTML form.
// `fields` is the column order. `submitted_at` is auto-filled.
const FORMS = {
  creative_director: {
    sheet: 'Creative Director',
    defaultSubject: 'New Creative Director Application',
    fields: [
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
    ],
  },
  ascension_application: {
    sheet: 'Ascension',
    defaultSubject: 'New Ascension Application',
    fields: [
      { key: 'submitted_at',      label: 'Submitted (ET)' },
      { key: 'full_name',         label: 'Full name' },
      { key: 'email',             label: 'Email' },
      { key: 'phone',             label: 'Phone' },
      { key: 'city',              label: 'City' },
      { key: 'country',           label: 'Country' },
      { key: 'instagram',         label: 'Instagram' },
      { key: 'tiktok',            label: 'TikTok' },
      { key: 'youtube',           label: 'YouTube' },
      { key: 'x_handle',          label: 'X' },
      { key: 'has_onlyfans',      label: 'Has OnlyFans' },
      { key: 'years_creating',    label: 'Years creating' },
      { key: 'monthly_earnings',  label: 'Monthly earnings' },
      { key: 'constraints',       label: 'Main constraints' },
      { key: 'constraint_other',  label: 'Constraint - other' },
      { key: 'why_feral',         label: 'Why FERAL' },
      { key: 'start_today',       label: 'Willing to start today' },
    ],
  },
};

// Fallback if a form posts without form_type (back-compat with old deployments)
const DEFAULT_FORM_KEY = 'creative_director';

// ============================================================
// MAIN HANDLER
// ============================================================
function doPost(e) {
  try {
    const params = flatten(e);
    const formKey = (params.form_type || DEFAULT_FORM_KEY).toLowerCase();
    const config = FORMS[formKey];
    if (!config) {
      throw new Error('Unknown form_type: ' + formKey);
    }

    const row = buildRow(params, config);
    const sheet = getOrCreateSheet(config);
    sheet.appendRow(row);
    sendEmail(params, config);
    return jsonResponse({ ok: true, form: formKey });
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, error: err.message });
  }
}

/**
 * Flatten the Apps Script `e` object into a {key: value} map where multi-value
 * params (e.g., HTML checkbox groups posted as "name[]") are joined with ", ".
 * Strips the trailing "[]" off keys so the FIELDS list can reference them plainly.
 */
function flatten(e) {
  const out = Object.assign({}, e.parameter || {});
  const multi = e.parameters || {};
  Object.keys(multi).forEach(k => {
    const cleanKey = k.replace(/\[\]$/, '');
    const arr = multi[k];
    if (arr && arr.length > 1) {
      out[cleanKey] = arr.join(', ');
    } else if (cleanKey !== k && arr && arr.length === 1) {
      out[cleanKey] = arr[0];
    }
  });
  return out;
}

function doGet() {
  return jsonResponse({
    ok: true,
    message: 'FERAL form endpoint is live.',
    forms: Object.keys(FORMS),
  });
}

// ============================================================
// SHEET
// ============================================================
function getOrCreateSheet(config) {
  const props = PropertiesService.getScriptProperties();
  let workbookId = props.getProperty('WORKBOOK_ID');

  // Back-compat: migrate the original deployment's SHEET_ID into WORKBOOK_ID
  // so we keep using the existing spreadsheet instead of orphaning it.
  if (!workbookId) {
    const legacySheetId = props.getProperty('SHEET_ID');
    if (legacySheetId) {
      try {
        const legacy = SpreadsheetApp.openById(legacySheetId);
        workbookId = legacy.getId();
        props.setProperty('WORKBOOK_ID', workbookId);
        // The legacy default sheet is the old "FERAL Creative Director Applications"
        // single sheet. Rename it so the named-tab logic below finds it.
        const onlySheet = legacy.getSheets()[0];
        if (onlySheet && onlySheet.getName() !== 'Creative Director') {
          onlySheet.setName('Creative Director');
        }
      } catch (err) {
        workbookId = null;
      }
    }
  }

  let ss;
  if (workbookId) {
    try {
      ss = SpreadsheetApp.openById(workbookId);
    } catch (err) {
      workbookId = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create(WORKBOOK_NAME);
    props.setProperty('WORKBOOK_ID', ss.getId());
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'FERAL forms: workbook created',
      body: 'A new Google Sheet was created for FERAL form submissions:\n\n'
          + ss.getUrl()
          + '\n\nEach form type writes to its own tab.',
    });
  }

  let sheet = ss.getSheetByName(config.sheet);
  if (!sheet) {
    sheet = ss.insertSheet(config.sheet);
    sheet.appendRow(config.fields.map(f => f.label));
    sheet.getRange(1, 1, 1, config.fields.length)
         .setFontWeight('bold')
         .setBackground('#0a0a0a')
         .setFontColor('#f5f5f5');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, config.fields.length);
    // Drop the legacy "Sheet1" if it's still around once we've created at least one named sheet.
    const legacy = ss.getSheetByName('Sheet1');
    if (legacy && ss.getSheets().length > 1) ss.deleteSheet(legacy);
  }
  return sheet;
}

function buildRow(params, config) {
  const tz = 'America/New_York';
  const now = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  return config.fields.map(f => {
    if (f.key === 'submitted_at') return now;
    // Form fields posted as arrays (e.g., constraints[]) come back as a single
    // value or comma-joined depending on the client. Apps Script joins multi-
    // value parameters with the e.parameters property; e.parameter takes the
    // first. We prefer the joined form for checkboxes.
    return params[f.key] || '';
  });
}

// ============================================================
// EMAIL
// ============================================================
function sendEmail(params, config) {
  const name = params.full_name || 'New applicant';
  const subject = params.form_subject || (config.defaultSubject + ': ' + name);

  const lines = config.fields
    .filter(f => f.key !== 'submitted_at')
    .map(f => f.label + ':\n' + (params[f.key] || '(blank)') + '\n');

  const body = lines.join('\n') + '\n---\nSubmitted via stayferal.com';

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
