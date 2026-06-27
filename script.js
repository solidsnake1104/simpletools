// -----------------------------------------------------------
// Seasonal Theme Engine
// -----------------------------------------------------------
(function () {
  const setTheme = (t) => document.documentElement.setAttribute("data-theme", t);
  const detectSeason = () => {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m < 5) return "spring";
    if (m >= 6 && m < 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  };

  const select = document.getElementById("theme-select");
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const saved = localStorage.getItem("simplertools-theme");
  if (saved) {
    if (saved === "auto") setTheme(detectSeason());
    else setTheme(saved);
    if (select) select.value = saved;
  } else {
    if (select) select.value = "auto";
    setTheme(detectSeason());
  }

  if (select) {
    select.addEventListener("change", (e) => {
      const v = e.target.value;
      localStorage.setItem("simplertools-theme", v);
      if (v === "auto") setTheme(detectSeason());
      else setTheme(v);
    });
  }
})();

// -----------------------------------------------------------
// DOMContentLoaded — Initialize Tools
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // ===========================================================
  // PDF JOINER
  // ===========================================================
  const uploadAreaJoin = document.getElementById("uploadAreaJoin");
  const fileInputJoin = document.getElementById("fileInputJoin");
  const fileListJoin = document.getElementById("fileListJoin");
  const processJoinBtn = document.getElementById("processJoinBtn");

  let filesJoin = [];
  let dragIndex = null;

  function updateJoinButton() {
    if (processJoinBtn) {
      processJoinBtn.disabled = filesJoin.length < 2;
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 18px";
    toast.style.background = "rgba(0,0,0,0.65)";
    toast.style.color = "white";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "0.95rem";
    toast.style.backdropFilter = "blur(6px)";
    toast.style.zIndex = "9999";
    toast.style.opacity = "0";
    toast.style.transition = "opacity .3s ease";

    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  async function mergePDFs() {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of filesJoin) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();

    URL.revokeObjectURL(url);
    showToast("Merged PDF Ready");
  }

  if (processJoinBtn) {
    processJoinBtn.addEventListener("click", async () => {
      processJoinBtn.disabled = true;
      processJoinBtn.textContent = "Merging...";
      await mergePDFs();
      processJoinBtn.textContent = "Join Documents";
      updateJoinButton();
    });
  }

  if (uploadAreaJoin && fileInputJoin) {
    uploadAreaJoin.addEventListener("click", () => fileInputJoin.click());

    uploadAreaJoin.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadAreaJoin.classList.add("dragover");
    });

    uploadAreaJoin.addEventListener("dragleave", () => {
      uploadAreaJoin.classList.remove("dragover");
    });

    uploadAreaJoin.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadAreaJoin.classList.remove("dragover");
      appendJoinFiles(Array.from(e.dataTransfer.files));
    });
  }

  if (fileInputJoin) {
    fileInputJoin.addEventListener("change", () => {
      appendJoinFiles(Array.from(fileInputJoin.files));
    });
  }

  function appendJoinFiles(newFiles) {
    newFiles.forEach((file) => {
      const exists = filesJoin.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (!exists) filesJoin.push(file);
    });
    renderJoinList();
    updateJoinButton();
  }

  function renderJoinList() {
    if (!fileListJoin) return;

    fileListJoin.innerHTML = filesJoin
      .map(
        (f, i) => `
      <li class="file-item" draggable="true" data-index="${i}">
        <span class="drag-handle">☰</span>
        <span class="file-name">${f.name}</span>
        <button class="file-remove" onclick="removeFileJoin(${i})">Remove</button>
      </li>
    `
      )
      .join("");

    enableDragReorder();
    updateJoinButton();
  }

  function enableDragReorder() {
    const items = fileListJoin.querySelectorAll(".file-item");

    items.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        dragIndex = Number(e.target.dataset.index);
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const dropIndex = Number(e.target.closest(".file-item").dataset.index);

        const moved = filesJoin.splice(dragIndex, 1)[0];
        filesJoin.splice(dropIndex, 0, moved);

        renderJoinList();
      });
    });
  }

  window.removeFileJoin = function (i) {
    filesJoin.splice(i, 1);
    renderJoinList();
    updateJoinButton();
  };

  // ===========================================================
  // MP3 TRIMMER — WaveSurfer v7 (no regions plugin) +
  //               custom overlay handles + Web Audio trim
  // ===========================================================
  const uploadAreaAudio  = document.getElementById("uploadAreaAudio");
  const audioInput       = document.getElementById("audioInput");
  const trimBtn          = document.getElementById("trimBtn");
  const startTimeEl      = document.getElementById("startTime");
  const endTimeEl        = document.getElementById("endTime");
  const playPauseBtn     = document.getElementById("playPauseBtn");
  const playSelectionBtn = document.getElementById("playSelectionBtn");
  const playbackControls = document.getElementById("playbackControls");
  const waveformEl       = document.getElementById("waveform");

  let wavesurfer  = null;
  let audioBlob   = null;
  let audioBuffer = null;
  let duration    = 0;

  // ── Custom trim overlay (lives in regular DOM, above waveform) ──
  // Structure injected once; shown/hidden as needed.
  let overlayEl = null, selEl = null, handleL = null, handleR = null;

  function buildOverlay() {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement("div");
    overlayEl.id = "trimOverlay";

    selEl = document.createElement("div");
    selEl.id = "trimSelection";

    handleL = document.createElement("div");
    handleL.className = "trim-handle trim-handle-left";
    handleL.title = "Drag to set start";

    handleR = document.createElement("div");
    handleR.className = "trim-handle trim-handle-right";
    handleR.title = "Drag to set end";

    selEl.appendChild(handleL);
    selEl.appendChild(handleR);
    overlayEl.appendChild(selEl);
    waveformEl.appendChild(overlayEl);

    initOverlayDrag();
  }

  // Convert time → pixel offset within the overlay
  function timeToPercent(t) {
    return (t / duration) * 100;
  }
  function percentToTime(pct) {
    return (pct / 100) * duration;
  }

  function renderOverlay() {
    if (!selEl || !duration) return;
    const s = parseFloat(startTimeEl.value) || 0;
    const e = parseFloat(endTimeEl.value)   || duration;
    const leftPct  = timeToPercent(Math.max(0, s));
    const rightPct = timeToPercent(Math.min(duration, e));
    selEl.style.left  = leftPct + "%";
    selEl.style.width = (rightPct - leftPct) + "%";
  }

  function initOverlayDrag() {
    // Drag a handle or the selection body
    let dragging = null; // "left" | "right" | "body"
    let dragStartX = 0;
    let dragStartS = 0;
    let dragStartE = 0;
    let overlayWidth = 0;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function onMove(clientX) {
      const dx = clientX - dragStartX;
      const dt = (dx / overlayWidth) * duration;
      let s = parseFloat(startTimeEl.value);
      let e = parseFloat(endTimeEl.value);
      const MIN_SEL = 0.1;

      if (dragging === "left") {
        s = clamp(dragStartS + dt, 0, dragStartE - MIN_SEL);
        startTimeEl.value = s.toFixed(2);
      } else if (dragging === "right") {
        e = clamp(dragStartE + dt, dragStartS + MIN_SEL, duration);
        endTimeEl.value = e.toFixed(2);
      } else if (dragging === "body") {
        const span = dragStartE - dragStartS;
        s = clamp(dragStartS + dt, 0, duration - span);
        e = s + span;
        startTimeEl.value = s.toFixed(2);
        endTimeEl.value   = e.toFixed(2);
      }
      renderOverlay();
    }

    function startDrag(type, e) {
      e.preventDefault();
      e.stopPropagation();
      dragging     = type;
      dragStartX   = e.touches ? e.touches[0].clientX : e.clientX;
      dragStartS   = parseFloat(startTimeEl.value) || 0;
      dragStartE   = parseFloat(endTimeEl.value)   || duration;
      overlayWidth = overlayEl.getBoundingClientRect().width;

      const moveEvt   = e.touches ? "touchmove"   : "mousemove";
      const upEvt     = e.touches ? "touchend"    : "mouseup";

      function onUp() {
        dragging = null;
        document.removeEventListener(moveEvt, onMoveWrap);
        document.removeEventListener(upEvt,   onUp);
      }
      function onMoveWrap(ev) {
        onMove(ev.touches ? ev.touches[0].clientX : ev.clientX);
      }

      document.addEventListener(moveEvt, onMoveWrap);
      document.addEventListener(upEvt,   onUp);
    }

    handleL.addEventListener("mousedown",  (e) => startDrag("left",  e));
    handleR.addEventListener("mousedown",  (e) => startDrag("right", e));
    selEl.addEventListener(  "mousedown",  (e) => {
      // only drag body if not clicking a handle
      if (e.target === selEl) startDrag("body", e);
    });
    handleL.addEventListener("touchstart", (e) => startDrag("left",  e), { passive: false });
    handleR.addEventListener("touchstart", (e) => startDrag("right", e), { passive: false });
    selEl.addEventListener(  "touchstart", (e) => {
      if (e.target === selEl) startDrag("body", e);
    }, { passive: false });
  }

  // ── Upload area ──────────────────────────────────────────────
  if (uploadAreaAudio && audioInput) {
    uploadAreaAudio.addEventListener("click", () => audioInput.click());
    uploadAreaAudio.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadAreaAudio.classList.add("dragover");
    });
    uploadAreaAudio.addEventListener("dragleave", () =>
      uploadAreaAudio.classList.remove("dragover")
    );
    uploadAreaAudio.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadAreaAudio.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) handleAudioFile(file);
    });
  }

  if (audioInput) {
    audioInput.addEventListener("change", (e) => {
      if (e.target.files[0]) handleAudioFile(e.target.files[0]);
    });
  }

  // ── Core file handler ────────────────────────────────────────
  async function handleAudioFile(file) {
    audioBlob   = file;
    audioBuffer = null;
    duration    = 0;

    // Decode for trimming
    try {
      const arrayBuf = await file.arrayBuffer();
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      audioBuffer = await actx.decodeAudioData(arrayBuf.slice(0));
      actx.close();
    } catch (err) {
      console.warn("Web Audio decode failed:", err);
    }

    if (wavesurfer) {
      wavesurfer.destroy();
      wavesurfer = null;
    }

    // No plugins — we handle selection ourselves
    wavesurfer = WaveSurfer.create({
      container:     "#waveform",
      waveColor:     "#7aaaff",
      progressColor: "#4a6cff",
      height:        120,
    });

    wavesurfer.loadBlob(file);

    wavesurfer.on("ready", () => {
      duration = wavesurfer.getDuration();

      if (startTimeEl) startTimeEl.value = "0.00";
      if (endTimeEl)   endTimeEl.value   = duration.toFixed(2);
      if (trimBtn)     trimBtn.disabled  = false;

      if (playbackControls) playbackControls.style.display = "flex";

      // Build the custom overlay after WaveSurfer has rendered
      buildOverlay();
      renderOverlay();
    });

    wavesurfer.on("play",   () => { if (playPauseBtn) playPauseBtn.textContent = "⏸ Pause"; });
    wavesurfer.on("pause",  () => { if (playPauseBtn) playPauseBtn.textContent = "▶ Play"; });
    wavesurfer.on("finish", () => { if (playPauseBtn) playPauseBtn.textContent = "▶ Play"; });
  }

  // ── Inputs → redraw overlay ──────────────────────────────────
  [startTimeEl, endTimeEl].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", renderOverlay);
  });

  // ── Play / Pause ─────────────────────────────────────────────
  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      if (wavesurfer) wavesurfer.playPause();
    });
  }

  // ── Play Selection ───────────────────────────────────────────
  if (playSelectionBtn) {
    playSelectionBtn.addEventListener("click", () => {
      if (!wavesurfer) return;
      const s = parseFloat(startTimeEl ? startTimeEl.value : 0);
      const e = parseFloat(endTimeEl   ? endTimeEl.value   : 0);
      if (!isNaN(s) && !isNaN(e) && s < e) wavesurfer.play(s, e);
    });
  }

  // ── WAV encoder helper ───────────────────────────────────────
  function encodeWAV(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate  = audioBuffer.sampleRate;
    const numSamples  = audioBuffer.length;
    const bytesPerSample = 2; // 16-bit PCM
    const dataSize    = numSamples * numChannels * bytesPerSample;
    const buffer      = new ArrayBuffer(44 + dataSize);
    const view        = new DataView(buffer);

    // RIFF header
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0,  "RIFF");
    view.setUint32(4,  36 + dataSize, true);
    writeStr(8,  "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);            // chunk size
    view.setUint16(20, 1,  true);            // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate,  true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);            // bits per sample
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);

    // Interleave channels and convert float32 → int16
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
        view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
        offset += 2;
      }
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  // ── Trim & Download ──────────────────────────────────────────
  if (trimBtn) {
    trimBtn.addEventListener("click", async () => {
      const s = parseFloat(startTimeEl ? startTimeEl.value : 0);
      const e = parseFloat(endTimeEl   ? endTimeEl.value   : 0);

      if (isNaN(s) || isNaN(e) || s >= e) {
        alert("Start time must be less than end time.");
        return;
      }
      if (!audioBuffer) {
        alert("Audio not decoded yet — please wait a moment and try again.");
        return;
      }

      trimBtn.disabled    = true;
      trimBtn.textContent = "Encoding…";

      try {
        const sampleRate  = audioBuffer.sampleRate;
        const startSample = Math.floor(s * sampleRate);
        const endSample   = Math.min(Math.ceil(e * sampleRate), audioBuffer.length);
        const numSamples  = endSample - startSample;
        const numChannels = audioBuffer.numberOfChannels;

        // Create a new AudioBuffer with just the selected slice
        const offlineCtx  = new OfflineAudioContext(numChannels, numSamples, sampleRate);
        const trimmedBuf  = offlineCtx.createBuffer(numChannels, numSamples, sampleRate);
        for (let ch = 0; ch < numChannels; ch++) {
          trimmedBuf.copyToChannel(
            audioBuffer.getChannelData(ch).slice(startSample, endSample),
            ch
          );
        }

        const wavBlob    = encodeWAV(trimmedBuf);
        const url        = URL.createObjectURL(wavBlob);
        const a          = document.createElement("a");
        a.href           = url;
        a.download       = "trimmed.wav";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        showToast("Trimmed audio downloaded!");
      } catch (err) {
        console.error("Trim error:", err);
        alert("Trim failed — see browser console for details.");
      } finally {
        trimBtn.disabled    = false;
        trimBtn.textContent = "⬇ Download Trimmed Audio";
      }
    });
  }
});