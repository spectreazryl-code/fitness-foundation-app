(() => {
  const DATA = window.FITNESS_DATA;
  const STORAGE_KEYS = {
    SETTINGS: "ff_settings_v1",
    DRAFT: "ff_draft_v1",
    HISTORY: "ff_history_v1"
  };

  let state = {
    selectedWeek: 1,
    selectedDayIndex: new Date().getDay(), // 0 = Sun, 1 = Mon ... 6 = Sat
    activeTab: "workout",
    warmupOpen: false,
    settings: {
      scriptUrl: "",
      syncSecret: ""
    },
    draft: {}, // keyed by dayIndex -> { warmup: {id: bool}, sets: { exId_setIdx: { done, reps, load } }, remarks: "" }
    history: []
  };

  let timerState = {
    intervalId: null,
    remainingSec: 0,
    label: ""
  };

  // --- Helpers ---
  function loadStorage() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || "{}");
      state.settings = {
        scriptUrl: s.scriptUrl || "",
        syncSecret: s.syncSecret || ""
      };
      if (s.selectedWeek) state.selectedWeek = Number(s.selectedWeek);

      const d = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT) || "{}");
      state.draft = d;

      const h = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]");
      state.history = Array.isArray(h) ? h : [];
    } catch (e) {
      console.warn("Storage parse failed:", e);
    }
  }

  function saveSettingsStorage() {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        ...state.settings,
        selectedWeek: state.selectedWeek
      })
    );
  }

  function saveDraftStorage() {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(state.draft));
  }

  function saveHistoryStorage() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
  }

  function getDaySchedule(dayIndex) {
    return DATA.schedule.find((s) => s.dayIndex === dayIndex) || DATA.schedule[0];
  }

  function getDayDraft(dayIndex) {
    if (!state.draft[dayIndex]) {
      state.draft[dayIndex] = { warmup: {}, sets: {}, remarks: "" };
    }
    return state.draft[dayIndex];
  }

  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), 2800);
  }

  function playChime() {
    try {
      if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (_) {}
  }

  // --- Timer ---
  function formatClock(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function startTimer(seconds, label) {
    stopTimer(true);
    timerState.remainingSec = Math.max(1, seconds);
    timerState.label = label || "Rest Timer";

    const bar = document.getElementById("timerBar");
    const lbl = document.getElementById("timerLabel");
    const clk = document.getElementById("timerClock");

    lbl.textContent = timerState.label;
    clk.textContent = formatClock(timerState.remainingSec);
    bar.classList.remove("hidden");

    timerState.intervalId = setInterval(() => {
      timerState.remainingSec -= 1;
      if (timerState.remainingSec <= 0) {
        stopTimer(false);
        playChime();
        showToast(`${timerState.label} complete!`);
      } else {
        clk.textContent = formatClock(timerState.remainingSec);
      }
    }, 1000);
  }

  function adjustTimer(delta) {
    timerState.remainingSec = Math.max(1, timerState.remainingSec + delta);
    document.getElementById("timerClock").textContent = formatClock(timerState.remainingSec);
  }

  function stopTimer(silent) {
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    document.getElementById("timerBar").classList.add("hidden");
    if (!silent) {
      // already notified
    }
  }

  // --- Rendering ---
  function renderSyncStatus() {
    const pill = document.getElementById("syncBadgeBtn");
    const txt = document.getElementById("syncText");
    const pendingCount = state.history.filter((h) => !h.synced).length;
    const badge = document.getElementById("pendingCountBadge");

    if (pendingCount > 0) {
      badge.textContent = String(pendingCount);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    pill.classList.remove("connected", "pending", "error");
    if (!state.settings.scriptUrl) {
      txt.textContent = "Local Only";
    } else if (!navigator.onLine) {
      pill.classList.add("pending");
      txt.textContent = "Offline";
    } else if (pendingCount > 0) {
      pill.classList.add("pending");
      txt.textContent = `${pendingCount} Pending`;
    } else {
      pill.classList.add("connected");
      txt.textContent = "Sheet Synced";
    }
  }

  function renderWeekSelector() {
    document.querySelectorAll(".week-pill").forEach((btn) => {
      const w = Number(btn.dataset.week);
      btn.classList.toggle("active", w === state.selectedWeek);
    });
    const info = DATA.weeks.find((w) => w.week === state.selectedWeek) || DATA.weeks[0];
    document.getElementById("weekFocusText").textContent = `${info.label} Focus: ${info.focus}`;
  }

  function renderDayStrip() {
    const container = document.getElementById("dayStrip");
    const todayIdx = new Date().getDay();
    container.innerHTML = "";

    DATA.schedule.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "day-btn";
      btn.dataset.type = item.type;
      if (item.dayIndex === state.selectedDayIndex) btn.classList.add("active");
      if (item.dayIndex === todayIdx) btn.classList.add("is-today");

      btn.innerHTML = `<span>${item.short}</span><span class="day-dot"></span>`;
      btn.addEventListener("click", () => {
        state.selectedDayIndex = item.dayIndex;
        renderWorkoutTab();
      });
      container.appendChild(btn);
    });
  }

  function renderWarmup(dayDraft) {
    const list = document.getElementById("warmupList");
    const status = document.getElementById("warmupStatus");
    list.innerHTML = "";

    let doneCount = 0;
    DATA.warmup.forEach((w) => {
      const checked = Boolean(dayDraft.warmup[w.id]);
      if (checked) doneCount++;

      const lbl = document.createElement("label");
      lbl.className = "warmup-item";
      lbl.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} /><span>${w.text}</span>`;
      lbl.querySelector("input").addEventListener("change", (e) => {
        dayDraft.warmup[w.id] = e.target.checked;
        saveDraftStorage();
        renderWarmup(dayDraft);
      });
      list.appendChild(lbl);
    });
    status.textContent = `${doneCount}/${DATA.warmup.length} done`;
  }

  function updateSessionProgress(sched, dayDraft) {
    let total = 0;
    let done = 0;
    sched.sections.forEach((secKey) => {
      const sec = DATA.workouts[secKey];
      sec.exercises.forEach((ex) => {
        total += ex.sets;
        for (let i = 1; i <= ex.sets; i++) {
          const k = `${ex.id}_${i}`;
          if (dayDraft.sets[k]?.done) done++;
        }
      });
    });
    document.getElementById("progressCount").textContent = `${done}/${total}`;
  }

  function renderWorkoutTab() {
    renderWeekSelector();
    renderDayStrip();

    const sched = getDaySchedule(state.selectedDayIndex);
    const dayDraft = getDayDraft(state.selectedDayIndex);
    const isToday = state.selectedDayIndex === new Date().getDay();

    document.getElementById("sessionTypeTag").textContent = isToday
      ? `Today • ${sched.day}`
      : sched.day;
    document.getElementById("sessionTitle").textContent = sched.title;
    document.getElementById("sessionNotes").textContent = sched.notes;

    const warmupCard = document.getElementById("warmupCard");
    const exerciseContainer = document.getElementById("exerciseContainer");
    const recoveryView = document.getElementById("recoveryView");
    const finishCard = document.getElementById("finishCard");

    exerciseContainer.innerHTML = "";

    if (sched.sections.length === 0) {
      warmupCard.classList.add("hidden");
      recoveryView.classList.remove("hidden");
      finishCard.classList.add("hidden");

      const isSun = sched.type === "rest";
      document.getElementById("recoveryEmoji").textContent = isSun ? "🛌" : "🚶‍♂️";
      document.getElementById("recoveryHeading").textContent = sched.title;
      document.getElementById("recoveryBody").textContent = sched.notes;
      document.getElementById("progressCount").textContent = "Rest";
      return;
    }

    warmupCard.classList.remove("hidden");
    recoveryView.classList.add("hidden");
    finishCard.classList.remove("hidden");

    renderWarmup(dayDraft);

    sched.sections.forEach((secKey) => {
      const sec = DATA.workouts[secKey];

      const heading = document.createElement("div");
      heading.className = "section-heading";
      heading.innerHTML = `<h3>${sec.name}</h3><span class="section-badge">${sec.exercises.length} exercises</span>`;
      exerciseContainer.appendChild(heading);

      sec.exercises.forEach((ex) => {
        const card = document.createElement("article");
        card.className = "exercise-card";

        let exDoneCount = 0;
        for (let i = 1; i <= ex.sets; i++) {
          if (dayDraft.sets[`${ex.id}_${i}`]?.done) exDoneCount++;
        }
        if (exDoneCount === ex.sets) card.classList.add("all-done");

        const holdBtnHtml = ex.isTimed
          ? `<button class="hold-timer-btn" data-hold="${ex.holdSec}" data-name="${ex.name}">⏱ ${ex.holdSec}s Hold</button>`
          : "";

        card.innerHTML = `
          <div class="ex-header">
            <div class="ex-title-wrap">
              <span class="ex-num">${ex.num}</span>
              <div>
                <h4 class="ex-name">${ex.name}</h4>
              </div>
            </div>
            ${holdBtnHtml}
          </div>
          <div class="ex-meta">
            <span class="meta-chip">${ex.sets} sets × ${ex.targetReps}</span>
            <span class="meta-chip">Load: ${ex.load}</span>
            <span class="meta-chip">Rest: ${ex.restLabel}</span>
          </div>
          <div class="ex-cue">${ex.cue}</div>
          <div class="sets-list"></div>
        `;

        if (ex.isTimed) {
          card.querySelector(".hold-timer-btn").addEventListener("click", () => {
            startTimer(ex.holdSec, `${ex.name} Hold`);
          });
        }

        const setsList = card.querySelector(".sets-list");
        for (let i = 1; i <= ex.sets; i++) {
          const key = `${ex.id}_${i}`;
          const savedSet = dayDraft.sets[key] || {
            done: false,
            reps: ex.defaultLogReps,
            load: ex.load
          };
          dayDraft.sets[key] = savedSet;

          const row = document.createElement("div");
          row.className = `set-row ${savedSet.done ? "done" : ""}`;
          row.innerHTML = `
            <span class="set-label">Set ${i}</span>
            <input class="set-input reps-in" type="text" value="${escapeHtml(savedSet.reps)}" aria-label="Reps or time" />
            <input class="set-input load-in" type="text" value="${escapeHtml(savedSet.load)}" aria-label="Load" />
            <button class="set-check-btn" type="button" aria-label="Mark set ${i} complete">${savedSet.done ? "✓" : ""}</button>
          `;

          row.querySelector(".reps-in").addEventListener("input", (e) => {
            dayDraft.sets[key].reps = e.target.value;
            saveDraftStorage();
          });
          row.querySelector(".load-in").addEventListener("input", (e) => {
            dayDraft.sets[key].load = e.target.value;
            saveDraftStorage();
          });
          row.querySelector(".set-check-btn").addEventListener("click", () => {
            const next = !dayDraft.sets[key].done;
            dayDraft.sets[key].done = next;
            saveDraftStorage();

            row.classList.toggle("done", next);
            row.querySelector(".set-check-btn").textContent = next ? "✓" : "";

            // Refresh all-done border & counter
            let allDone = true;
            for (let s = 1; s <= ex.sets; s++) {
              if (!dayDraft.sets[`${ex.id}_${s}`]?.done) allDone = false;
            }
            card.classList.toggle("all-done", allDone);
            updateSessionProgress(sched, dayDraft);

            if (next) {
              startTimer(ex.restSec, `Rest • ${ex.name}`);
            }
          });

          setsList.appendChild(row);
        }

        exerciseContainer.appendChild(card);
      });
    });

    const remarksEl = document.getElementById("sessionRemarks");
    remarksEl.value = dayDraft.remarks || "";
    remarksEl.oninput = (e) => {
      dayDraft.remarks = e.target.value;
      saveDraftStorage();
    };

    updateSessionProgress(sched, dayDraft);
  }

  function renderScheduleAndGuide() {
    document.getElementById("frequencyNoteText").textContent = DATA.frequencyNote;

    const schedList = document.getElementById("fullScheduleList");
    schedList.innerHTML = "";
    DATA.schedule.forEach((s) => {
      const row = document.createElement("div");
      row.className = "schedule-row";
      row.innerHTML = `
        <div>
          <strong>${s.day} — ${s.title}</strong>
          <span>${s.notes}</span>
        </div>
        <button class="btn btn-secondary btn-sm">Open</button>
      `;
      row.querySelector("button").addEventListener("click", () => {
        state.selectedDayIndex = s.dayIndex;
        switchTab("workout");
        renderWorkoutTab();
      });
      schedList.appendChild(row);
    });

    const progList = document.getElementById("progressionList");
    progList.innerHTML = "";
    DATA.weeks.forEach((w) => {
      const row = document.createElement("div");
      row.className = "schedule-row";
      row.innerHTML = `<div><strong>${w.label}</strong><span>${w.focus}</span></div>`;
      progList.appendChild(row);
    });

    const notesList = document.getElementById("notesList");
    notesList.innerHTML = "";
    DATA.notes.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n;
      notesList.appendChild(li);
    });
  }

  function renderHistoryTab() {
    const list = document.getElementById("historyList");
    const syncPendingBtn = document.getElementById("syncPendingBtn");
    const pending = state.history.filter((h) => !h.synced);

    syncPendingBtn.classList.toggle("hidden", !(pending.length > 0 && state.settings.scriptUrl));
    document.getElementById("historySummary").textContent =
      `${state.history.length} logged session(s) • ${pending.length} pending sync`;

    list.innerHTML = "";
    if (state.history.length === 0) {
      list.innerHTML = `<div class="card muted small">No completed workouts logged yet. Check off sets on the Workout tab and tap <strong>Save &amp; Sync Session</strong>.</div>`;
      return;
    }

    state.history.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "history-item";
      const completedSets = (entry.exercises || []).reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
      const totalSets = (entry.exercises || []).reduce((acc, ex) => acc + (ex.targetSets || 0), 0);

      item.innerHTML = `
        <div class="history-item-top">
          <div>
            <h3>Week ${entry.week} • ${escapeHtml(entry.day)} (${escapeHtml(entry.sessionTitle)})</h3>
            <div class="history-date">${escapeHtml(entry.dateDisplay || entry.timestamp)}</div>
          </div>
          <span class="status-tag ${entry.synced ? "synced" : "pending"}">
            ${entry.synced ? "Synced" : "Local / Pending"}
          </span>
        </div>
        <p class="history-summary-line">Completed <strong>${completedSets}/${totalSets}</strong> sets${entry.remarks ? ` • "${escapeHtml(entry.remarks)}"` : ""}</p>
      `;
      list.appendChild(item);
    });
  }

  // --- Google Sheet Sync ---
  async function postToSheet(entry) {
    if (!state.settings.scriptUrl) return false;
    const payload = {
      action: "logSession",
      secret: state.settings.syncSecret || "",
      session: entry
    };
    const res = await fetch(state.settings.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Sync failed");
    return true;
  }

  async function syncAllPending() {
    if (!state.settings.scriptUrl) {
      showToast("Add your Google Apps Script URL in Settings first.");
      return;
    }
    const pending = state.history.filter((h) => !h.synced);
    if (pending.length === 0) {
      showToast("All sessions already synced!");
      return;
    }
    let syncedNow = 0;
    for (const entry of pending) {
      try {
        await postToSheet(entry);
        entry.synced = true;
        syncedNow++;
      } catch (err) {
        console.warn("Sync error:", err);
      }
    }
    saveHistoryStorage();
    renderSyncStatus();
    renderHistoryTab();
    showToast(syncedNow > 0 ? `Synced ${syncedNow} session(s) to Google Sheet!` : "Sync failed. Check URL/connection.");
  }

  async function pullFromSheet() {
    if (!state.settings.scriptUrl) {
      renderHistoryTab();
      return;
    }
    try {
      const url = new URL(state.settings.scriptUrl);
      url.searchParams.set("action", "history");
      if (state.settings.syncSecret) url.searchParams.set("secret", state.settings.syncSecret);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.ok && Array.isArray(data.sessions)) {
        const existingIds = new Set(state.history.map((h) => h.id));
        let added = 0;
        data.sessions.forEach((s) => {
          if (s.id && !existingIds.has(s.id)) {
            state.history.push({ ...s, synced: true });
            added++;
          }
        });
        state.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        saveHistoryStorage();
        renderSyncStatus();
        renderHistoryTab();
        showToast(added > 0 ? `Pulled ${added} session(s) from Sheet` : "History is up to date");
      }
    } catch (err) {
      showToast("Could not reach Google Sheet (offline or invalid URL)");
    }
  }

  async function finishAndSyncWorkout() {
    const sched = getDaySchedule(state.selectedDayIndex);
    const dayDraft = getDayDraft(state.selectedDayIndex);

    const exerciseLogs = [];
    let totalDone = 0;

    sched.sections.forEach((secKey) => {
      const sec = DATA.workouts[secKey];
      sec.exercises.forEach((ex) => {
        const setsDetail = [];
        let exDone = 0;
        for (let i = 1; i <= ex.sets; i++) {
          const s = dayDraft.sets[`${ex.id}_${i}`] || { done: false, reps: ex.defaultLogReps, load: ex.load };
          if (s.done) {
            exDone++;
            totalDone++;
          }
          setsDetail.push({ set: i, done: s.done, reps: s.reps, load: s.load });
        }
        exerciseLogs.push({
          section: sec.badge,
          name: ex.name,
          targetSets: ex.sets,
          completedSets: exDone,
          sets: setsDetail
        });
      });
    });

    if (totalDone === 0) {
      showToast("Check off at least 1 set before saving!");
      return;
    }

    const warmupTotal = DATA.warmup.length;
    const warmupDone = DATA.warmup.filter((w) => Boolean(dayDraft.warmup[w.id])).length;

    const now = new Date();
    const entry = {
      id: `ff_${now.getTime()}`,
      timestamp: now.toISOString(),
      dateDisplay: now.toLocaleString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      week: state.selectedWeek,
      day: sched.day,
      sessionTitle: sched.title,
      warmup: `${warmupDone}/${warmupTotal}`,
      remarks: (dayDraft.remarks || "").trim(),
      exercises: exerciseLogs,
      synced: false
    };

    state.history.unshift(entry);
    saveHistoryStorage();
    stopTimer(true);

    if (state.settings.scriptUrl && navigator.onLine) {
      showToast("Saving & syncing to Google Sheet...");
      try {
        await postToSheet(entry);
        entry.synced = true;
        saveHistoryStorage();
        showToast("Workout saved & synced to Google Sheet!");
      } catch (err) {
        showToast("Saved locally! Will sync when connection is ready.");
      }
    } else {
      showToast("Workout saved locally on device!");
    }

    // Clear current day draft after logging
    state.draft[state.selectedDayIndex] = { warmup: {}, sets: {}, remarks: "" };
    saveDraftStorage();

    renderSyncStatus();
    renderWorkoutTab();
    renderHistoryTab();
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabName));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${tabName}`));
    if (tabName === "history") renderHistoryTab();
  }

  // --- Wire Events ---
  function initEvents() {
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll(".week-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedWeek = Number(btn.dataset.week);
        saveSettingsStorage();
        renderWeekSelector();
      });
    });

    document.getElementById("warmupToggleBtn").addEventListener("click", () => {
      state.warmupOpen = !state.warmupOpen;
      document.getElementById("warmupList").classList.toggle("hidden", !state.warmupOpen);
      document.getElementById("warmupChevron").textContent = state.warmupOpen ? "▲" : "▼";
    });

    document.getElementById("resetTodayBtn").addEventListener("click", () => {
      state.draft[state.selectedDayIndex] = { warmup: {}, sets: {}, remarks: "" };
      saveDraftStorage();
      stopTimer(true);
      renderWorkoutTab();
      showToast("Today's sets reset");
    });

    document.getElementById("finishWorkoutBtn").addEventListener("click", finishAndSyncWorkout);
    document.getElementById("syncPendingBtn").addEventListener("click", syncAllPending);
    document.getElementById("pullSheetBtn").addEventListener("click", pullFromSheet);

    // Timer controls
    document.getElementById("timerSubBtn").addEventListener("click", () => adjustTimer(-15));
    document.getElementById("timerAddBtn").addEventListener("click", () => adjustTimer(15));
    document.getElementById("timerStopBtn").addEventListener("click", () => stopTimer(true));

    // Settings modal
    const modal = document.getElementById("settingsModal");
    const openModal = () => {
      document.getElementById("scriptUrlInput").value = state.settings.scriptUrl;
      document.getElementById("syncSecretInput").value = state.settings.syncSecret;
      modal.classList.remove("hidden");
    };
    document.getElementById("openSettingsBtn").addEventListener("click", openModal);
    document.getElementById("syncBadgeBtn").addEventListener("click", openModal);
    document.getElementById("closeSettingsBtn").addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("saveSettingsBtn").addEventListener("click", () => {
      state.settings.scriptUrl = document.getElementById("scriptUrlInput").value.trim();
      state.settings.syncSecret = document.getElementById("syncSecretInput").value.trim();
      saveSettingsStorage();
      renderSyncStatus();
      modal.classList.add("hidden");
      showToast("Settings saved!");
    });

    document.getElementById("testConnBtn").addEventListener("click", async () => {
      const urlVal = document.getElementById("scriptUrlInput").value.trim();
      const secVal = document.getElementById("syncSecretInput").value.trim();
      if (!urlVal) {
        showToast("Please paste a Web App URL first.");
        return;
      }
      try {
        const u = new URL(urlVal);
        u.searchParams.set("action", "ping");
        if (secVal) u.searchParams.set("secret", secVal);
        const res = await fetch(u.toString());
        const d = await res.json();
        showToast(d.ok ? "Connected to Google Sheet!" : `Error: ${d.error}`);
      } catch (err) {
        showToast("Connection failed. Check Web App URL & deployment access.");
      }
    });

    document.getElementById("exportJsonBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `fitness-foundation-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    });

    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      if (confirm("Clear all locally saved workout history on this device?")) {
        state.history = [];
        saveHistoryStorage();
        renderSyncStatus();
        renderHistoryTab();
        modal.classList.add("hidden");
        showToast("Local history cleared");
      }
    });

    window.addEventListener("online", renderSyncStatus);
    window.addEventListener("offline", renderSyncStatus);
  }

  // --- Register Service Worker ---
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.warn("SW registration skipped:", err);
      });
    });
  }

  // --- Boot ---
  loadStorage();
  initEvents();
  renderSyncStatus();
  renderWorkoutTab();
  renderScheduleAndGuide();
})();
