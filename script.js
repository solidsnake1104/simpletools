// -----------------------------------------------------------
// Shared Utilities — reusable helpers for individual tool scripts
// -----------------------------------------------------------
window.SimplerTools = window.SimplerTools || {};

// Wires up an upload-area + hidden file input with click / drag-drop /
// change handling, and calls onFile(file) whenever a file is provided.
// Tool-specific JS files should use this instead of re-implementing the
// same click/dragover/dragleave/drop listeners each time.
SimplerTools.bindUploadArea = function (options) {
  var area = document.getElementById(options.areaId);
  var input = document.getElementById(options.inputId);
  var onFile = options.onFile || function () {};

  if (!area || !input) return null;

  area.addEventListener("click", function () {
    input.click();
  });

  area.addEventListener("dragover", function (e) {
    e.preventDefault();
    area.classList.add("dragover");
  });

  area.addEventListener("dragleave", function () {
    area.classList.remove("dragover");
  });

  area.addEventListener("drop", function (e) {
    e.preventDefault();
    area.classList.remove("dragover");
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  });

  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    if (file) onFile(file);
  });

  return { area: area, input: input };
};

// Human-readable file size, e.g. 184320 -> "180 KB"
SimplerTools.formatBytes = function (bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  var units = ["KB", "MB", "GB"];
  var value = bytes;
  var i = -1;
  do {
    value /= 1024;
    i++;
  } while (value >= 1024 && i < units.length - 1);
  return value.toFixed(value < 10 ? 1 : 0) + " " + units[i];
};

