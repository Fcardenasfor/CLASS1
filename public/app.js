(() => {
  const $ = (id) => document.getElementById(id);
  const STORE = "songforge.jobs.v1";
  const POLL_MS = 5000;
  const MAX_POLL_MS = 10 * 60 * 1000;
  const FAILED = ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"];
  const STATUS_LABEL = {
    PENDING: "Queued",
    TEXT_SUCCESS: "Writing music…",
    FIRST_SUCCESS: "First track ready",
    SUCCESS: "Done",
    CREATE_TASK_FAILED: "Failed to start",
    GENERATE_AUDIO_FAILED: "Generation failed",
    CALLBACK_EXCEPTION: "Callback error",
    SENSITIVE_WORD_ERROR: "Blocked: sensitive words",
  };

  let mode = "simple";
  let jobs = load();
  const timers = {};

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(jobs.slice(0, 50))); } catch {}
  }

  // ---------- UI wiring ----------
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      mode = t.dataset.mode;
      document.querySelectorAll(".tab").forEach((x) => {
        x.classList.toggle("active", x === t);
        x.setAttribute("aria-selected", x === t);
      });
      document.querySelector(".mode.simple").hidden = mode !== "simple";
      document.querySelector(".mode.custom").hidden = mode !== "custom";
    })
  );

  document.querySelectorAll("#ideas .chip").forEach((c) =>
    c.addEventListener("click", () => { $("prompt").value = c.textContent; $("prompt").focus(); })
  );

  const syncInstrumental = () => {
    const inst = $("instrumental").checked;
    $("lyricsWrap").hidden = inst;
    $("genderRow").hidden = inst;
  };
  $("instrumental").addEventListener("change", syncInstrumental);

  $("styleWeight").addEventListener("input", (e) => ($("swOut").textContent = e.target.value));
  $("weird").addEventListener("input", (e) => ($("wdOut").textContent = e.target.value));

  $("clear").addEventListener("click", () => {
    if (!jobs.length || !confirm("Remove all songs from your library? (Links will be lost.)")) return;
    Object.values(timers).forEach(clearTimeout);
    jobs = [];
    save();
    render();
  });

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    const instrumental = $("instrumental").checked;
    const payload = { customMode: mode === "custom", instrumental, model: $("model").value };

    if (mode === "simple") {
      payload.prompt = $("prompt").value.trim();
      if (!payload.prompt) return showError("Describe the song you want.");
    } else {
      Object.assign(payload, {
        title: $("title").value.trim(),
        style: $("style").value.trim(),
        lyrics: instrumental ? "" : $("lyrics").value.trim(),
        negativeTags: $("negativeTags").value.trim(),
        vocalGender: $("vocalGender").value,
        styleWeight: $("styleWeight").value,
        weirdnessConstraint: $("weird").value,
      });
      if (!payload.style && !payload.lyrics && !payload.negativeTags)
        return showError("Add a style or some lyrics.");
    }

    const btn = $("go");
    btn.disabled = true;
    btn.textContent = "Starting…";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      const taskId = data?.data?.taskId;
      if (!res.ok || data.code !== 200 || !taskId) throw new Error(data.msg || `Request failed (${res.status})`);

      const job = {
        taskId,
        label: payload.title || payload.prompt || payload.style || "Untitled",
        model: payload.model,
        status: "PENDING",
        tracks: [],
        createdAt: Date.now(),
      };
      jobs.unshift(job);
      save();
      render();
      poll(job);
      loadCredits();
    } catch (err) {
      showError(err.message || "Something went wrong.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate music";
    }
  });

  function showError(msg) {
    const el = $("error");
    el.textContent = msg;
    el.hidden = !msg;
  }

  // ---------- API ----------
  async function loadCredits() {
    try {
      const r = await fetch("/api/credits");
      const d = await r.json();
      $("credits").textContent = d.code === 200 ? `Credits: ${d.data}` : "Credits: —";
    } catch { /* ignore */ }
  }

  async function poll(job) {
    clearTimeout(timers[job.taskId]);
    if (job.status === "SUCCESS" || FAILED.includes(job.status)) return;
    if (Date.now() - job.createdAt > MAX_POLL_MS) {
      job.status = "TIMEOUT";
      save();
      return render();
    }
    try {
      const r = await fetch(`/api/status?taskId=${encodeURIComponent(job.taskId)}`);
      const d = await r.json();
      if (d.code === 200 && d.data) {
        job.status = d.data.status || job.status;
        job.error = d.data.errorMessage || "";
        const list = d.data.response?.sunoData || [];
        if (list.length) {
          job.tracks = list.map((t) => ({
            id: t.id,
            title: t.title,
            tags: t.tags,
            duration: t.duration,
            image: t.image_url || t.source_image_url,
            audio: t.audio_url || t.source_audio_url,
            stream: t.stream_audio_url || t.source_stream_audio_url,
            lyrics: t.prompt,
          }));
        }
        save();
        render();
      }
    } catch { /* network blip — try again */ }
    if (job.status !== "SUCCESS" && !FAILED.includes(job.status)) {
      timers[job.taskId] = setTimeout(() => poll(job), POLL_MS);
    } else {
      loadCredits();
    }
  }

  // ---------- Rendering ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDur = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "");
  const safeUrl = (u) => (typeof u === "string" && /^https?:\/\//.test(u) ? u : "");

  // Keyed rendering: only rebuild a job's card when its data changed,
  // so audio that is playing in another card is never interrupted.
  const rendered = new Map(); // taskId -> { sig, el }
  function render() {
    const lib = $("library");
    $("empty").hidden = jobs.length > 0;
    const live = new Set(jobs.map((j) => j.taskId));
    for (const [id, r] of rendered) if (!live.has(id)) { r.el.remove(); rendered.delete(id); }
    let prev = null;
    for (const job of jobs) {
      const sig = JSON.stringify([job.status, job.error, job.tracks]);
      let r = rendered.get(job.taskId);
      if (!r || r.sig !== sig) {
        const tmp = document.createElement("div");
        tmp.innerHTML = renderJob(job);
        const el = tmp.firstElementChild;
        if (r) r.el.replaceWith(el);
        r = { sig, el };
        rendered.set(job.taskId, r);
      }
      const want = prev ? prev.nextSibling : lib.firstChild;
      if (r.el !== want) lib.insertBefore(r.el, want);
      prev = r.el;
    }
  }

  function renderJob(job) {
    const failed = FAILED.includes(job.status) || job.status === "TIMEOUT";
    const done = job.status === "SUCCESS";
    const cls = failed ? "fail" : done ? "done" : "work";
    const label = job.status === "TIMEOUT" ? "Timed out" : STATUS_LABEL[job.status] || job.status;
    const playable = job.tracks.filter((t) => t.audio || t.stream);

    let body;
    if (failed) {
      body = `<p class="error">${esc(job.error || label)}</p>`;
    } else if (playable.length) {
      body = `<div class="tracks">${playable.map(renderTrack).join("")}</div>`;
    } else {
      body = `<div class="tracks"><div class="skeleton"></div><div class="skeleton"></div></div>`;
    }

    return `<article class="job">
      <div class="job-head">
        <div class="job-prompt" title="${esc(job.label)}">${esc(job.label)} · ${esc(job.model)}</div>
        <span class="badge ${cls}">${esc(label)}</span>
      </div>
      ${body}
    </article>`;
  }

  function renderTrack(t) {
    const src = safeUrl(t.audio) || safeUrl(t.stream);
    const img = safeUrl(t.image);
    const dl = safeUrl(t.audio);
    return `<div class="track">
      ${img ? `<img src="${esc(img)}" alt="" loading="lazy" />` : `<div class="ph"></div>`}
      <div class="track-body">
        <div class="track-title">${esc(t.title || "Untitled")}</div>
        <div class="track-meta">${esc([t.tags, fmtDur(t.duration)].filter(Boolean).join(" · "))}</div>
        <audio controls preload="none" src="${esc(src)}"></audio>
        ${dl ? `<a class="dl" href="${esc(dl)}" target="_blank" rel="noopener" download>Download MP3</a>` : `<span class="track-meta">Streaming — MP3 coming soon</span>`}
        ${t.lyrics ? `<details><summary>Lyrics</summary><pre>${esc(t.lyrics)}</pre></details>` : ""}
      </div>
    </div>`;
  }

  // ---------- Boot ----------
  syncInstrumental();
  render();
  jobs.forEach(poll);
  loadCredits();
})();
