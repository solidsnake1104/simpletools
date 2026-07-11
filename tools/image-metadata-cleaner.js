document.addEventListener("DOMContentLoaded", () => {
  const fileListDetails = document.getElementById("fileListDetails");
  const fileListSummary = document.getElementById("fileListSummary");
  const fileListEl = document.getElementById("imageFileList");
  const outputSelect = document.getElementById("outputFormatSelect");
  const previewWrapper = document.getElementById("smallPreviewWrapper");
  const previewImage = document.getElementById("smallPreview");
  const metadataSection = document.getElementById("metadataSection");
  const metadataTableBody = document.querySelector("#metadataTable tbody");
  const cleanBtn = document.getElementById("cleanMetadataBtn");

  let selectedFiles = [];
  let activeIndex = 0;
  let cleaningInterval = null;
  let cleaningState = 0;
  const loadingStates = ["Cleaning", "Cleaning.", "Cleaning..", "Cleaning..."];

  SimplerTools.bindUploadArea({
    areaId: "uploadAreaMeta",
    inputId: "fileInputMeta",
    onFiles: handleFiles,
  });

  cleanBtn.addEventListener("click", cleanMetadata);

  function handleFiles(files) {
    const fileArray = Array.prototype.slice.call(files || []).filter((file) => {
      return file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
    });

    if (!fileArray.length) {
      alert("Please select one or more JPG, PNG, WebP, or HEIC images.");
      return;
    }

    selectedFiles = fileArray;
    activeIndex = 0;
    renderFileList();
    activateFile(activeIndex);
  }

  function renderFileList() {
    fileListEl.innerHTML = "";

    if (!selectedFiles.length) {
      fileListEl.innerHTML = '<li class="file-list-empty">Drop or choose images to start.</li>';
      fileListDetails.style.display = "none";
      fileListDetails.open = false;
      cleanBtn.disabled = true;
      cleanBtn.textContent = "Clean All Images";
      return;
    }

    selectedFiles.forEach((file, index) => {
      const item = document.createElement("li");
      item.className = "file-item" + (index === activeIndex ? " selected" : "");
      item.addEventListener("click", () => activateFile(index));

      const label = document.createElement("div");
      label.className = "file-name";
      label.textContent = `${index + 1}. ${file.name}`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "file-remove";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectedFiles.splice(index, 1);
        if (activeIndex >= selectedFiles.length) activeIndex = selectedFiles.length - 1;
        renderFileList();
        if (selectedFiles.length) activateFile(activeIndex);
        else resetView();
      });

      item.appendChild(label);
      item.appendChild(removeButton);
      fileListEl.appendChild(item);
    });

    fileListSummary.textContent = `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`;
    fileListDetails.style.display = "block";
    fileListDetails.open = false;
    cleanBtn.disabled = false;
    cleanBtn.textContent = selectedFiles.length > 1 ? "Clean All Images" : "Clean Metadata";
  }

  function activateFile(index) {
    if (index < 0 || index >= selectedFiles.length) return;
    activeIndex = index;
    renderFileList();
    resetView();
    showPreview(selectedFiles[activeIndex]);
    loadMetadata(selectedFiles[activeIndex]);
    if (!fileListDetails.open) fileListDetails.open = true;
  }

  function resetView() {
    previewWrapper.style.display = "none";
    metadataSection.style.display = "none";
    metadataTableBody.innerHTML = "";
  }

  async function showPreview(file) {
    const displayFile = isHeic(file) ? await convertHeicToJpegBlob(file) : file;
    if (!displayFile) {
      previewWrapper.style.display = "none";
      return;
    }

    const url = URL.createObjectURL(displayFile);
    previewImage.src = url;
    previewWrapper.style.display = "block";
    previewImage.onload = () => URL.revokeObjectURL(url);
  }

  async function loadMetadata(file) {
    try {
      const tags = await ExifReader.load(file);
      renderMetadata(tags);
    } catch (err) {
      console.error("ExifReader error:", err);
      if (isHeic(file)) {
        metadataTableBody.innerHTML = `<tr><td colspan="2">HEIC metadata preview is not available in this browser. The file can still be cleaned and downloaded as JPEG.</td></tr>`;
      } else {
        metadataTableBody.innerHTML = `<tr><td colspan="2">Could not read metadata from this image.</td></tr>`;
      }
      metadataSection.style.display = "block";
    }
  }

  function renderMetadata(tags) {
    const rows = flattenTags(tags).map(({ tag, value }) => {
      return `<tr><td>${SimplerTools.escapeHtml(tag)}</td><td>${SimplerTools.escapeHtml(formatValue(value))}</td></tr>`;
    });

    metadataTableBody.innerHTML = rows.length
      ? rows.join("")
      : `<tr><td colspan="2">No metadata was found in this image.</td></tr>`;

    metadataSection.style.display = "block";
  }

  function flattenTags(tags, prefix = "") {
    return Object.keys(tags).sort().reduce((acc, key) => {
      const value = tags[key];
      const name = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value) && value.description === undefined) {
        return acc.concat(flattenTags(value, name));
      }

      return acc.concat({ tag: name, value: value.description || value.value || value || "" });
    }, []);
  }

  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.map(formatValue).join(", ");
    }
    if (value && typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  async function cleanMetadata() {
    if (!selectedFiles.length) return;

    cleanBtn.disabled = true;
    startCleaningIndicator();

    try {
      const desiredOutputType = outputSelect.value;

    if (selectedFiles.length === 1) {
        const cleanedBlob = await stripMetadata(selectedFiles[0], desiredOutputType);
        const filename = getCleanedFilename(selectedFiles[0].name, cleanedBlob.type, desiredOutputType);
        downloadBlob(cleanedBlob, filename);
        SimplerTools.showToast("Cleaned image ready");
      } else {
        const zip = new JSZip();

        await Promise.all(
          selectedFiles.map(async (file) => {
            const cleanedBlob = await stripMetadata(file, desiredOutputType);
            zip.file(getCleanedFilename(file.name, cleanedBlob.type, desiredOutputType), cleanedBlob);
          })
        );

        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "metadata-cleaned-images.zip");
        SimplerTools.showToast("Batch cleaned images ready");
      }
    } catch (err) {
      console.error("Clean metadata error:", err);
      alert("Could not clean metadata from these images. Please try again.");
    } finally {
      stopCleaningIndicator();
      cleanBtn.disabled = false;
      cleanBtn.textContent = selectedFiles.length > 1 ? "Clean All Images" : "Clean Metadata";
    }
  }

  function startCleaningIndicator() {
    stopCleaningIndicator();
    cleaningState = 0;
    cleanBtn.textContent = loadingStates[cleaningState];
    cleaningInterval = setInterval(() => {
      cleaningState = (cleaningState + 1) % loadingStates.length;
      cleanBtn.textContent = loadingStates[cleaningState];
    }, 500);
  }

  function stopCleaningIndicator() {
    if (cleaningInterval) {
      clearInterval(cleaningInterval);
      cleaningInterval = null;
    }
  }

  async function stripMetadata(file, outputType) {
    const sourceFile = isHeic(file) ? await convertHeicToJpegBlob(file) : file;
    if (!sourceFile) throw new Error("Unable to convert HEIC image.");

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(sourceFile);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const requestedType = outputType || sourceFile.type || "image/png";
        const quality = requestedType === "image/jpeg" || requestedType === "image/webp" ? 1.0 : undefined;
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error("Unable to create cleaned image."));
              return;
            }
            resolve(blob);
          },
          requestedType,
          quality
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to load image file."));
      };

      img.src = url;
    });
  }

  function isHeic(file) {
    return /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  }

  async function convertHeicToJpegBlob(file) {
    if (typeof HeicTo !== "function") return null;
    try {
      return await HeicTo({
        blob: file,
        type: "image/jpeg",
        quality: 0.85,
      });
    } catch (err) {
      console.warn("HEIC conversion failed for", file.name, err);
      return null;
    }
  }

  function getCleanedFilename(filename, blobType, requestedType) {
    const outputType = requestedType || blobType;
    const ext = outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg";
    const base = filename.replace(/\.[^/.]+$/, "");
    return `${base}-cleaned.${ext}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
});
