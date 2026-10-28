/**
 * Post Cards address backend — Google Apps Script Web App.
 *
 * Not part of the Hugo build. Source for a separate Apps Script project you
 * deploy yourself (standalone, like the work inquiry one). It never reads
 * anything back, so the addresses stay private.
 *
 * Visitors use "Share your address" on /post-cards/ (name, postal address,
 * optional email). Each submission is logged to an "Addresses" tab and
 * emailed to you.
 *
 * Tab "Addresses" (created automatically on the first submission):
 *   A date | B name | C address | D email
 *
 * Setup:
 * 1. Copy the ID of the Sheet to log to (docs.google.com/spreadsheets/d/<ID>/edit)
 *    into SPREADSHEET_ID below.
 * 2. script.google.com > New project. Paste this in.
 * 3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 * 4. Copy the /exec URL (or just the deployment ID) into PC_DEPLOYMENT in
 *    layouts/_default/postcards.html.
 * 5. After editing: Deploy > Manage deployments > edit > bump the version.
 *
 * Spam handling: honeypot field 'company', and the same name + address
 * sent twice within RATE_LIMIT_SECONDS is dropped.
 */

const OWNER_EMAIL = 'hiran.v@gmail.com';
const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SHEET_ID';
const SHEET_NAME = 'Addresses';
const RATE_LIMIT_SECONDS = 120;

// Stops visitor text being run as a spreadsheet formula (a leading = + - @ makes
// Sheets evaluate the cell). A leading apostrophe stores it as plain text; the
// apostrophe itself isn't kept in the cell.
function safeCell(v) {
  return typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function doGet() {
  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const clean = (v, n) => (v || '').toString().trim().slice(0, n);
  const name = clean(data.name, 200);
  const address = clean(data.address, 1000);
  const email = clean(data.email, 200);

  if (data.company) {
    return ContentService.createTextOutput('ok'); // honeypot tripped — silently drop
  }
  if (!name || !address) {
    return ContentService.createTextOutput('missing');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ContentService.createTextOutput('bad email');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'seen_' + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, (name + address).toLowerCase())
  );
  if (cache.get(cacheKey)) {
    return ContentService.createTextOutput('duplicate');
  }
  cache.put(cacheKey, '1', RATE_LIMIT_SECONDS);

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    replyTo: email || OWNER_EMAIL,
    subject: 'Postcard address: ' + name,
    body: name + '\n' + address + (email ? '\n\n' + email : ''),
  });

  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(['date', 'name', 'address', 'email']);
  }
  sheet.appendRow([new Date(), safeCell(name), safeCell(address), safeCell(email)]);

  return ContentService.createTextOutput('ok');
}
