// qr-scanner.js
// Matches structure and behavior used by the QR generator page.
// Uses native BarcodeDetector when available, falls back to jsQR for uploaded images.

try {
  const video = document.getElementById('preview');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const torchBtn = document.getElementById('torchBtn');
  const fileInput = document.getElementById('fileInput');
  const cameraSelect = document.getElementById('cameraSelect');
  const statusEl = document.getElementById('status');
  const resultText = document.getElementById('resultText');
  const resultMeta = document.getElementById('resultMeta');
  const copyBtn = document.getElementById('copyBtn');
  const openBtn = document.getElementById('openBtn');
  const beepBtn = document.getElementById('beepBtn');
  const clearBtn = document.getElementById('clearBtn');

  const canvas = document.getElementById('captureCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  // Debug: report that the script loaded and elements were found
  console.log('qr-scanner.js loaded');
  if (statusEl) statusEl.textContent = 'Scanner script loaded';

  function logBind(name, el) {
    console.log('qr-scanner: binding', name, !!el);
    if (statusEl) statusEl.textContent = 'Binding: ' + name;
  }

  let stream = null;
  let scanning = false;
  let detector = null;
  let scanInterval = null;
  let currentTrack = null;
  let torchOn = false;
  let beepOn = true;
  let jsQRLoaded = false;

  async function initDetector() {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      detector = new BarcodeDetector({ formats: formats.includes('qr_code') ? ['qr_code'] : formats });
      console.info('Using native BarcodeDetector');
    } catch (e) {
      detector = null;
      console.warn('BarcodeDetector init failed', e);
    }
  } else {
    detector = null;
    console.info('BarcodeDetector not available; will use fallback for images');
  }
}

async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');
    cameraSelect.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = cams.length ? 'Default camera' : 'No camera found';
    cameraSelect.appendChild(defaultOpt);
    cams.forEach((c, i) => {
      const opt = document.createElement('option');
      opt.value = c.deviceId;
      opt.textContent = c.label || `Camera ${i + 1}`;
      cameraSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn('Could not list cameras', err);
  }
}

async function startCamera(deviceId) {
  stopCamera();
  const constraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 },
      deviceId: deviceId ? { exact: deviceId } : undefined
    },
    audio: false
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();
    currentTrack = stream.getVideoTracks()[0];
    scanning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = 'Camera started';

    const capabilities = currentTrack.getCapabilities ? currentTrack.getCapabilities() : {};
    torchBtn.disabled = !capabilities.torch;

    startScanningLoop();
  } catch (err) {
    console.error('Camera start failed', err);
    statusEl.textContent = 'Camera access denied or not available';
  }
}

function stopCamera() {
  scanning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  torchBtn.disabled = true;
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    currentTrack = null;
  }
  statusEl.textContent = 'Camera stopped';
}

async function toggleTorch() {
  if (!currentTrack) return;
  try {
    torchOn = !torchOn;
    await currentTrack.applyConstraints({ advanced: [{ torch: torchOn }] });
    torchBtn.textContent = torchOn ? 'Torch On' : 'Toggle Torch';
  } catch (err) {
    console.warn('Torch toggle failed', err);
    statusEl.textContent = 'Torch not supported';
  }
}

function drawToCanvas() {
  if (!canvas || !ctx) return false;
  if (!video.videoWidth || !video.videoHeight) return false;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.min(800 / vw, 800 / vh, 1);
  canvas.width = Math.floor(vw * scale);
  canvas.height = Math.floor(vh * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return true;
}

async function scanFrame() {
  if (!scanning) return;
  if (!drawToCanvas()) return;
  if (detector) {
    try {
      const bitmap = await createImageBitmap(canvas);
      const barcodes = await detector.detect(bitmap);
      if (barcodes && barcodes.length) {
        handleResult(barcodes[0].rawValue, { source: 'camera', format: barcodes[0].format });
      }
      bitmap.close();
    } catch (err) {
      console.warn('BarcodeDetector error', err);
    }
  }
}

function startScanningLoop() {
  if (scanInterval) clearInterval(scanInterval);
  scanInterval = setInterval(scanFrame, 300);
}

function handleResult(text, meta = {}) {
  if (!text) return;
  resultText.textContent = text;
  resultMeta.textContent = `${meta.source || 'unknown'} ${meta.format ? '• ' + meta.format : ''} ${new Date().toLocaleTimeString()}`;
  copyBtn.disabled = false;
  const isHttp = /^https?:\/\//i.test(text);
  openBtn.href = isHttp ? text : '#';
  openBtn.style.pointerEvents = isHttp ? 'auto' : 'none';
  openBtn.style.opacity = isHttp ? '1' : '0.6';
  if (beepOn) playBeep();

  if (scanning) {
    scanning = false;
    setTimeout(() => { scanning = true; }, 1200);
  }
}

function playBeep() {
  try {
    const aCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = aCtx.createOscillator();
    const g = aCtx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(aCtx.destination);
    o.start();
    setTimeout(() => { o.stop(); aCtx.close(); }, 120);
  } catch (e) { /* ignore */ }
}

  logBind('copyBtn', copyBtn);
  if (copyBtn) copyBtn.addEventListener('click', async () => {
  const text = resultText.textContent || '';
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = 'Copied to clipboard';
  } catch (err) {
    statusEl.textContent = 'Copy failed';
  }
});

  logBind('beepBtn', beepBtn);
  if (beepBtn) beepBtn.addEventListener('click', () => {
  beepOn = !beepOn;
  beepBtn.textContent = beepOn ? 'Beep On' : 'Beep Off';
});

  logBind('clearBtn', clearBtn);
  if (clearBtn) clearBtn.addEventListener('click', () => {
  resultText.textContent = 'No result yet';
  resultMeta.textContent = '';
  copyBtn.disabled = true;
  openBtn.href = '#';
  openBtn.style.pointerEvents = 'none';
  openBtn.style.opacity = '0.6';
  statusEl.textContent = '';
});

  logBind('startBtn', startBtn);
  if (startBtn) startBtn.addEventListener('click', async () => {
  await initDetector();
  await listCameras();
  const deviceId = cameraSelect ? cameraSelect.value || '' : '';
  await startCamera(deviceId);
});

  logBind('stopBtn', stopBtn);
  if (stopBtn) stopBtn.addEventListener('click', () => stopCamera());
  logBind('torchBtn', torchBtn);
  if (torchBtn) torchBtn.addEventListener('click', () => toggleTorch());
  logBind('cameraSelect', cameraSelect);
  if (cameraSelect) cameraSelect.addEventListener('change', async () => {
  if (stream) await startCamera(cameraSelect.value || '');
});

