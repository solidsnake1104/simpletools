// -----------------------------------------------------------
// QR Code Generator — tool-specific logic
// Based on a confirmed-working implementation using qrcodejs
// (https://github.com/davidshimjs/qrcodejs), loaded via CDN.
// Shared header/footer/theme logic lives in ../script.js
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const textEl       = document.getElementById("text");
  const sizeEl       = document.getElementById("size");
  const ecEl         = document.getElementById("ec");
  const generateBtn  = document.getElementById("generate");
  const clearBtn     = document.getElementById("clear");
  const qrcodeContainer = document.getElementById("qrcode");
  const infoEl       = document.getElementById("info");
  const downloadBtn  = document.getElementById("download");
  const copyBtn      = document.getElementById("copy");

  // Nothing on this page to wire up — bail out safely.
  if (!textEl || !generateBtn || !qrcodeContainer) return;

  let qr; // QRCode instance

  function clearPreview() {
    qrcodeContainer.innerHTML = "";
    infoEl.textContent = "No QR generated yet";
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    qr = null;
  }

  function generate() {
    const value = textEl.value.trim();

    if (!value) {
      alert("Please enter text or a URL to encode.");
      return;
    }

    if (typeof QRCode === "undefined") {
      alert("The QR code library failed to load. Please check your connection and try again.");
      return;
    }

    const size = Math.max(64, Math.min(2048, parseInt(sizeEl.value, 10) || 300));
    const ec = ecEl.value || "M";

    // Clear previous
    qrcodeContainer.innerHTML = "";

    // Create a temporary container for the library to render into
    const temp = document.createElement("div");
    qrcodeContainer.appendChild(temp);

    const correctLevelMap = {
      L: QRCode.CorrectLevel.L,
      M: QRCode.CorrectLevel.M,
      Q: QRCode.CorrectLevel.Q,
      H: QRCode.CorrectLevel.H
    };

    qr = new QRCode(temp, {
      text: value,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: correctLevelMap[ec] || QRCode.CorrectLevel.M
    });

    // qrcodejs renders an <img> or <canvas> inside temp. Find it.
    // If it rendered an <img>, convert to canvas for download/copy consistency.
    setTimeout(() => {
      const img = temp.querySelector("img");
      const canvas = temp.querySelector("canvas");

      if (img && !canvas) {
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;

        const ctx = c.getContext("2d");
        const image = new Image();

        image.onload = () => {
          ctx.drawImage(image, 0, 0, size, size);
          temp.innerHTML = "";
          temp.appendChild(c);
          enableActions(c, value, size, ec);
        };

        image.crossOrigin = "anonymous";
        image.src = img.src;
      } else if (canvas) {
        enableActions(canvas, value, size, ec);
      } else {
        const fallbackImg = qrcodeContainer.querySelector("img");

        if (fallbackImg) {
          const c = document.createElement("canvas");
          c.width = size;
          c.height = size;

          const ctx = c.getContext("2d");
          const image = new Image();

          image.onload = () => {
            ctx.drawImage(image, 0, 0, size, size);
            temp.innerHTML = "";
            temp.appendChild(c);
            enableActions(c, value, size, ec);
          };

          image.crossOrigin = "anonymous";
          image.src = fallbackImg.src;
        } else {
          infoEl.textContent = "Generated (no canvas available)";
          downloadBtn.disabled = true;
          copyBtn.disabled = true;
        }
      }
    }, 50);
  }

  function enableActions(canvas, value, size, ec) {
    infoEl.textContent = `Size: ${size}px • EC: ${ec} • ${value.length} chars`;
    downloadBtn.disabled = false;
    copyBtn.disabled = false;

    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.download = `qr-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    copyBtn.onclick = async () => {
      try {
        if (!navigator.clipboard) {
          alert("Clipboard API not supported in this browser.");
          return;
        }

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        const item = new ClipboardItem({ "image/png": blob });

        await navigator.clipboard.write([item]);

        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy Image"), 1500);
      } catch (err) {
        console.error(err);
        alert("Copy failed. Try downloading the image instead.");
      }
    };
  }

  generateBtn.addEventListener("click", generate);

  clearBtn.addEventListener("click", () => {
    textEl.value = "";
    clearPreview();
  });

  textEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generate();
    }
  });

  clearPreview();
});