document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadAreaMeta");
  const fileInput = document.getElementById("fileInputMeta");
  const previewWrapper = document.getElementById("smallPreviewWrapper");
  const previewImage = document.getElementById("smallPreview");
  const metadataSection = document.getElementById("metadataSection");
  const metadataTableBody = document.querySelector("#metadataTable tbody");
  const cleanBtn = document.getElementById("cleanMetadataBtn");

  let currentFile = null;

  SimplerTools.bindUploadArea({
    areaId: "uploadAreaMeta",
    inputId: "fileInputMeta",
    onFile: handleFile,
  });

  cleanBtn.addEventListener("click", cleanMetadata);

  function handleFile(file) {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      alert("Please select a JPG, PNG, or WebP image.");
      return;
    }

    currentFile = file;
    resetView();
    showPreview(file);
    loadMetadata(file);
  }

  function resetView() {
    previewWrapper.style.display = "none";
    metadataSection.style.display = "none";
    metadataTableBody.innerHTML = "";
  }

  function showPreview(file) {
    const url = URL.createObjectURL(file);
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
      metadataTableBody.innerHTML = `<tr><td colspan="2">Could not read metadata from this image.</td></tr>`;
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
    if (!currentFile) return;

    cleanBtn.disabled = true;
    cleanBtn.textContent = "Cleaning…";

    try {
      const cleanedBlob = await stripMetadata(currentFile);
      const filename = getCleanedFilename(currentFile.name, cleanedBlob.type);
      downloadBlob(cleanedBlob, filename);
      SimplerTools.showToast("Cleaned image ready");
    } catch (err) {
      console.error("Clean metadata error:", err);
      alert("Could not clean metadata from this image. Please try another file.");
    } finally {
      cleanBtn.disabled = false;
      cleanBtn.textContent = "Clean Metadata";
    }
  }

  function stripMetadata(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const outputType = file.type || "image/png";

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error("Unable to create cleaned image."));
              return;
            }
            resolve(blob);
          },
          outputType,
          0.92
        );
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to load image file."));
      };
      img.src = url;
    });
  }

  function getCleanedFilename(filename, type) {
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
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
