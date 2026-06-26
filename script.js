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
   PDF JOINER — UPDATED WITH REORDER + ADD FILES BUTTON
----------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  const uploadAreaJoin = document.getElementById('uploadAreaJoin');
  const fileInputJoin = document.getElementById('fileInputJoin');
  const fileListJoin = document.getElementById('fileListJoin');

  let filesJoin = [];
  let dragIndex = null;

  /* CLICK TO OPEN FILE PICKER */
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
      appendJoinFiles(Array.from(e.dataTransfer.files));
    });
  }

  /* FILE INPUT CHANGE */
  if (fileInputJoin) {
    fileInputJoin.addEventListener('change', () => {
      appendJoinFiles(Array.from(fileInputJoin.files));
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

  /* Render file list with drag handles */
  function renderJoinList() {
    if (!fileListJoin) return;

    fileListJoin.innerHTML = filesJoin.map((f, i) => `
      <li class="file-item" draggable="true" data-index="${i}">
        <span class="drag-handle">☰</span>
        <span class="file-name">${f.name}</span>
        <button class="file-remove" onclick="removeFileJoin(${i})">Remove</button>
      </li>
    `).join('');

    enableDragReorder();
  }

  /* Drag + Drop Reorder Logic */
  function enableDragReorder() {
    const items = fileListJoin.querySelectorAll('.file-item');

    items.forEach(item => {
      item.addEventListener('dragstart', e => {
        dragIndex = Number(e.target.dataset.index);
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      item.addEventListener('drop', e => {
        e.preventDefault();
        const dropIndex = Number(e.target.closest('.file-item').dataset.index);

        const moved = filesJoin.splice(dragIndex, 1)[0];
        filesJoin.splice(dropIndex, 0, moved);

        renderJoinList();
      });
    });
  }

  /* Remove file */
  window.removeFileJoin = function(i) {
    filesJoin.splice(i, 1);
    renderJoinList();
  };

});
