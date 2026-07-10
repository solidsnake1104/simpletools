document.addEventListener("DOMContentLoaded", () => {
  const fileSummary = document.getElementById("psFileSummary");
  const fileNameEl = document.getElementById("psFileName");
  const pageCountEl = document.getElementById("psPageCount");
  const modeSection = document.getElementById("psModeSection");
  const thumbGrid = document.getElementById("psThumbGrid");

  const selectAllBtn = document.getElementById("psSelectAllBtn");
  const selectNoneBtn = document.getElementById("psSelectNoneBtn");
  const invertBtn = document.getElementById("psInvertBtn");
  const countEl = document.getElementById("psCount");

  const extractBtn = document.getElementById("psExtractBtn");
  const separateBtn = document.getElementById("psSeparateBtn");
  const statusLine = document.getElementById("psStatusLine");

  let originalFile = null;
  let pageCount = 0;
  let selected = new Set(); // 0-indexed page numbers

  if (!modeSection) return;

  // PDF.js needs its worker pointed at the matching version on the CDN.
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }

  SimplerTools.bindUploadArea({
    areaId: "uploadAreaSplit",
    inputId: "fileInputSplit",
    onFile: handleFile,
  });

  async function handleFile(file) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file.");
      return;
    }

    setStatus("");
    thumbGrid.innerHTML = "";
    selected = new Set();
    modeSection.style.display = "none";
    fileSummary.style.display = "none";

    try {
      // pdf-lib reads the page count reliably up front; PDF.js (below)
      // handles the actual visual rendering of each page.
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = PDFLib;
      const pdf = await PDFDocument.load(bytes);

      originalFile = file;
      pageCount = pdf.getPageCount();

      fileNameEl.textContent = file.name;
      pageCountEl.textContent = pageCount + (pageCount === 1 ? " page" : " pages");
      fileSummary.style.display = "flex";
      modeSection.style.display = "block";

      // Default to everything selected — deselecting a few pages is
      // usually less work than picking them all one by one.
      for (let i = 0; i < pageCount; i++) selected.add(i);

      await renderThumbnails(file);
      updateCount();
    } catch (err) {
      console.error("PDF read error:", err);
      alert("Could not read this PDF. It may be corrupted or password-protected.");
    }
  }

  async function renderThumbnails(file) {
    if (!window.pdfjsLib) {
      setStatus("Page previews aren't available right now, but selection still works below.", true);
      buildFallbackGrid();
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const doc = await loadingTask.promise;

    const targetWidth = 150;

    for (let i = 1; i <= pageCount; i++) {
      setStatus(`Rendering page previews… (${i} of ${pageCount})`);

      const thumb = document.createElement("div");
      thumb.className = "ps-thumb is-selected";
      thumb.dataset.index = String(i - 1);

      const loading = document.createElement("div");
      loading.className = "ps-thumb-loading";
      loading.textContent = "…";
      thumb.appendChild(loading);

      const badge = document.createElement("span");
      badge.className = "ps-thumb-badge";
      badge.textContent = "Page " + i;
      thumb.appendChild(badge);

      const check = document.createElement("span");
      check.className = "ps-thumb-check";
      check.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
      thumb.appendChild(check);

      thumb.addEventListener("click", () => toggleSelection(i - 1, thumb));
      thumbGrid.appendChild(thumb);

      try {
        const page = await doc.getPage(i);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        await page.render({ canvasContext: ctx, viewport }).promise;

        thumb.replaceChild(canvas, loading);
      } catch (err) {
        console.error("Page render error:", err);
        loading.textContent = "Preview unavailable";
      }
    }

    setStatus("");
  }

  // If PDF.js isn't available for some reason, still let people pick
  // pages by number instead of leaving the tool unusable.
  function buildFallbackGrid() {
    for (let i = 0; i < pageCount; i++) {
      const thumb = document.createElement("div");
      thumb.className = "ps-thumb is-selected";
      thumb.dataset.index = String(i);
      thumb.style.aspectRatio = "3 / 4";
      thumb.style.display = "flex";
      thumb.style.alignItems = "center";
      thumb.style.justifyContent = "center";
      thumb.style.fontWeight = "700";
      thumb.textContent = "Page " + (i + 1);

      const check = document.createElement("span");
      check.className = "ps-thumb-check";
      check.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
      thumb.appendChild(check);

      thumb.addEventListener("click", () => toggleSelection(i, thumb));
      thumbGrid.appendChild(thumb);
    }
  }

  function toggleSelection(index, thumbEl) {
    if (selected.has(index)) {
      selected.delete(index);
      thumbEl.classList.remove("is-selected");
    } else {
      selected.add(index);
      thumbEl.classList.add("is-selected");
    }
    updateCount();
  }

  function setAllThumbs(isSelected) {
    selected = new Set();
    thumbGrid.querySelectorAll(".ps-thumb").forEach((thumbEl) => {
      thumbEl.classList.toggle("is-selected", isSelected);
      if (isSelected) selected.add(Number(thumbEl.dataset.index));
    });
    updateCount();
  }

  selectAllBtn.addEventListener("click", () => setAllThumbs(true));
  selectNoneBtn.addEventListener("click", () => setAllThumbs(false));

  invertBtn.addEventListener("click", () => {
    const next = new Set();
    thumbGrid.querySelectorAll(".ps-thumb").forEach((thumbEl) => {
      const index = Number(thumbEl.dataset.index);
      const willBeSelected = !selected.has(index);
      thumbEl.classList.toggle("is-selected", willBeSelected);
      if (willBeSelected) next.add(index);
    });
    selected = next;
    updateCount();
  });

  function updateCount() {
    countEl.textContent = `${selected.size} of ${pageCount} pages selected`;
    const hasSelection = selected.size > 0;
    extractBtn.disabled = !hasSelection;
    separateBtn.disabled = !hasSelection;
  }

  function setStatus(message, isError) {
    statusLine.textContent = message;
    statusLine.classList.toggle("is-error", !!isError);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function sortedSelection() {
    return Array.from(selected).sort((a, b) => a - b);
  }

  extractBtn.addEventListener("click", async () => {
    if (!originalFile || !selected.size) return;

    extractBtn.disabled = true;
    extractBtn.textContent = "Extracting…";
    setStatus("");

    try {
      const { PDFDocument } = PDFLib;
      const bytes = await originalFile.arrayBuffer();
      const source = await PDFDocument.load(bytes);
      const output = await PDFDocument.create();

      const copiedPages = await output.copyPages(source, sortedSelection());
      copiedPages.forEach((p) => output.addPage(p));

      const outBytes = await output.save();
      const blob = new Blob([outBytes], { type: "application/pdf" });
      const base = originalFile.name.replace(/\.pdf$/i, "");

      downloadBlob(blob, `${base}-selected.pdf`);
      SimplerTools.showToast("Selected pages ready");
    } catch (err) {
      console.error("PDF extract error:", err);
      setStatus("Could not extract those pages. Please try again.", true);
    } finally {
      extractBtn.textContent = "Download Selected as One PDF";
      updateCount();
    }
  });

  separateBtn.addEventListener("click", async () => {
    if (!originalFile || !selected.size) return;

    separateBtn.disabled = true;
    separateBtn.textContent = "Splitting…";
    setStatus("");

    try {
      const { PDFDocument } = PDFLib;
      const bytes = await originalFile.arrayBuffer();
      const source = await PDFDocument.load(bytes);
      const base = originalFile.name.replace(/\.pdf$/i, "");
      const pages = sortedSelection();
      const digits = String(pageCount).length;

      if (pages.length === 1) {
        // Single page selected — skip the ZIP, just hand back the PDF.
        const output = await PDFDocument.create();
        const [copiedPage] = await output.copyPages(source, pages);
        output.addPage(copiedPage);
        const outBytes = await output.save();
        const pageNumber = String(pages[0] + 1).padStart(digits, "0");

        downloadBlob(
          new Blob([outBytes], { type: "application/pdf" }),
          `${base}-page-${pageNumber}.pdf`
        );
      } else {
        const zip = new JSZip();

        for (const pageIndex of pages) {
          const output = await PDFDocument.create();
          const [copiedPage] = await output.copyPages(source, [pageIndex]);
          output.addPage(copiedPage);

          const outBytes = await output.save();
          const pageNumber = String(pageIndex + 1).padStart(digits, "0");
          zip.file(`${base}-page-${pageNumber}.pdf`, outBytes);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `${base}-split-pages.zip`);
      }

      SimplerTools.showToast("Split PDFs ready");
    } catch (err) {
      console.error("PDF split error:", err);
      setStatus("Could not split this PDF. Please try again.", true);
    } finally {
      separateBtn.textContent = "Download Selected as Separate Files";
      updateCount();
    }
  });
});