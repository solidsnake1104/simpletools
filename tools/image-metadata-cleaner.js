const uploadArea = document.getElementById("uploadAreaMeta");
const fileInput = document.getElementById("fileInputMeta");
const metadataSection = document.getElementById("metadataSection");
const metadataTableBody = document.querySelector("#metadataTable tbody");
const cleanBtn = document.getElementById("cleanMetadataBtn");

const smallPreviewWrapper = document.getElementById("smallPreviewWrapper");
const smallPreview = document.getElementById("smallPreview");

let originalFile;

// Upload interactions
uploadArea.addEventListener("click", () => fileInput.click());

uploadArea.addEventListener("dragover", e => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", e => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", e => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

// Handle file
function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    return;
  }

  originalFile = file;

  // Show small preview
  const previewURL = URL.createObjectURL(file);
  smallPreview.src = previewURL;
  smallPreviewWrapper.style.display = "block";

  // Reset sections
  metadataSection.style.display = "none";
  metadataTableBody.innerHTML = "";

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const tags = ExifReader.load(e.target.result);
      populateMetadata(tags);
      metadataSection.style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Could not read metadata from this image.");
    }
  };
  reader.readAsArrayBuffer(file);
}

// Populate table (READ‑ONLY)
function populateMetadata(tags) {
  metadataTableBody.innerHTML = "";

  const entries = Object.entries(tags);
  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.textContent = "No readable metadata found.";
    row.appendChild(cell);
    metadataTableBody.appendChild(row);
    return;
  }

  entries.forEach(([tag, data]) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${tag}</td>
      <td>${data.description || data.value || "(binary)"}</td>
    `;

    metadataTableBody.appendChild(row);
  });
}

// Clean metadata → DIRECT DOWNLOAD (PNG = metadata-free)
cleanBtn.addEventListener("click", () => {
  if (!originalFile) {
    alert("Please upload an image first.");
    return;
  }

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Force PNG output (metadata-free)
    canvas.toBlob(blob => {
      if (blob) {
        triggerDownload(blob);
      } else {
        const dataURL = canvas.toDataURL("image/png");
        const fallbackBlob = dataURLToBlob(dataURL);
        triggerDownload(fallbackBlob);
      }
    }, "image/png");
  };

  img.onerror = () => {
    alert("Could not load image for cleaning.");
  };

  img.src = URL.createObjectURL(originalFile);
});

// Convert dataURL → Blob
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

// Download + confirmation
function triggerDownload(blob) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cleaned-" + originalFile.name.replace(/\.[^.]+$/, ".png");
  a.click();

  // Confirmation message
  cleanBtn.textContent = "Metadata cleaned ✔";
  cleanBtn.disabled = true;

  setTimeout(() => {
    cleanBtn.textContent = "Clean Metadata";
    cleanBtn.disabled = false;
  }, 2000);
}
