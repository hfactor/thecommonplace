/**
 * Antilibrary backend — Google Apps Script Web App.
 *
 * This file isn't part of the Hugo site build. It's the source for a
 * separate Google Apps Script project you deploy yourself.
 *
 * Visitors recommend things (books, films/series, links, other) through
 * the form on /antilibrary/. Everyone reads the list back from here.
 *
 * Sheet columns (row 1 is a header row, tab named "Antilibrary"):
 *   A date | B title | C detail | D kind | E recommendedBy | F status | G link | H url | I found
 *   detail = author, OTT/director, or the visitor's comment (depends on kind)
 *   link   = the visitor's own link, shown on their name (for kind "Link" it
 *            is the page they recommended, and goes on the title instead)
 *   url    = YOUR page about it on hiran.in (a /path or http(s) address); once
 *            the status is "completed" it turns the title into a link
 *   found  = type "yes" or leave it blank. "yes" makes the line under the title
 *            read "Found through <E>" instead of "Recommended by <E>" — for things
 *            you came across yourself: a bookstore, someone's shelf, a newsletter
 *
 * The Sheet is the only source for the page. New recommendations arrive with
 * status "suggested". You manage the rest by editing the Sheet directly — no
 * redeploy, the next page load reflects it:
 *   - F status: suggested | collected | completed   (blank counts as "suggested")
 *   - G link:   the visitor's own link; edit or clear it if it's unwanted
 *   - H url:    a /path on this site, or an http(s) address; once the status
 *               is "completed" it makes the title a link
 *   - Delete a row to remove an entry.
 *
 * Setup:
 * 1. Create a new Google Sheet. Rename its first tab to "Antilibrary" and
 *    add the header row above.
 * 2. Extensions > Apps Script. Delete the placeholder code, paste this in.
 * 3. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the /exec URL (or just the deployment ID) into
 *    ANTILIBRARY_DEPLOYMENT at the top of assets/js/antilibrary.js.
 * 5. After editing this script: Deploy > Manage deployments > edit the
 *    existing deployment > bump the version.
 *
 * Spam handling: honeypot field 'company' (checked client-side and again
 * here), and the same title submitted twice within RATE_LIMIT_SECONDS is
 * dropped — Apps Script can't see a caller's IP, so no per-IP limit.
 */

const SHEET_NAME = 'Antilibrary';
const RATE_LIMIT_SECONDS = 120;
const MAX_ENTRIES_RETURNED = 300;
// Sheet text (case and spaces ignored) -> the keys the page uses.
const STATUS_KEYS = { suggested: 'suggested', collected: 'collected', completed: 'completed' };

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues().slice(1); // drop header
  const entries = rows
    .map(row => ({
      date: row[0], title: row[1], detail: row[2], kind: row[3],
      recommendedBy: row[4], status: row[5], link: row[6], url: row[7], found: row[8],
    }))
    .filter(entry => entry.title)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_ENTRIES_RETURNED)
    .map(entry => ({
      date: new Date(entry.date).toISOString(),
      title: String(entry.title),
      detail: String(entry.detail || ''),
      kind: String(entry.kind || 'Book'),
      recommendedBy: String(entry.recommendedBy || ''),
      status: STATUS_KEYS[String(entry.status).toLowerCase().replace(/\s+/g, '')] || 'suggested',
      link: String(entry.link || ''),
      url: String(entry.url || ''),
      found: /^(yes|y|true)$/i.test(String(entry.found).trim()),
    }));

  return ContentService
    .createTextOutput(JSON.stringify(entries))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const clean = (v, n) => (v || '').toString().trim().slice(0, n);
  const kind = ['Book', 'Film/Series', 'Link', 'Other'].indexOf(data.kind) >= 0 ? data.kind : 'Other';
  const title = clean(data.title, 200);
  const detail = clean(data.detail, 300);
  const recommendedBy = clean(data.recommendedBy, 100);
  const link = clean(data.link, 500);

  if (data.company) {
    return ContentService.createTextOutput('ok'); // honeypot tripped — silently drop
  }
  if (!title) {
    return ContentService.createTextOutput('missing title');
  }
  if (link && !/^https?:\/\//.test(link)) {
    return ContentService.createTextOutput('bad link');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'seen_' + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, (link || title).toLowerCase())
  );
  if (cache.get(cacheKey)) {
    return ContentService.createTextOutput('duplicate');
  }
  cache.put(cacheKey, '1', RATE_LIMIT_SECONDS);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([new Date(), title, detail, kind, recommendedBy, 'suggested', link, '', '']);

  return ContentService.createTextOutput('ok');
}
