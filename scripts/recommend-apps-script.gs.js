/**
 * Recommendation form backend — Google Apps Script Web App.
 *
 * This file isn't part of the Hugo site build. It's the source for a
 * separate Google Apps Script project you deploy yourself — I can write
 * the code but can't deploy it, since that needs your Google account.
 *
 * Setup:
 * 1. Create a new Google Sheet. Rename its first tab to "Recommendations".
 * 2. In the Sheet: Extensions > Apps Script. Delete the placeholder code,
 *    paste this whole file in.
 * 3. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL (ends in /exec) into RECOMMEND_ENDPOINT near
 *    the top of assets/js/recommend.js, replacing the placeholder.
 * 5. Any time you edit this script afterward: Deploy > Manage deployments
 *    > edit the existing deployment > bump the version. Apps Script won't
 *    pick up changes to a live deployment otherwise.
 *
 * Spam handling: the honeypot field is checked client-side (a filled
 * 'website' field never reaches here at all). On top of that, this script
 * dedupes by content — Apps Script Web Apps don't reliably expose a
 * caller's real IP address, so a per-IP rate limit isn't something this
 * environment can actually do. Instead, the exact same recommendation text
 * submitted twice within RATE_LIMIT_SECONDS gets dropped, which is enough
 * to stop the common "resubmit the same spam payload on a loop" bot
 * pattern without needing infrastructure this script doesn't have.
 */

const SHEET_NAME = 'Recommendations';
const RATE_LIMIT_SECONDS = 120;

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const recommendation = (data.recommendation || '').toString().trim().slice(0, 2000);
  const name = (data.name || '').toString().trim().slice(0, 200);
  const contact = (data.contact || '').toString().trim().slice(0, 500);

  if (!recommendation) {
    return ContentService.createTextOutput('missing recommendation');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'seen_' + Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, recommendation)
  );
  if (cache.get(cacheKey)) {
    return ContentService.createTextOutput('duplicate');
  }
  cache.put(cacheKey, '1', RATE_LIMIT_SECONDS);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([new Date(), recommendation, name, contact]);

  return ContentService.createTextOutput('ok');
}