// -----------------------------------------------------------
// Global Layout — single source of truth for header, nav drawer,
// and footer. Add/remove/reorder tools or site links here ONLY;
// every page's header/menu/footer is generated from this.
// -----------------------------------------------------------
(function () {
  var TOOLS = [
    { name: "Audio &amp; MP3 Trimmer", slug: "mp3-trimmer.html", category: "audio" },
    { name: "Image Compressor", slug: "image-compressor.html", category: "image" },
    { name: "Image Metadata Cleaner", slug: "image-metadata-cleaner.html", category: "image" },
    { name: "Image Resizer", slug: "image-resizer.html", category: "image" },
    { name: "Photo Map Explorer", slug: "photo-map-explorer.html", category: "image" },
    { name: "PDF Joiner", slug: "pdf-joiner.html", category: "pdf" },
    { name: "QR Code Generator", slug: "qr-generator.html", category: "qr" },
    { name: "Text Case Converter", slug: "text-case-converter.html", category: "text" },
    { name: "Video Audio Extractor", slug: "video-audio-extractor.html", category: "video" },
    { name: "Word &amp; Character Counter", slug: "word-counter.html", category: "text" }
  ];

  var SITE_LINKS = [
    { name: "About", slug: "about.html" },
    { name: "Contact", slug: "contact.html" },
    { name: "Privacy Policy", slug: "privacy.html" }
  ];

  // Two small per-page globals, set by an inline <script> before script.js
  // loads:
  //   window.SITE_BASE     "" on root-level pages, "../" inside /tools/.
  //   window.PAGE_TAGLINE  short line shown next to the logo in the header.
  var base = typeof window.SITE_BASE === "string" ? window.SITE_BASE : "";
  var tagline = typeof window.PAGE_TAGLINE === "string" ? window.PAGE_TAGLINE : "Select a tool to get started";
  var atRoot = base === "";

  function toolHref(slug) {
    return atRoot ? "tools/" + slug : slug;
  }
  function siteHref(slug) {
    return base + slug;
  }

  function navLinksHTML(items, hrefFn) {
    return items
      .map(function (item) {
        var dot = item.category ? '<span class="nav-dot"></span>' : "";
        var cat = item.category ? ' data-category="' + item.category + '"' : "";
        return (
          '<li><a class="nav-link"' +
          cat +
          ' href="' +
          hrefFn(item.slug) +
          '">' +
          dot +
          item.name +
          "</a></li>"
        );
      })
      .join("");
  }

  function buildHeaderHTML() {
    return (
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="site-header">' +
      '<div class="container">' +
      '<div class="header-left">' +
      '<button class="icon-btn nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="siteNav">' +
      '<svg class="icon-burger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
      '<svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      "</button>" +
      '<a href="' +
      base +
      'index.html" class="logo-link">' +
      '<img src="' +
      base +
      'logo_transparent.png" alt="SimplerTools logo" class="site-logo" />' +
      "</a>" +
      '<p class="tagline">' +
      tagline +
      "</p>" +
      "</div>" +
      '<div class="header-right">' +
      '<button class="icon-btn theme-toggle" type="button" aria-label="Toggle dark mode">' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</header>"
    );
  }

  function buildDrawerHTML() {
    return (
      '<div class="nav-overlay"></div>' +
      '<nav class="nav-drawer" id="siteNav" aria-label="Site navigation">' +
      '<div class="nav-drawer-header">' +
      "<strong>Menu</strong>" +
      '<button class="icon-btn nav-drawer-close" type="button" aria-label="Close menu">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      "</button>" +
      "</div>" +
      '<p class="nav-section-label">Tools</p>' +
      '<ul class="nav-list">' +
      navLinksHTML(TOOLS, toolHref) +
      "</ul>" +
      '<p class="nav-section-label">Site</p>' +
      '<ul class="nav-list">' +
      navLinksHTML(SITE_LINKS, siteHref) +
      "</ul>" +
      '<div class="nav-drawer-footer">' +
      '<div class="nav-theme-row">' +
      "<span>Appearance</span>" +
      '<div class="segmented" role="group" aria-label="Theme">' +
      '<button type="button" data-theme-option="light">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' +
      "Light</button>" +
      '<button type="button" data-theme-option="auto">Auto</button>' +
      '<button type="button" data-theme-option="dark">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>' +
      "Dark</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</nav>"
    );
  }

  function buildFooterHTML() {
    return (
      '<footer class="site-footer">' +
      '<div class="container">' +
      '<div class="footer-content">' +
      '<p>&copy; <span id="year"></span> SimplerTools &bull; Small apps, big impact.</p>' +
      '<nav class="footer-links">' +
      SITE_LINKS.map(function (item) {
        return '<a href="' + siteHref(item.slug) + '">' + item.name + "</a>";
      }).join("") +
      "</nav>" +
      "</div>" +
      "</div>" +
      "</footer>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Header + skip link + nav drawer: prepend as the first things in <body>.
    if (!document.querySelector(".site-header")) {
      var headerHolder = document.createElement("div");
      headerHolder.innerHTML = buildHeaderHTML() + buildDrawerHTML();
      while (headerHolder.firstChild) {
        document.body.insertBefore(headerHolder.firstChild, document.body.firstChild);
      }
    }

    // Footer: fill in the mount point left in each page's markup, right
    // where the visible footer should sit (after the page content).
    var footerMount = document.getElementById("site-footer-mount");
    if (footerMount) {
      var footerHolder = document.createElement("div");
      footerHolder.innerHTML = buildFooterHTML();
      footerMount.replaceWith(footerHolder.firstChild);
    }

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();

// -----------------------------------------------------------
// Theme Engine — Light / Dark / Auto (system), manual override
// -----------------------------------------------------------
(function () {
  const STORAGE_KEY = "simplertools-color-scheme"; // "light" | "dark" | "auto"
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function apply(mode) {
    if (mode === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
    updateToggleButtons(mode);
  }

  function currentMode() {
    return localStorage.getItem(STORAGE_KEY) || "auto";
  }

  function setMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    apply(mode);
  }

  function updateToggleButtons(mode) {
    document.querySelectorAll("[data-theme-option]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.themeOption === mode);
      btn.setAttribute(
        "aria-pressed",
        btn.dataset.themeOption === mode ? "true" : "false"
      );
    });
  }

  // Initialize immediately (before DOMContentLoaded) to avoid a flash of
  // the wrong theme.
  apply(currentMode());

  // If following system preference, react live to OS-level changes.
  media.addEventListener("change", () => {
    if (currentMode() === "auto") apply("auto");
  });

  // Simple toggle button (header icon): cycles light -> dark -> light,
  // ignoring "auto" so a single tap always gives a predictable result.
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".theme-toggle");
    if (toggle) {
      const isDark = root.getAttribute("data-theme")
        ? root.getAttribute("data-theme") === "dark"
        : media.matches;
      setMode(isDark ? "light" : "dark");
    }

    const option = e.target.closest("[data-theme-option]");
    if (option) {
      setMode(option.dataset.themeOption);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    updateToggleButtons(currentMode());

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();

// -----------------------------------------------------------
// Hamburger Nav Drawer
// -----------------------------------------------------------
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".nav-toggle");
    const drawer = document.querySelector(".nav-drawer");
    const overlay = document.querySelector(".nav-overlay");
    const closeBtn = document.querySelector(".nav-drawer-close");

    if (!toggle || !drawer || !overlay) return;

    function openNav() {
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
    }

    function closeNav() {
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }

    toggle.addEventListener("click", () => {
      const isOpen = drawer.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });

    overlay.addEventListener("click", closeNav);
    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  });
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

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });

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

      try {
        await mergePDFs();
      } catch (err) {
        console.error("PDF merge error:", err);
        alert("Could not merge PDFs. Please check the files and try again.");
      } finally {
        processJoinBtn.textContent = "Join Documents";
        updateJoinButton();
      }
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

      if (!exists) {
        filesJoin.push(file);
      }
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
        <span class="file-name">${escapeHtmlGlobal(f.name)}</span>
        <button class="file-remove" onclick="removeFileJoin(${i})">Remove</button>
      </li>
    `
      )
      .join("");

    enableDragReorder();
    updateJoinButton();
  }

  function enableDragReorder() {
    if (!fileListJoin) return;

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

        const target = e.target.closest(".file-item");
        if (!target) return;

        const dropIndex = Number(target.dataset.index);
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
  // MP3 TRIMMER — WaveSurfer v7 + custom overlay handles
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

  let overlayEl = null;
  let selEl = null;
  let handleL = null;
  let handleR = null;
// ---- Large-file (100MB+/multi-hour) trimming via FFmpeg.wasm ----
// Avoids decoding the whole file to PCM (which needs GBs of RAM).
const TRIM_LARGE_FILE_BYTES = 40 * 1024 * 1024; // ~40 MB threshold
let useFFmpegTrim = false;
let trimFFmpeg = null;
let trimFFmpegReady = false;
let trimFFmpegPromise = null;

function trimLoadScript(src, check) {
  return new Promise((resolve, reject) => {
    if (check && check()) { resolve(); return; }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

async function trimToBlobURL(url, mimeType) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch FFmpeg core: " + url);
  const blob = await res.blob();
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

async function ensureTrimFFmpeg() {
  if (trimFFmpegReady) return trimFFmpeg;
  if (trimFFmpegPromise) return trimFFmpegPromise;
  const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
  trimFFmpegPromise = (async () => {
    await trimLoadScript(
      "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js",
      () => !!window.FFmpeg
    );
    if (!window.FFmpeg || !window.FFmpeg.FFmpeg) {
      throw new Error("FFmpeg.wasm failed to initialise.");
    }
    const { FFmpeg } = window.FFmpeg;
    trimFFmpeg = new FFmpeg();
    const coreURL = await trimToBlobURL(base + "/ffmpeg-core.js", "text/javascript");
    const wasmURL = await trimToBlobURL(base + "/ffmpeg-core.wasm", "application/wasm");
    await trimFFmpeg.load({ coreURL, wasmURL });
    trimFFmpegReady = true;
    return trimFFmpeg;
  })();
  try { return await trimFFmpegPromise; }
  finally { trimFFmpegPromise = null; }
}

// Trim the selected range by stream-copying MP3 frames (no PCM decode).
async function trimLargeFileWithFFmpeg(file, start, end) {
  const ffmpeg = await ensureTrimFFmpeg();
  const isMp3 = /\.mp3$/i.test(file.name);
  const m = String(file.name).match(/\.[a-z0-9]+$/i);
  const inputName = "trim_input" + (m ? m[0].toLowerCase() : ".mp3").replace(/[^.a-z0-9]/g, "");
  const outputName = "trim_output.mp3";
  try { await ffmpeg.deleteFile(inputName); } catch (_) {}
  try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
  const dur = Math.max(0, end - start);
  const args = isMp3
    ? ["-y", "-ss", String(start), "-i", inputName, "-t", String(dur), "-c", "copy", outputName]
    : ["-y", "-ss", String(start), "-i", inputName, "-t", String(dur), "-c:a", "libmp3lame", "-b:a", "192k", outputName];
  await ffmpeg.exec(args);
  const data = await ffmpeg.readFile(outputName);
  try { await ffmpeg.deleteFile(inputName); } catch (_) {}
  try { await ffmpeg.deleteFile(outputName); } catch (_) {}
  return new Blob([data.buffer], { type: "audio/mpeg" });
}

  function buildOverlay() {
    if (!waveformEl) return;

    if (overlayEl) {
      overlayEl.remove();
    }

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

  function timeToPercent(t) {
    if (!duration) return 0;
    return (t / duration) * 100;
  }

  function renderOverlay() {
    if (!selEl || !duration || !startTimeEl || !endTimeEl) return;

    const s = parseFloat(startTimeEl.value) || 0;
    const e = parseFloat(endTimeEl.value) || duration;

    const leftPct = timeToPercent(Math.max(0, s));
    const rightPct = timeToPercent(Math.min(duration, e));

    selEl.style.left = leftPct + "%";
    selEl.style.width = Math.max(0, rightPct - leftPct) + "%";
  }

  function initOverlayDrag() {
    let dragging = null;
    let dragStartX = 0;
    let dragStartS = 0;
    let dragStartE = 0;
    let overlayWidth = 0;

    function clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }

    function onMove(clientX) {
      if (!startTimeEl || !endTimeEl || !duration || !overlayWidth) return;

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
        endTimeEl.value = e.toFixed(2);
      }

      renderOverlay();
    }

    function startDrag(type, e) {
      if (!overlayEl || !startTimeEl || !endTimeEl) return;

      e.preventDefault();
      e.stopPropagation();

      dragging = type;
      dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
      dragStartS = parseFloat(startTimeEl.value) || 0;
      dragStartE = parseFloat(endTimeEl.value) || duration;
      overlayWidth = overlayEl.getBoundingClientRect().width;

      const moveEvt = e.touches ? "touchmove" : "mousemove";
      const upEvt = e.touches ? "touchend" : "mouseup";

      function onUp() {
        dragging = null;
        document.removeEventListener(moveEvt, onMoveWrap);
        document.removeEventListener(upEvt, onUp);
      }

      function onMoveWrap(ev) {
        onMove(ev.touches ? ev.touches[0].clientX : ev.clientX);
      }

      document.addEventListener(moveEvt, onMoveWrap);
      document.addEventListener(upEvt, onUp);
    }

    if (!handleL || !handleR || !selEl) return;

    handleL.addEventListener("mousedown", (e) => startDrag("left", e));
    handleR.addEventListener("mousedown", (e) => startDrag("right", e));

    selEl.addEventListener("mousedown", (e) => {
      if (e.target === selEl) {
        startDrag("body", e);
      }
    });

    handleL.addEventListener(
      "touchstart",
      (e) => startDrag("left", e),
      { passive: false }
    );

    handleR.addEventListener(
      "touchstart",
      (e) => startDrag("right", e),
      { passive: false }
    );

    selEl.addEventListener(
      "touchstart",
      (e) => {
        if (e.target === selEl) {
          startDrag("body", e);
        }
      },
      { passive: false }
    );
  }

  if (uploadAreaAudio && audioInput) {
    uploadAreaAudio.addEventListener("click", () => audioInput.click());

    uploadAreaAudio.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadAreaAudio.classList.add("dragover");
    });

    uploadAreaAudio.addEventListener("dragleave", () => {
      uploadAreaAudio.classList.remove("dragover");
    });

    uploadAreaAudio.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadAreaAudio.classList.remove("dragover");

      const file = e.dataTransfer.files[0];

      if (file) {
        handleAudioFile(file);
      }
    });
  }

  if (audioInput) {
    audioInput.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        handleAudioFile(e.target.files[0]);
      }
    });
  }

  async function handleAudioFile(file) {
    audioBlob = file;
    audioBuffer = null;
    duration = 0;
    useFFmpegTrim = false;

    if (file.size > TRIM_LARGE_FILE_BYTES) {
      useFFmpegTrim = true;
      console.info("Large audio file (" + (file.size / 1048576).toFixed(1) + " MB) — using low-memory FFmpeg trim path.");
    } else try {
      const arrayBuf = await file.arrayBuffer();
      const actx = new (window.AudioContext || window.webkitAudioContext)();

      audioBuffer = await actx.decodeAudioData(arrayBuf.slice(0));

      if (actx.close) {
        actx.close();
      }
    } catch (err) {
      console.warn("Web Audio decode failed; using FFmpeg trim path:", err);
      useFFmpegTrim = true;
    }

    if (wavesurfer) {
      wavesurfer.destroy();
      wavesurfer = null;
    }

    // Large files: skip WaveSurfer (it decodes the whole file again).
    if (useFFmpegTrim) {
      if (waveformEl) {
        waveformEl.innerHTML = '<p style="padding:1rem;color:#9aa;font-size:0.9rem;">Large file loaded — waveform preview disabled to conserve memory. Set start/end times and trim.</p>';
      }
      const tmp = document.createElement("audio");
      tmp.preload = "metadata";
      tmp.src = URL.createObjectURL(file);
      tmp.onloadedmetadata = () => {
        duration = Number.isFinite(tmp.duration) ? tmp.duration : 0;
        if (startTimeEl) startTimeEl.value = "0.00";
        if (endTimeEl) endTimeEl.value = duration.toFixed(2);
        if (trimBtn) trimBtn.disabled = false;
        if (playbackControls) playbackControls.style.display = "none";
        URL.revokeObjectURL(tmp.src);
      };
      tmp.onerror = () => { if (trimBtn) trimBtn.disabled = false; };
      return;
    }
    if (!window.WaveSurfer || !waveformEl) {
      return;
    }

    wavesurfer = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#7aaaff",
      progressColor: "#4a6cff",
      height: 120
    });

    wavesurfer.loadBlob(file);

    wavesurfer.on("ready", () => {
      duration = wavesurfer.getDuration();

      if (startTimeEl) startTimeEl.value = "0.00";
      if (endTimeEl) endTimeEl.value = duration.toFixed(2);
      if (trimBtn) trimBtn.disabled = false;
      if (playbackControls) playbackControls.style.display = "flex";

      buildOverlay();
      renderOverlay();
    });

    wavesurfer.on("play", () => {
      if (playPauseBtn) playPauseBtn.textContent = "⏸ Pause";
    });

    wavesurfer.on("pause", () => {
      if (playPauseBtn) playPauseBtn.textContent = "▶ Play";
    });

    wavesurfer.on("finish", () => {
      if (playPauseBtn) playPauseBtn.textContent = "▶ Play";
    });
  }

  [startTimeEl, endTimeEl].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", renderOverlay);
  });

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      if (wavesurfer) {
        wavesurfer.playPause();
      }
    });
  }

  if (playSelectionBtn) {
    playSelectionBtn.addEventListener("click", () => {
      if (!wavesurfer) return;

      const s = parseFloat(startTimeEl ? startTimeEl.value : 0);
      const e = parseFloat(endTimeEl ? endTimeEl.value : 0);

      if (!isNaN(s) && !isNaN(e) && s < e) {
        wavesurfer.play(s, e);
      }
    });
  }

  // ===========================================================
  // SHARED WAV ENCODER
  // ===========================================================
  function encodeWAV(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numSamples = buffer.length;
    const bytesPerSample = 2;
    const dataSize = numSamples * numChannels * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    const writeStr = (off, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(off + i, str.charCodeAt(i));
      }
    };

    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);

    writeStr(8, "WAVE");

    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);

    writeStr(36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;

    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(
          offset,
          sample < 0 ? sample * 32768 : sample * 32767,
          true
        );
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  // ===========================================================
  // MP3 TRIMMER — Trim & Download
  // ===========================================================
  if (trimBtn) {
    trimBtn.addEventListener("click", async () => {
      const s = parseFloat(startTimeEl ? startTimeEl.value : 0);
      const e = parseFloat(endTimeEl ? endTimeEl.value : 0);

      if (isNaN(s) || isNaN(e) || s >= e) {
        alert("Start time must be less than end time.");
        return;
      }

      if (useFFmpegTrim || !audioBuffer) {
        trimBtn.disabled = true;
        const prevLabel = trimBtn.textContent;
        trimBtn.textContent = "Trimming…";
        try {
          const trimmedBlob = await trimLargeFileWithFFmpeg(audioBlob, s, e);
          const url = URL.createObjectURL(trimmedBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "trimmed.mp3";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          showToast("Trimmed audio downloaded!");
        } catch (err) {
          console.error("FFmpeg trim error:", err);
          alert("Trim failed: " + (err && err.message ? err.message : err));
        } finally {
          trimBtn.disabled = false;
          trimBtn.textContent = prevLabel;
        }
        return;
      }
      if (!audioBuffer) {
        alert("Audio not decoded yet — please wait a moment and try again.");
        return;
      }

      trimBtn.disabled = true;
      trimBtn.textContent = "Encoding…";

      try {
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(s * sampleRate);
        const endSample = Math.min(Math.ceil(e * sampleRate), audioBuffer.length);
        const numSamples = endSample - startSample;
        const numChannels = audioBuffer.numberOfChannels;

        const offlineCtx = new OfflineAudioContext(
          numChannels,
          numSamples,
          sampleRate
        );

        const trimmedBuf = offlineCtx.createBuffer(
          numChannels,
          numSamples,
          sampleRate
        );

        for (let ch = 0; ch < numChannels; ch++) {
          trimmedBuf.copyToChannel(
            audioBuffer.getChannelData(ch).slice(startSample, endSample),
            ch
          );
        }

        const wavBlob = encodeWAV(trimmedBuf);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "trimmed.wav";
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast("Trimmed audio downloaded!");
      } catch (err) {
        console.error("Trim error:", err);
        alert("Trim failed — see browser console for details.");
      } finally {
        trimBtn.disabled = false;
        trimBtn.textContent = "⬇ Download Trimmed Audio";
      }
    });
  }

  // ===========================================================
  // VIDEO AUDIO EXTRACTOR — Native first, FFmpeg.wasm fallback
  // ===========================================================
  const uploadAreaVideo  = document.getElementById("uploadAreaVideo");
  const videoInput       = document.getElementById("videoInput");
  const videoPreviewWrap = document.getElementById("videoPreviewWrap");
  const videoPreview     = document.getElementById("videoPreview");
  const videoMeta        = document.getElementById("videoMeta");
  const extractControls  = document.getElementById("extractControls");
  const extractBtn       = document.getElementById("extractBtn");
  const extractStatus    = document.getElementById("extractStatus");
  const progressBar      = document.getElementById("progressBar");
  const statusMsg        = document.getElementById("statusMsg");
  const audioPreviewWrap = document.getElementById("audioPreviewWrap");
  const audioPreview     = document.getElementById("audioPreview");
  const downloadBtn      = document.getElementById("downloadBtn");
  const resetBtn         = document.getElementById("resetBtn");
  const outputFmt        = document.getElementById("outputFmt");

  if (!uploadAreaVideo) return;

  let vaeFile = null;
  let vaeBlob = null;
  let vaeExt = "m4a";
  let vaeObjectUrl = null;
  let vaeDecoded = null;

  let vaeFFmpeg = null;
  let vaeFFmpegReady = false;
  let vaeFFmpegLoadingPromise = null;

  const VAE_FFMPEG_SCRIPT =
    "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";

  const VAE_FFMPEG_CORE_BASE =
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

  uploadAreaVideo.addEventListener("click", () => {
    if (videoInput) {
      videoInput.click();
    }
  });

  uploadAreaVideo.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadAreaVideo.classList.add("dragover");
  });

  uploadAreaVideo.addEventListener("dragleave", () => {
    uploadAreaVideo.classList.remove("dragover");
  });

  uploadAreaVideo.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadAreaVideo.classList.remove("dragover");

    const file = e.dataTransfer.files[0];

    if (file) {
      loadVideoFile(file);
    }
  });

  if (videoInput) {
    videoInput.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        loadVideoFile(e.target.files[0]);
      }
    });
  }

  function loadVideoFile(file) {
    vaeFile = file;
    vaeBlob = null;
    vaeDecoded = null;

    if (vaeObjectUrl) {
      URL.revokeObjectURL(vaeObjectUrl);
      vaeObjectUrl = null;
    }

    vaeObjectUrl = URL.createObjectURL(file);

    if (videoPreview) {
      videoPreview.src = vaeObjectUrl;
      videoPreview.load();

      videoPreview.onloadedmetadata = () => {
        const dur = Number.isFinite(videoPreview.duration)
          ? videoPreview.duration
          : 0;

        const mins = Math.floor(dur / 60);
        const secs = (dur % 60).toFixed(1);
        const mb = (file.size / 1024 / 1024).toFixed(1);

        if (videoMeta) {
          videoMeta.innerHTML =
            `<span>📄 ${escapeHtmlGlobal(file.name)}</span>` +
            `<span>⏱ ${mins}m ${secs}s</span>` +
            `<span>💾 ${mb} MB</span>`;
        }
      };
    }

    if (videoPreviewWrap) videoPreviewWrap.style.display = "flex";
    if (extractControls) extractControls.style.display = "block";
    if (extractStatus) extractStatus.style.display = "none";
    if (audioPreviewWrap) audioPreviewWrap.style.display = "none";
    if (extractBtn) extractBtn.disabled = false;

    setProgress(0, "");
  }

  function escapeHtmlGlobal(value) {
    return String(value).replace(/[&<>'"]/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[ch]));
  }

  function setProgress(pct, msg) {
    if (progressBar) {
      progressBar.style.width = pct + "%";
    }

    if (statusMsg) {
      statusMsg.textContent = msg;
    }
  }

  function loadScriptOnce(src, check) {
    return new Promise((resolve, reject) => {
      if (check && check()) {
        resolve();
        return;
      }

      const existing = Array.from(document.scripts).find((script) => {
        return script.src === src;
      });

      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load " + src)),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");

      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load " + src));

      document.head.appendChild(script);
    });
  }

  async function vaeToBlobURL(url, mimeType) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch FFmpeg core file: " + url);
    }

    const blob = await response.blob();

    return URL.createObjectURL(
      new Blob([blob], {
        type: mimeType
      })
    );
  }

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(label + " timed out."));
        }, ms);
      })
    ]);
  }

  async function decodeVideoAudioNative(file) {
    const arrayBuf = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) {
      throw new Error("This browser does not support the Web Audio API.");
    }

    const actx = new AudioCtx();

    try {
      return await actx.decodeAudioData(arrayBuf.slice(0));
    } finally {
      if (actx.close) {
        actx.close();
      }
    }
  }

  function vaeEncodeMP3(buffer) {
    const numChannels = Math.min(2, buffer.numberOfChannels);
    const sampleRate = buffer.sampleRate;
    const mp3enc = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
    const blockSize = 1152;
    const mp3Data = [];

    function toInt16(floatArr) {
      const out = new Int16Array(floatArr.length);

      for (let i = 0; i < floatArr.length; i++) {
        const s = Math.max(-1, Math.min(1, floatArr[i]));
        out[i] = s < 0 ? s * 32768 : s * 32767;
      }

      return out;
    }

    const left = toInt16(buffer.getChannelData(0));
    const right = numChannels > 1
      ? toInt16(buffer.getChannelData(1))
      : left;

    for (let i = 0; i < left.length; i += blockSize) {
      const enc = numChannels > 1
        ? mp3enc.encodeBuffer(
            left.subarray(i, i + blockSize),
            right.subarray(i, i + blockSize)
          )
        : mp3enc.encodeBuffer(
            left.subarray(i, i + blockSize)
          );

      if (enc.length > 0) {
        mp3Data.push(new Uint8Array(enc));
      }

      if (i % (blockSize * 80) === 0) {
        const progress = 80 + Math.min(15, Math.round((i / left.length) * 15));
        setProgress(progress, "Encoding MP3…");
      }
    }

    const flushed = mp3enc.flush();

    if (flushed.length > 0) {
      mp3Data.push(new Uint8Array(flushed));
    }

    return new Blob(mp3Data, {
      type: "audio/mpeg"
    });
  }

  async function extractNative(file, fmt) {
    if (!vaeDecoded) {
      setProgress(25, "Trying browser audio decoder…");
      vaeDecoded = await decodeVideoAudioNative(file);
    }

    if (fmt === "mp3") {
      setProgress(70, "Loading MP3 encoder…");

      await loadScriptOnce(
        "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js",
        () => !!window.lamejs
      );

      setProgress(80, "Encoding MP3…");

      return {
        blob: vaeEncodeMP3(vaeDecoded),
        ext: "mp3",
        mime: "audio/mpeg"
      };
    }

    if (fmt === "aac") {
      throw new Error("Browser-native AAC export unavailable; using FFmpeg fallback.");
    }

    setProgress(75, "Encoding WAV…");

    return {
      blob: encodeWAV(vaeDecoded),
      ext: "wav",
      mime: "audio/wav"
    };
  }

  async function ensureVaeFFmpeg() {
    if (vaeFFmpegReady) {
      return vaeFFmpeg;
    }

    if (vaeFFmpegLoadingPromise) {
      return vaeFFmpegLoadingPromise;
    }

    vaeFFmpegLoadingPromise = (async () => {
      setProgress(10, "Loading FFmpeg.wasm…");

      await loadScriptOnce(
        VAE_FFMPEG_SCRIPT,
        () => !!window.FFmpeg
      );

      if (!window.FFmpeg || !window.FFmpeg.FFmpeg) {
        throw new Error("FFmpeg.wasm loaded, but window.FFmpeg.FFmpeg was not found.");
      }

      const { FFmpeg } = window.FFmpeg;
      vaeFFmpeg = new FFmpeg();

      vaeFFmpeg.on("progress", ({ progress }) => {
        if (typeof progress === "number" && Number.isFinite(progress)) {
          const pct = 35 + Math.min(55, Math.round(progress * 55));
          setProgress(pct, "FFmpeg processing…");
        }
      });

      vaeFFmpeg.on("log", ({ message }) => {
        if (/error|invalid|unsupported|failed/i.test(message)) {
          console.warn("FFmpeg:", message);
        }
      });

      const coreURL = await vaeToBlobURL(
        `${VAE_FFMPEG_CORE_BASE}/ffmpeg-core.js`,
        "text/javascript"
      );

      const wasmURL = await vaeToBlobURL(
        `${VAE_FFMPEG_CORE_BASE}/ffmpeg-core.wasm`,
        "application/wasm"
      );

      await withTimeout(
        vaeFFmpeg.load({
          coreURL,
          wasmURL
        }),
        90000,
        "FFmpeg.wasm load"
      );

      vaeFFmpegReady = true;
      return vaeFFmpeg;
    })();

    try {
      return await vaeFFmpegLoadingPromise;
    } finally {
      vaeFFmpegLoadingPromise = null;
    }
  }

  function vaeInputName(fileName) {
    const match = String(fileName).match(/\.[a-z0-9]+$/i);
    const ext = match ? match[0].toLowerCase() : ".mp4";

    return "input" + ext.replace(/[^.a-z0-9]/g, "");
  }

  function vaeOutputInfo(fmt) {
    if (fmt === "mp3") {
      return {
        name: "output.mp3",
        ext: "mp3",
        mime: "audio/mpeg"
      };
    }

    if (fmt === "wav") {
      return {
        name: "output.wav",
        ext: "wav",
        mime: "audio/wav"
      };
    }

    return {
      name: "output.m4a",
      ext: "m4a",
      mime: "audio/mp4"
    };
  }

  async function vaeDeleteIfExists(name) {
    try {
      await vaeFFmpeg.deleteFile(name);
    } catch (_) {
      // Ignore missing file.
    }
  }

  async function extractWithFFmpeg(file, fmt) {
    const ffmpeg = await ensureVaeFFmpeg();
    const inputName = vaeInputName(file.name);
    const output = vaeOutputInfo(fmt);

    await vaeDeleteIfExists(inputName);
    await vaeDeleteIfExists(output.name);

    setProgress(20, "Copying file into FFmpeg…");

    const fileData = new Uint8Array(await file.arrayBuffer());
    await ffmpeg.writeFile(inputName, fileData);

    if (fmt === "aac") {
      setProgress(35, "Extracting audio to M4A…");

      try {
        await ffmpeg.exec([
          "-y",
          "-i", inputName,
          "-vn",
          "-map", "0:a:0",
          "-c:a", "copy",
          "-movflags", "+faststart",
          output.name
        ]);
      } catch (copyErr) {
        console.warn("AAC stream copy failed; transcoding instead.", copyErr);

        await vaeDeleteIfExists(output.name);

        setProgress(45, "Converting audio to AAC…");

        await ffmpeg.exec([
          "-y",
          "-i", inputName,
          "-vn",
          "-map", "0:a:0",
          "-c:a", "aac",
          "-b:a", "192k",
          "-movflags", "+faststart",
          output.name
        ]);
      }
    } else if (fmt === "mp3") {
      setProgress(35, "Converting audio to MP3…");

      await ffmpeg.exec([
        "-y",
        "-i", inputName,
        "-vn",
        "-map", "0:a:0",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        output.name
      ]);
    } else {
      setProgress(35, "Converting audio to WAV…");

      await ffmpeg.exec([
        "-y",
        "-i", inputName,
        "-vn",
        "-map", "0:a:0",
        "-c:a", "pcm_s16le",
        output.name
      ]);
    }

    setProgress(92, "Reading output…");

    const data = await ffmpeg.readFile(output.name);

    await vaeDeleteIfExists(inputName);
    await vaeDeleteIfExists(output.name);

    return {
      blob: new Blob([data.buffer], {
        type: output.mime
      }),
      ext: output.ext,
      mime: output.mime
    };
  }

  if (extractBtn) {
    extractBtn.addEventListener("click", async () => {
      if (!vaeFile) return;

      const fmt = outputFmt ? outputFmt.value : "aac";

      extractBtn.disabled = true;

      if (extractStatus) {
        extractStatus.style.display = "block";
      }

      if (audioPreviewWrap) {
        audioPreviewWrap.style.display = "none";
      }

      setProgress(5, "Preparing…");

      try {
        let result;

        try {
          result = await extractNative(vaeFile, fmt);
        } catch (nativeErr) {
          console.warn("Native extraction failed; falling back to FFmpeg.wasm.", nativeErr);

          setProgress(8, "Switching to FFmpeg.wasm…");

          result = await extractWithFFmpeg(vaeFile, fmt);
        }

        vaeBlob = result.blob;
        vaeExt = result.ext;

        const previewUrl = URL.createObjectURL(vaeBlob);

        if (audioPreview) {
          audioPreview.src = previewUrl;
          audioPreview.load();
        }

        if (downloadBtn) {
          downloadBtn.textContent = `⬇ Download ${vaeExt.toUpperCase()}`;
        }

        if (audioPreviewWrap) {
          audioPreviewWrap.style.display = "flex";
        }

        setProgress(100, "Done!");
        showToast("Audio extracted!");
      } catch (err) {
        console.error("Extraction error:", err);

        setProgress(0, "");

        if (extractStatus) {
          extractStatus.style.display = "none";
        }

        alert(
          "Could not extract audio.\n\n" +
          "If you are opening the page directly with file://, try serving it from http://localhost instead.\n\n" +
          (err && err.message ? err.message : err)
        );
      } finally {
        extractBtn.disabled = false;
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!vaeBlob) return;

      const baseName = vaeFile
        ? vaeFile.name.replace(/\.[^.]+$/, "")
        : "audio";

      const url = URL.createObjectURL(vaeBlob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${baseName}-audio.${vaeExt}`;
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 10000);

      showToast("Download started!");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      vaeFile = null;
      vaeBlob = null;
      vaeDecoded = null;

      if (videoPreview) {
        videoPreview.pause();
        videoPreview.src = "";
      }

      if (vaeObjectUrl) {
        URL.revokeObjectURL(vaeObjectUrl);
        vaeObjectUrl = null;
      }

      if (videoInput) {
        videoInput.value = "";
      }

      if (audioPreview) {
        audioPreview.src = "";
      }

      if (videoPreviewWrap) {
        videoPreviewWrap.style.display = "none";
      }

      if (extractControls) {
        extractControls.style.display = "none";
      }

      if (extractStatus) {
        extractStatus.style.display = "none";
      }

      if (audioPreviewWrap) {
        audioPreviewWrap.style.display = "none";
      }

      if (progressBar) {
        progressBar.style.width = "0%";
      }

      if (statusMsg) {
        statusMsg.textContent = "";
      }
    });
  }
});