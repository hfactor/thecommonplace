/**
 * Guestbook backend — Google Apps Script Web App.
 *
 * This file isn't part of the Hugo site build. It's the source for a
 * separate Google Apps Script project you deploy yourself — I can write
 * the code but can't deploy it, since that needs your Google account.
 *
 * Unlike the recommend-form script, this one is both written to AND read
 * from publicly — anyone visiting /guestbook/ fetches the current list.
 *
 * Setup:
 * 1. Create a new Google Sheet. Rename its first tab to "Guestbook".
 * 2. In the Sheet: Extensions > Apps Script. Delete the placeholder code,
 *    paste this whole file in.
 * 3. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL (ends in /exec) into GUESTBOOK_ENDPOINT near
 *    the top of assets/js/guestbook.js, replacing the placeholder.
 * 5. Any time you edit this script afterward: Deploy > Manage deployments
 *    > edit the existing deployment > bump the version. Apps Script won't
 *    pick up changes to a live deployment otherwise.
 *
 * Deleting an entry: there's no delete button on the site — just delete
 * the row directly in the Sheet. The next page load reflects it, no
 * redeploy needed.
 *
 * Spam handling: the honeypot field is 'company' (checked client-side —
 * a filled field never reaches here at all — and again here as a
 * backstop). It's a separate field from 'website', which is a real,
 * visible field visitors use to share their own site. The exact same
 * message submitted twice within RATE_LIMIT_SECONDS gets dropped, same
 * reasoning as the recommend-form script — Apps Script Web Apps don't
 * reliably expose a caller's real IP, so a per-IP rate limit isn't
 * something this environment can actually do.
 */

const SHEET_NAME = 'Guestbook';
const RATE_LIMIT_SECONDS = 120;
const MAX_ENTRIES_RETURNED = 200;

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues(); // [date, message, name, website]
  const entries = rows
    .map(row => ({ date: row[0], message: row[1], name: row[2], website: row[3] }))
    .filter(entry => entry.message)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_ENTRIES_RETURNED)
    .map(entry => ({
      date: new Date(entry.date).toISOString(),
      message: entry.message,
      name: entry.name || '',
      website: entry.website || '',
    }));

  return ContentService
    .createTextOutput(JSON.stringify(entries))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const message = (data.message || '').toString().trim().slice(0, 500);
  const name = (data.name || '').toString().trim().slice(0, 100);
  const website = (data.website || '').toString().trim().slice(0, 300);

  if (data.company) {
    return ContentService.createTextOutput('ok'); // honeypot tripped — silently drop
  }
  if (!message) {
    return ContentService.createTextOutput('missing message');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'seen_' + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, message)
  );
  if (cache.get(cacheKey)) {
    return ContentService.createTextOutput('duplicate');
  }
  cache.put(cacheKey, '1', RATE_LIMIT_SECONDS);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([new Date(), message, name, website]);

  return ContentService.createTextOutput('ok');
}
