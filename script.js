// Apply seasonal theme automatically, allow manual override
(function(){
  const setTheme = (t)=> document.documentElement.setAttribute('data-theme', t);
  const detectSeason = ()=> {
    const m = new Date().getMonth() + 1;
    if(m>=3 && m<5) return 'spring';
    if(m>=6 && m<8) return 'summer';
    if(m>=9 && m<=11) return 'autumn';
    return 'winter';
  };

  const select = document.getElementById('theme-select');
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();

  const saved = localStorage.getItem('simpletools-theme');
  if(saved){
    if(saved==='auto') setTheme(detectSeason()); else setTheme(saved);
    if(select) select.value = saved;
  } else {
    if(select) select.value = 'auto';
    setTheme(detectSeason());
  }

  if(select){
    select.addEventListener('change', (e)=>{
      const v = e.target.value;
      localStorage.setItem('simpletools-theme', v);
      if(v==='auto') setTheme(detectSeason()); else setTheme(v);
    });
  }
})();

/* -----------------------------------------------------------
   PDF JOINER / SPLITTER / IMAGE MODE LOGIC
----------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  const modeTabs = document.querySelectorAll('.mode-tab');
  const joinMode = document.getElementById('joinMode');
  const splitMode = document.getElementById('splitMode');
  const imageMode = document.getElementById('imageMode');

  const uploadAreaJoin = document.getElementById('uploadAreaJoin');
  const fileInputJoin = document.getElementById('fileInputJoin');
  const fileListJoin = document.getElementById('fileListJoin');

  const uploadAreaSplit = document.getElementById('uploadAreaSplit');
  const fileInputSplit = document.getElementById('fileInputSplit');

  const uploadAreaImage = document.getElementById('uploadAreaImage');
  const fileInputImage = document.getElementById('fileInputImage');
  const fileListImage = document.getElementById('fileListImage');

  let filesJoin = [];
  let filesSplit = null;
  let filesImage = [];

  /* MODE SWITCHING */
  if (modeTabs.length) {
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.dataset.mode;

        joinMode.style.display = mode === 'join' ? 'block' : 'none';
        splitMode.style.display = mode === 'split' ? 'block' : 'none';
        imageMode.style.display = mode === 'image' ? 'block' : 'none';
      });
    });
  }

  /* JOIN MODE */
  if (uploadAreaJoin) {
    uploadAreaJoin.addEventListener('click', () => fileInputJoin.click());
    uploadAreaJoin.addEventListener('dragover', e => {
      e.preventDefault();
      uploadAreaJoin.classList.add('dragover');
    });
    uploadAreaJoin.addEventListener('dragleave', () => uploadAreaJoin.classList.remove('dragover'));
    uploadAreaJoin.addEventListener('drop', e => {
      e.preventDefault();
      uploadAreaJoin.classList.remove('dragover');
      filesJoin = Array.from(e.dataTransfer.files);
      renderJoinList();
    });
  }

  if (fileInputJoin) {
    fileInputJoin.addEventListener('change', () => {
      filesJoin = Array.from(fileInputJoin.files);
      renderJoinList();
    });
  }

  function renderJoinList() {
    if (!fileListJoin) return;
    fileListJoin.innerHTML = filesJoin.map((f, i) => `
      <li class="file-item">
        <span class="file-name">${f.name}</span>
        <button class="file-remove" onclick="removeFileJoin(${i})">Remove</button>
      </li>
    `).join('');
    const btn = document.getElementById('processJoinBtn');
    if (btn) btn.disabled = filesJoin.length < 2;
  }

  window.removeFileJoin = function(i) {
    filesJoin.splice(i, 1);
    renderJoinList();
  };

  /* SPLIT MODE */
  if (uploadAreaSplit) {
    uploadAreaSplit.addEventListener('click', () => fileInputSplit.click());
    uploadAreaSplit.addEventListener('dragover', e => {
      e.preventDefault();
      uploadAreaSplit.classList.add('dragover');
    });
    uploadAreaSplit.addEventListener('dragleave', () => uploadAreaSplit.classList.remove('dragover'));
    uploadAreaSplit.addEventListener('drop', e => {
      e.preventDefault();
      uploadAreaSplit.classList.remove('dragover');
      filesSplit = e.dataTransfer.files[0];
      document.getElementById('splitOptions').style.display = 'block';
    });
  }

  if (fileInputSplit) {
    fileInputSplit.addEventListener('change', () => {
      filesSplit = fileInputSplit.files[0];
      document.getElementById('splitOptions').style.display = 'block';
    });
  }

  /* IMAGE MODE */
  if (uploadAreaImage) {
    uploadAreaImage.addEventListener('click', () => fileInputImage.click());
    uploadAreaImage.addEventListener('dragover', e => {
      e.preventDefault();
      uploadAreaImage.classList.add('dragover');
    });
    uploadAreaImage.addEventListener('dragleave', () => uploadAreaImage.classList.remove('dragover'));
    uploadAreaImage.addEventListener('drop', e => {
      e.preventDefault();
      uploadAreaImage.classList.remove('dragover');
      filesImage = Array.from(e.dataTransfer.files);
      renderImageList();
    });
  }

  if (fileInputImage) {
    fileInputImage.addEventListener('change', () => {
      filesImage = Array.from(fileInputImage.files);
      renderImageList();
    });
  }

  function renderImageList() {
    if (!fileListImage) return;
    fileListImage.innerHTML = filesImage.map((f, i) => `
      <li class="file-item">
        <span class="file-name">${f.name}</span>
        <button class="file-remove" onclick="removeFileImage(${i})">Remove</button>
      </li>
    `).join('');
    const btn = document.getElementById('processImageBtn');
    if (btn) btn.disabled = filesImage.length === 0;
  }

  window.removeFileImage = function(i) {
    filesImage.splice(i, 1);
    renderImageList();
  };

});
