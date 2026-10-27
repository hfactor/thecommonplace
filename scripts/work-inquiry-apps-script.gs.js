/**
 * Work inquiry backend — Google Apps Script Web App.
 *
 * This file isn't part of the Hugo site build. It's the source for a
 * separate Google Apps Script project you deploy yourself. Keep it apart
 * from the Antilibrary script: that one publishes its sheet to everyone,
 * this one never reads anything back.
 *
 * Visitors use the "Inquire" form on /work/ (work email + optional message).
 * Each submission is logged to an "Inquiries" tab and emailed to you, with
 * the visitor's address as the reply-to so you can answer from your inbox.
 *
 * It can write to the same Google Sheet as the Antilibrary (a separate tab).
 * That stays private: the Antilibrary script only ever reads its own
 * "Antilibrary" tab, and this script never reads anything back.
 *
 * Tab "Inquiries" (created automatically on the first submission):
 *   A date | B email | C message | D about
 *
 * Setup:
 * 1. Open the Sheet you want to log to (the Antilibrary one is fine) and
 *    copy its ID from the address bar: docs.google.com/spreadsheets/d/<ID>/edit
 *    Paste it into SPREADSHEET_ID below.
 * 2. Go to script.google.com > New project (a standalone project, not the
 *    Antilibrary's). Delete the placeholder code, paste this in.
 * 3. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    ("Anyone" only lets people submit. doGet below returns nothing, so
 *    the sheet and your inbox stay private.)
 * 4. Copy the /exec URL (or just the deployment ID) into
 *    WORK_INQUIRY_DEPLOYMENT in layouts/work/list.html.
 * 5. After editing this script: Deploy > Manage deployments > edit the
 *    existing deployment > bump the version.
 *
 * Spam handling: honeypot field 'company' (checked client-side and again
 * here), and the same address sending twice within RATE_LIMIT_SECONDS is
 * dropped.
 */

const OWNER_EMAIL = 'hiran.v@gmail.com';
const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SHEET_ID';
const SHEET_NAME = 'Inquiries';
const RATE_LIMIT_SECONDS = 120;

function doGet() {
  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const clean = (v, n) => (v || '').toString().trim().slice(0, n);
  const email = clean(data.email, 200);
  const message = clean(data.message, 2000);
  const about = clean(data.about, 200);

  if (data.company) {
    return ContentService.createTextOutput('ok'); // honeypot tripped — silently drop
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ContentService.createTextOutput('bad email');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'seen_' + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email.toLowerCase())
  );
  if (cache.get(cacheKey)) {
    return ContentService.createTextOutput('duplicate');
  }
  cache.put(cacheKey, '1', RATE_LIMIT_SECONDS);

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    replyTo: email,
    subject: 'Work inquiry' + (about ? ': ' + about : ''),
    body: 'Work email: ' + email + (about ? '\nAbout: ' + about : '') + (message ? '\n\n' + message : ''),
  });

  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(['date', 'email', 'message', 'about']);
  }
  sheet.appendRow([new Date(), email, message, about]);

  return ContentService.createTextOutput('ok');
}
