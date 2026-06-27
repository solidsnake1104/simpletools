// Simple Resize-Only Image Resizer
document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadAreaResize");
  const fileInput = document.getElementById("fileInputResize");
  const resizeControls = document.getElementById("resizeControls");

  const previewImage = document.getElementById("previewImage");

  const sizeGroup = document.getElementById("sizeGroup");
  const customWidth = document.getElementById("customWidth");
  const customHeight = document.getElementById("customHeight");
  const applyChangesBtn = document.getElementById("applyChangesBtn");

  let originalImage = null;
  let selectedSize = "none";

  // Upload handling
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length) loadImage(files[0]);
  });

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    if (files.length) loadImage(files[0]);
  });

  function loadImage(file) {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = e => {
      originalImage = new Image();
      originalImage.onload = () => {
        previewImage.src = originalImage.src;
        resizeControls.style.display = "block";
        updateApplyButton();
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Resize options
  sizeGroup.addEventListener("click", e => {
    const btn = e.target.closest(".glass-option");
    if (!btn) return;

    selectedSize = btn.dataset.size || "none";

    [...sizeGroup.children].forEach(b =>
      b.classList.toggle("active", b === btn)
    );

    updateApplyButton();
  });

  function getSizeFromPreset() {
    if (selectedSize === "none") return null;
    const [w, h] = selectedSize.split("x").map(Number);
    return { width: w, height: h };
  }

  function getCustomSize() {
    const w = parseInt(customWidth.value, 10);
    const h = parseInt(customHeight.value, 10);
    if (!w || !h) return null;
    return { width: w, height: h };
  }

  function resolveTargetSize() {
    const custom = getCustomSize();
    if (custom) return custom;

    const preset = getSizeFromPreset();
    if (preset) return preset;

    // Default: original size
    return { width: originalImage.width, height: originalImage.height };
  }

  // Apply changes
  applyChangesBtn.addEventListener("click", () => {
    if (!originalImage) return;

    const target = resolveTargetSize();

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImage, 0, 0, target.width, target.height);

    const dataURL = canvas.toDataURL("image/png");

    sessionStorage.setItem("finalImage", dataURL);
    window.location.href = "image-resizer-output.html";
  });

  function updateApplyButton() {
    applyChangesBtn.disabled = !originalImage;
  }
});
