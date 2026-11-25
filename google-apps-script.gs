/**
 * Google Apps Script for Fitness Foundation PWA (v2)
 *
 * Setup:
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Replace the old code with this entire file and click Save.
 * 3. Keep your SYNC_SECRET on line 15 (must match app Settings).
 * 4. Click Deploy -> Manage deployments -> Edit -> Version: New version -> Deploy.
 * 5. (One-time for existing sheets) Select "upgradeExistingRows" in the toolbar and click Run
 *    to convert your existing UTC rows into local time and apply the clean layout!
 */

const SYNC_SECRET = ""; // Optional: e.g. "1234" (leave "" for no passcode)
const SUMMARY_TAB = "Session_Summary";
const DETAIL_TAB = "Exercise_Logs";
const DEFAULT_TZ = "Asia/Kuala_Lumpur";

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAuthorized(secret) {
  if (!SYNC_SECRET) return true;
  return String(secret || "") === String(SYNC_SECRET);
}

function getLocalTimeZone() {
  const ssTz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  // Fallback to MYT if spreadsheet is still on default GMT/UTC
  if (!ssTz || ssTz === "GMT" || ssTz === "UTC" || ssTz === "Etc/GMT") {
    return DEFAULT_TZ;
  }
  return ssTz;
}

function formatLocalTimestamp(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(d.getTime())) return String(isoOrDate || "");
  return Utilities.formatDate(d, getLocalTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function styleHeader(sheet, colCount) {
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
  sheet.setFrozenRows(1);
}

function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let summary = ss.getSheetByName(SUMMARY_TAB);
  if (!summary) {
    summary = ss.insertSheet(SUMMARY_TAB);
    summary.appendRow([
      "Date & Time",
      "Week",
      "Day",
      "Session Title",
      "Completed Sets",
      "Target Sets",
      "Warm-Up",
      "Remarks",
      "Session ID",
      "Raw JSON"
    ]);
    styleHeader(summary, 10);
    summary.hideColumns(10);
  }

  let detail = ss.getSheetByName(DETAIL_TAB);
  if (!detail) {
    detail = ss.insertSheet(DETAIL_TAB);
    detail.appendRow([
      "Date & Time",
      "Week",
      "Day",
      "Section",
      "Exercise",
      "Set #",
      "Completed",
      "Reps / Time",
      "Load",
      "Session ID"
    ]);
    styleHeader(detail, 10);
  }

  return { summary, detail };
}

function findColumnIndex(sheet, headerName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(headerName);
}

function isDuplicateSession(summary, sessionId) {
  if (!sessionId || summary.getLastRow() < 2) return false;
  const idColIdx = findColumnIndex(summary, "Session ID");
  if (idColIdx === -1) return false;
  const ids = summary.getRange(2, idColIdx + 1, summary.getLastRow() - 1, 1).getValues();
  return ids.some((row) => String(row[0]) === String(sessionId));
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
    const jsonColIdx = findColumnIndex(summary, "Raw JSON");
    const sessions = [];
    if (jsonColIdx !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const raw = rows[i][jsonColIdx];
        if (raw) {
          try {
            sessions.push(JSON.parse(raw));
          } catch (_) {}
        }
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

      // Prevent duplicate rows if phone retries a sync
      if (isDuplicateSession(summary, s.id)) {
        return jsonOut({ ok: true, id: s.id, duplicate: true });
      }

      const localTime = formatLocalTimestamp(s.timestamp);
      const completedSets = (s.exercises || []).reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
      const targetSets = (s.exercises || []).reduce((acc, ex) => acc + (ex.targetSets || 0), 0);

      summary.appendRow([
        localTime,
        s.week || "",
        s.day || "",
        s.sessionTitle || "",
        completedSets,
        targetSets,
        s.warmup || "-",
        s.remarks || "",
        s.id || "",
        JSON.stringify(s)
      ]);

      const detailRows = [];
      (s.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((setItem) => {
          detailRows.push([
            localTime,
            s.week || "",
            s.day || "",
            ex.section || "",
            ex.name || "",
            setItem.set || "",
            setItem.done ? "Yes" : "No",
            setItem.reps || "",
            setItem.load || "",
            s.id || ""
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

/**
 * ONE-TIME MIGRATION HELPER:
 * Run this once from the Apps Script editor to upgrade your existing v1 rows
 * (converts UTC timestamps to local MYT time, reorders columns, hides Raw JSON).
 */
function upgradeExistingRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Upgrade Session_Summary
  const summary = ss.getSheetByName(SUMMARY_TAB);
  if (summary && summary.getLastRow() >= 1) {
    const headers = summary.getRange(1, 1, 1, summary.getLastColumn()).getValues()[0];
    if (headers[0] === "Session ID") {
      const data = summary.getDataRange().getValues();
      const newRows = [
        ["Date & Time", "Week", "Day", "Session Title", "Completed Sets", "Target Sets", "Warm-Up", "Remarks", "Session ID", "Raw JSON"]
      ];
      for (let i = 1; i < data.length; i++) {
        const [sid, ts, week, day, title, comp, targ, rem, raw] = data[i];
        let warmup = "-";
        try {
          if (raw) warmup = JSON.parse(raw).warmup || "-";
        } catch (_) {}
        newRows.push([
          formatLocalTimestamp(ts),
          week,
          day,
          title,
          comp,
          targ,
          warmup,
          rem,
          sid,
          raw
        ]);
      }
      summary.clearContents();
      summary.getRange(1, 1, newRows.length, 10).setValues(newRows);
      styleHeader(summary, 10);
      summary.autoResizeColumns(1, 9);
      summary.hideColumns(10);
    }
  }

  // 2. Upgrade Exercise_Logs
  const detail = ss.getSheetByName(DETAIL_TAB);
  if (detail && detail.getLastRow() >= 1) {
    const dHeaders = detail.getRange(1, 1, 1, detail.getLastColumn()).getValues()[0];
    if (dHeaders[0] === "Session ID") {
      const dData = detail.getDataRange().getValues();
      const newDetailRows = [
        ["Date & Time", "Week", "Day", "Section", "Exercise", "Set #", "Completed", "Reps / Time", "Load", "Session ID"]
      ];
      for (let i = 1; i < dData.length; i++) {
        const [sid, ts, week, day, sec, ex, setNum, comp, reps, load] = dData[i];
        newDetailRows.push([
          formatLocalTimestamp(ts),
          week,
          day,
          sec,
          ex,
          setNum,
          comp,
          reps,
          load,
          sid
        ]);
      }
      detail.clearContents();
      detail.getRange(1, 1, newDetailRows.length, 10).setValues(newDetailRows);
      styleHeader(detail, 10);
      detail.autoResizeColumns(1, 10);
    }
  }
}
