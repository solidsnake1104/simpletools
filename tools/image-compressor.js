document.addEventListener("DOMContentLoaded", () => {
  const resultsSection = document.getElementById("compressResults");
  const compressControls = document.getElementById("compressControls");

  const formatSelect = document.getElementById("formatSelect");
  const qualitySlider = document.getElementById("qualitySlider");
  const qualityValue = document.getElementById("qualityValue");
  const qualityRow = document.getElementById("qualityRow");
  const compressBtn = document.getElementById("compressBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const originalPreview = document.getElementById("originalPreview");
  const compressedPreview = document.getElementById("compressedPreview");
  const originalSizeBadge = document.getElementById("originalSizeBadge");
  const compressedSizeBadge = document.getElementById("compressedSizeBadge");
  const savingsLine = document.getElementById("savingsLine");

  let originalFile = null;
  let originalImage = null;
  let compressedBlob = null;

  // Reuse the shared upload-area wiring from script.js instead of
  // re-implementing click/drag/drop handling here.
  SimplerTools.bindUploadArea({
    areaId: "uploadAreaCompress",
    inputId: "fileInputCompress",
    onFile: handleFile,
  });

  function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    originalFile = file;
    compressedBlob = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage = new Image();
      originalImage.onload = () => {
        originalPreview.src = originalImage.src;
        originalSizeBadge.textContent = SimplerTools.formatBytes(originalFile.size);

        // Default the format dropdown to match the source when possible.
        if (formatSelect.querySelector(`option[value="${file.type}"]`)) {
          formatSelect.value = file.type;
        } else {
          formatSelect.value = "image/jpeg";
        }

        updateQualityVisibility();

        compressControls.style.display = "block";
        resultsSection.style.display = "none";
        compressedPreview.src = "";
        compressedSizeBadge.textContent = "";
        savingsLine.textContent = "";
        downloadBtn.disabled = true;
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function updateQualityVisibility() {
    // PNG is lossless in the canvas encoder, so the quality slider has
    // no effect there — hide it to avoid confusion.
    const isLossy = formatSelect.value === "image/jpeg" || formatSelect.value === "image/webp";
    qualityRow.style.display = isLossy ? "flex" : "none";
  }

  formatSelect.addEventListener("change", updateQualityVisibility);

  qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = qualitySlider.value + "%";
  });

  compressBtn.addEventListener("click", () => {
    if (!originalImage) return;

    const canvas = document.createElement("canvas");
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    const ctx = canvas.getContext("2d");

    // JPEG has no alpha channel — fill white first so transparent pixels
    // don't turn black.
    if (formatSelect.value === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(originalImage, 0, 0);

    const mime = formatSelect.value;
    const quality = Number(qualitySlider.value) / 100;

    compressBtn.disabled = true;
    compressBtn.textContent = "Compressing…";

    canvas.toBlob(
      (blob) => {
        compressBtn.disabled = false;
        compressBtn.textContent = "Compress Image";

        if (!blob) {
          alert("Could not compress this image.");
          return;
        }

        compressedBlob = blob;
        showResults(blob, mime);
      },
      mime,
      mime === "image/png" ? undefined : quality
    );
  });

  function showResults(blob, mime) {
    const url = URL.createObjectURL(blob);
    compressedPreview.src = url;
    compressedSizeBadge.textContent = SimplerTools.formatBytes(blob.size);

    const diff = originalFile.size - blob.size;
    const pct = originalFile.size ? Math.round((diff / originalFile.size) * 100) : 0;

    if (diff > 0) {
      compressedSizeBadge.className = "size-badge is-smaller";
      savingsLine.innerHTML = `<strong>${pct}% smaller</strong> — saved ${SimplerTools.formatBytes(diff)}`;
    } else if (diff < 0) {
      compressedSizeBadge.className = "size-badge is-larger";
      savingsLine.innerHTML = `This setting produced a <strong>larger</strong> file than the original. Try a lower quality or a different format.`;
    } else {
      compressedSizeBadge.className = "size-badge";
      savingsLine.innerHTML = `Same size as the original.`;
    }

    resultsSection.style.display = "block";
    downloadBtn.disabled = false;

    downloadBtn.onclick = () => {
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const base = originalFile.name.replace(/\.[^.]+$/, "");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}-compressed.${ext}`;
      a.click();
    };
  }
});