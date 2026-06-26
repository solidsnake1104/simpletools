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

  const saved = localStorage.getItem('simplertools-theme');
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
      localStorage.setItem('simplertools-theme', v);
      if(v==='auto') setTheme(detectSeason()); else setTheme(v);
    });
  }
})();

/* -----------------------------------------------------------
   PDF JOINER — CLEANED + UPDATED
----------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  /* JOIN MODE ELEMENTS */
  const uploadAreaJoin = document.getElementById('uploadAreaJoin');
  const fileInputJoin = document.getElementById('fileInputJoin');
  const fileListJoin = document.getElementById('fileListJoin');
  const processJoinBtn = document.getElementById('processJoinBtn');

  /* Store all selected files (append behavior) */
  let filesJoin = [];

  /* JOIN MODE — CLICK TO OPEN FILE PICKER */
  if (uploadAreaJoin) {
    uploadAreaJoin.addEventListener('click', () => fileInputJoin.click());

    uploadAreaJoin.addEventListener('dragover', e => {
      e.preventDefault();
      uploadAreaJoin.classList.add('dragover');
    });

    uploadAreaJoin.addEventListener('dragleave', () => {
      uploadAreaJoin.classList.remove('dragover');
    });

    uploadAreaJoin.addEventListener('drop', e => {
      e.preventDefault();
      uploadAreaJoin.classList.remove('dragover');

      const dropped = Array.from(e.dataTransfer.files);
      appendJoinFiles(dropped);
    });
  }

  /* JOIN MODE — FILE INPUT CHANGE */
  if (fileInputJoin) {
    fileInputJoin.addEventListener('change', () => {
      const selected = Array.from(fileInputJoin.files);
      appendJoinFiles(selected);
    });
  }

  /* Append new files instead of replacing */
  function appendJoinFiles(newFiles) {
    newFiles.forEach(file => {
      const exists = filesJoin.some(f => f.name === file.name && f.size === file.size);
      if (!exists) filesJoin.push(file);
    });

    renderJoinList();
  }

  /* Render file list */
  function renderJoinList() {
    if (!fileListJoin) return;

    fileListJoin.innerHTML = filesJoin.map((f, i) => `
      <li class="file-item">
        <span class="file-name">${f.name}</span>
        <button class="file-remove" onclick="removeFileJoin(${i})">Remove</button>
      </li>
    `).join('');

    if (processJoinBtn) {
      processJoinBtn.disabled = filesJoin.length < 2;
    }
  }

  /* Remove file */
  window.removeFileJoin = function(i) {
    filesJoin.splice(i, 1);
    renderJoinList();
  };

});
