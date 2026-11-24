/**
 * Google Apps Script for Fitness Foundation PWA
 *
 * Setup:
 * 1. Create a new Google Sheet (e.g., "Fitness Foundation Log").
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any starter code and paste this entire file.
 * 4. Optional: set SYNC_SECRET below (must match what you enter in the app Settings).
 * 5. Click Deploy -> New deployment -> Select type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Authorize and copy the Web App URL (ends in /exec) into the app's Settings.
 */

const SYNC_SECRET = ""; // Optional: e.g. "1234" (leave "" for no passcode)
const SUMMARY_TAB = "Session_Summary";
const DETAIL_TAB = "Exercise_Logs";

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAuthorized(secret) {
  if (!SYNC_SECRET) return true;
  return String(secret || "") === String(SYNC_SECRET);
}

function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let summary = ss.getSheetByName(SUMMARY_TAB);
  if (!summary) {
    summary = ss.insertSheet(SUMMARY_TAB);
    summary.appendRow([
      "Session ID",
      "Timestamp",
      "Week",
      "Day",
      "Session Title",
      "Completed Sets",
      "Target Sets",
      "Remarks",
      "Raw JSON"
    ]);
    summary.setFrozenRows(1);
  }

  let detail = ss.getSheetByName(DETAIL_TAB);
  if (!detail) {
    detail = ss.insertSheet(DETAIL_TAB);
    detail.appendRow([
      "Session ID",
      "Timestamp",
      "Week",
      "Day",
      "Section",
      "Exercise",
      "Set #",
      "Completed",
      "Reps / Time",
      "Load"
    ]);
    detail.setFrozenRows(1);
  }

  return { summary, detail };
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (!isAuthorized(params.secret)) {
    return jsonOut({ ok: false, error: "Invalid passcode" });
  }

  const action = params.action || "ping";
  if (action === "ping") {
    ensureSheets();
    return jsonOut({ ok: true, message: "Connected to Fitness Foundation Sheet" });
  }

  if (action === "history") {
    const { summary } = ensureSheets();
    const rows = summary.getDataRange().getValues();
    const sessions = [];
    for (let i = 1; i < rows.length; i++) {
      const raw = rows[i][8];
      if (raw) {
        try {
          sessions.push(JSON.parse(raw));
        } catch (_) {}
      }
    }
    sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return jsonOut({ ok: true, sessions: sessions.slice(0, 50) });
  }

  return jsonOut({ ok: false, error: "Unknown action" });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!isAuthorized(body.secret)) {
      return jsonOut({ ok: false, error: "Invalid passcode" });
    }

    if (body.action === "logSession" && body.session) {
      const s = body.session;
      const { summary, detail } = ensureSheets();

      const completedSets = (s.exercises || []).reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
      const targetSets = (s.exercises || []).reduce((acc, ex) => acc + (ex.targetSets || 0), 0);

      summary.appendRow([
        s.id || "",
        s.timestamp || new Date().toISOString(),
        s.week || "",
        s.day || "",
        s.sessionTitle || "",
        completedSets,
        targetSets,
        s.remarks || "",
        JSON.stringify(s)
      ]);

      const detailRows = [];
      (s.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((setItem) => {
          detailRows.push([
            s.id || "",
            s.timestamp || new Date().toISOString(),
            s.week || "",
            s.day || "",
            ex.section || "",
            ex.name || "",
            setItem.set || "",
            setItem.done ? "Yes" : "No",
            setItem.reps || "",
            setItem.load || ""
          ]);
        });
      });

      if (detailRows.length > 0) {
        detail
          .getRange(detail.getLastRow() + 1, 1, detailRows.length, detailRows[0].length)
          .setValues(detailRows);
      }

      return jsonOut({ ok: true, id: s.id });
    }

    return jsonOut({ ok: false, error: "Unsupported action" });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}
