// Apply seasonal theme automatically, allow manual override
(function(){
  const setTheme = (t)=> document.documentElement.setAttribute('data-theme', t);
  const detectSeason = ()=>{
    const m = new Date().getMonth() + 1; // 1..12
    if(m>=3 && m<=5) return 'spring';
    if(m>=6 && m<=8) return 'summer';
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
    // default to auto
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