// Image upload handling with fallback decode using jsQR
  logBind('fileInput', fileInput);
  if (fileInput) fileInput.addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  statusEl.textContent = 'Decoding image...';
  const img = new Image();
  img.onload = async () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    if (detector) {
      try {
        const bitmap = await createImageBitmap(canvas);
        const barcodes = await detector.detect(bitmap);
        if (barcodes && barcodes.length) {
          handleResult(barcodes[0].rawValue, { source: 'image', format: barcodes[0].format });
          statusEl.textContent = 'Decoded from image';
          bitmap.close();
          return;
        }
        bitmap.close();
      } catch (err) {
        console.warn('Detector failed on image', err);
      }
    }

    await ensureJsQR();
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        handleResult(code.data, { source: 'image', format: 'qr_code' });
        statusEl.textContent = 'Decoded from image';
      } else {
        statusEl.textContent = 'No QR code found in image';
      }
    } catch (err) {
      console.error('jsQR decode error', err);
      statusEl.textContent = 'Decoding failed';
    }
  };
  img.onerror = () => statusEl.textContent = 'Could not load image';
  img.src = URL.createObjectURL(file);
});

async function ensureJsQR() {
  if (jsQRLoaded) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    s.onload = () => { jsQRLoaded = true; resolve(); };
    s.onerror = () => { console.error('Failed to load jsQR'); reject(new Error('Failed to load jsQR')); };
    document.head.appendChild(s);
  });
}

// Drag & drop support and init
(function init() {
  initDetector();
  listCameras();

  const cameraArea = document.getElementById('cameraArea');
  if (cameraArea) {
    cameraArea.addEventListener('dragover', (e) => { e.preventDefault(); cameraArea.classList.add('dragover'); });
    cameraArea.addEventListener('dragleave', () => cameraArea.classList.remove('dragover'));
    cameraArea.addEventListener('drop', (e) => {
      e.preventDefault();
      cameraArea.classList.remove('dragover');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) {
        if (fileInput) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event('change'));
        }
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 's') {
      try {
        if (startBtn && startBtn.disabled) {
          if (stopBtn) stopBtn.click();
        } else if (startBtn) startBtn.click();
      } catch (err) { /* ignore */ }
    }
  });

  if (copyBtn) copyBtn.disabled = true;
  if (openBtn) {
    openBtn.style.pointerEvents = 'none';
    openBtn.style.opacity = '0.6';
  }

  // Global click logger to detect whether clicks are reaching the page
  document.addEventListener('click', (e) => {
    const t = e.target;
    const id = t && t.id;
    if (id) console.log('qr-scanner: click target id=', id);
    else if (t && t.closest) {
      const btn = t.closest('.glass-btn');
      if (btn) console.log('qr-scanner: click nearest .glass-btn id=', btn.id || '(no id)');
    }
    if (statusEl) statusEl.textContent = 'Last click: ' + (id || (t && t.className) || t.tagName);
  }, { capture: false });
})();

} catch (err) {
  console.error('qr-scanner initialization error', err);
  try {
    const statusEl = document.getElementById && document.getElementById('status');
    if (statusEl) statusEl.textContent = 'Scanner failed to initialize: ' + (err && err.message ? err.message : String(err));
  } catch (e) { /* ignore */ }
}
