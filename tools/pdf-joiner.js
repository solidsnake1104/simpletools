document.addEventListener("DOMContentLoaded", () => {
  const fileListEl = document.getElementById("fileListJoin");
  const processBtn = document.getElementById("processJoinBtn");
  let selectedFiles = [];

  SimplerTools.bindUploadArea({
    areaId: "uploadAreaJoin",
    inputId: "fileInputJoin",
    onFiles: handleFiles,
  });

  function handleFiles(files) {
    const pdfFiles = Array.prototype.slice.call(files || []).filter((file) => {
      return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    });

    if (!pdfFiles.length) {
      alert("Please select one or more PDF files.");
      return;
    }

    selectedFiles = pdfFiles;
    renderFileList();
  }

  let dragState = null;

  function renderFileList() {
    fileListEl.innerHTML = "";

    if (!selectedFiles.length) {
      fileListEl.innerHTML = '<li class="file-list-empty">Drop or choose PDF files to start.</li>';
      processBtn.disabled = true;
      return;
    }

    selectedFiles.forEach((file, index) => {
      const item = document.createElement("li");
      item.className = "file-item";
      item._file = file;

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "drag-handle";
      handle.textContent = "☰";
      handle.title = "Drag to reorder";
      handle.setAttribute("aria-label", "Drag to reorder");
      handle.style.touchAction = "none";
      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        startDrag(event, item);
      });

      const label = document.createElement("div");
      label.className = "file-name";
      label.textContent = `${index + 1}. ${file.name} (${SimplerTools.formatBytes(file.size)})`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "file-remove";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        selectedFiles.splice(index, 1);
        renderFileList();
      });

      item.append(handle, label, removeButton);
      fileListEl.appendChild(item);
    });

    processBtn.disabled = selectedFiles.length === 0;
  }

  function startDrag(event, item) {
    if (dragState) return;

    const rect = item.getBoundingClientRect();
    const placeholder = document.createElement("li");
    placeholder.className = "file-item placeholder";
    placeholder.style.height = `${rect.height}px`;

    item.classList.add("dragging");
    item.style.width = `${rect.width}px`;
    item.style.position = "absolute";
    item.style.left = `${rect.left}px`;
    item.style.top = `${rect.top}px`;
    item.style.zIndex = "1000";
    item.style.pointerEvents = "none";

    fileListEl.insertBefore(placeholder, item.nextSibling);
    fileListEl.appendChild(item);
    item.setPointerCapture(event.pointerId);

    dragState = {
      item,
      placeholder,
      pointerId: event.pointerId,
      offsetY: event.clientY - rect.top,
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const y = event.clientY - dragState.offsetY;
    dragState.item.style.top = `${y}px`;

    const siblings = Array.from(fileListEl.querySelectorAll(".file-item:not(.dragging):not(.placeholder)"));
    let insertBefore = null;

    for (const sibling of siblings) {
      const rect = sibling.getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        insertBefore = sibling;
        break;
      }
    }

    if (insertBefore) {
      fileListEl.insertBefore(dragState.placeholder, insertBefore);
    } else {
      fileListEl.appendChild(dragState.placeholder);
    }
  }

  function onPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    if (dragState.placeholder.parentNode === fileListEl) {
      fileListEl.insertBefore(dragState.item, dragState.placeholder);
    }

    cleanupDrag();
    rebuildOrderFromList();
  }

  function cleanupDrag() {
    const { item, placeholder } = dragState;
    item.classList.remove("dragging");
    item.style.position = "";
    item.style.width = "";
    item.style.left = "";
    item.style.top = "";
    item.style.zIndex = "";
    item.style.pointerEvents = "";
    placeholder.remove();

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);
    dragState = null;
  }

  function rebuildOrderFromList() {
    selectedFiles = Array.from(fileListEl.querySelectorAll(".file-item")).map((item) => item._file);
    renderFileList();
  }

  processBtn.addEventListener("click", async () => {
    if (!selectedFiles.length) return;

    processBtn.disabled = true;
    processBtn.textContent = "Joining…";

    try {
      const { PDFDocument } = PDFLib;
      const output = await PDFDocument.create();

      for (const file of selectedFiles) {
        const bytes = await file.arrayBuffer();
        const source = await PDFDocument.load(bytes);
        const pageIndices = Array.from({ length: source.getPageCount() }, (_, i) => i);
        const copiedPages = await output.copyPages(source, pageIndices);

        copiedPages.forEach((page) => output.addPage(page));
      }

      const mergedBytes = await output.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const filename = getOutputFilename();

      downloadBlob(blob, filename);
      SimplerTools.showToast("Merged PDF ready");
    } catch (err) {
      console.error("PDF join error:", err);
      alert("Could not join these PDFs. Please make sure the files are valid PDF documents.");
    } finally {
      processBtn.textContent = "Join Documents";
      processBtn.disabled = selectedFiles.length === 0;
    }
  });

  function getOutputFilename() {
    if (!selectedFiles.length) return "merged.pdf";
    const firstName = selectedFiles[0].name.replace(/\.pdf$/i, "");
    return `${firstName}-merged.pdf`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  renderFileList();
});
