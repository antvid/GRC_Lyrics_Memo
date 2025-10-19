\
/* Rock Lyrics Trainer - main.js
 - Soporta carga desde Google Drive (carpeta pública), subida local y localStorage.
 - Multi-idioma (ES/EN) y responsive.
*/

importConfig();

let CONFIG = null;
let state = { index:0, verses:[], hooks:[], mode:'study', players:'solo', score:0, tries:0, lang:'es' };

// Load config.json (local) — simple fetch
function importConfig(){ fetch('config.json').then(r=>r.json()).then(c=>{ CONFIG=c; initApp(); }).catch(e=>{ console.warn('No se pudo leer config.json, usando valores por defecto',e); CONFIG={projectName:'Rock Lyrics Trainer', defaultLang:'es', driveFolderId:''}; initApp(); }); }

function initApp(){
  // UI elems
  const projectName = document.getElementById('projectName'); projectName.textContent = CONFIG.projectName || 'Rock Lyrics Trainer';
  state.lang = CONFIG.defaultLang || 'es'; document.getElementById('langSelect').value = state.lang;

  // Bind events
  document.querySelectorAll('.mode-btn').forEach(btn=>btn.addEventListener('click', ()=>{ document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); state.mode = btn.dataset.mode || state.mode; renderModeLabel(); renderActivity(); }));
  document.getElementById('soloBtn').addEventListener('click', ()=>{ state.players='solo'; document.getElementById('soloBtn').classList.add('active'); document.getElementById('groupBtn').classList.remove('active'); renderModeLabel(); });
  document.getElementById('groupBtn').addEventListener('click', ()=>{ state.players='group'; document.getElementById('groupBtn').classList.add('active'); document.getElementById('soloBtn').classList.remove('active'); renderModeLabel(); });

  document.getElementById('langSelect').addEventListener('change', (e)=>{ state.lang = e.target.value; translateUI(); });

  // Drive load
  const driveIdInput = document.getElementById('driveIdInput'); driveIdInput.value = CONFIG.driveFolderId || '';
  document.getElementById('loadFromDrive').addEventListener('click', ()=>{ const id = driveIdInput.value.trim(); if(!id) return alert('Introduce el ID de carpeta de Drive'); loadFromDrive(id); });

  // Local upload
  document.getElementById('uploadLocal').addEventListener('click', ()=>document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', (e)=>{ const files = Array.from(e.target.files); files.forEach(f=>{ const reader = new FileReader(); reader.onload = ()=>{ const text = reader.result; const parsed = parseSongFile(text); addSongToList(parsed); }; reader.readAsText(f); }); });

  // controls
  document.getElementById('nextBtn').addEventListener('click', ()=>{ if(state.index < state.verses.length-1) state.index++; renderVerse(); });
  document.getElementById('prevBtn').addEventListener('click', ()=>{ if(state.index>0) state.index--; renderVerse(); });

  document.getElementById('loadSaved').addEventListener('click', ()=>{ loadSaved(); });
  document.getElementById('clearSaved').addEventListener('click', ()=>{ localStorage.removeItem('rlt_state'); alert('Progreso borrado'); });

  // initial render
  translateUI(); renderModeLabel();
  if(CONFIG.driveFolderId) loadFromDrive(CONFIG.driveFolderId); else renderEmpty();
}

function translateUI(){ // basic i18n for static strings
  const es = { modes:'Modos', players:'Jugadores', load:'Cargar canción', driveId:'Drive folder ID', showHooks:'Mostrar ganchos', autoAdvance:'Avanzar automático', saved:'Guardado' };
  const en = { modes:'Modes', players:'Players', load:'Load song', driveId:'Drive folder ID', showHooks:'Show hooks', autoAdvance:'Auto-advance', saved:'Saved' };
  const map = state.lang === 'es' ? es : en;
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const key = el.getAttribute('data-i18n'); if(map[key]) el.textContent = map[key]; });
}

function renderModeLabel(){ document.getElementById('modeLabel').textContent = `Modo: ${state.mode === 'study' ? 'Estudio' : state.mode === 'game' ? 'Juego' : 'Mixto'} — ${state.players === 'solo' ? 'Solo' : 'Grupo'}`; }

function renderEmpty(){ document.getElementById('verseText').textContent = 'No hay canción cargada. Carga desde Drive o sube un archivo local.'; }

function parseSongFile(text){ // naive parse: split en dobles newlines for versos and, if finds a '---hooks---' section separate it
  const parts = text.split('\\n\\n');
  return { title: 'Untitled', verses: parts.map(p=>p.trim()).filter(Boolean), hooks: [] };
}

function addSongToList(parsed){ state.verses = parsed.verses; state.hooks = parsed.hooks || new Array(parsed.verses.length).fill(''); state.index = 0; saveState(); renderVerse(); renderActivity(); }

// Save / load in localStorage
function saveState(){ const s = { verses: state.verses, hooks: state.hooks, index: state.index, mode: state.mode, players: state.players }; localStorage.setItem('rlt_state', JSON.stringify(s)); }
function loadSaved(){ const s = JSON.parse(localStorage.getItem('rlt_state')||'null'); if(!s) return alert('No hay progreso guardado'); state.verses = s.verses; state.hooks = s.hooks; state.index = s.index || 0; state.mode = s.mode || 'study'; state.players = s.players || 'solo'; renderVerse(); renderActivity(); }

function renderVerse(){ document.getElementById('verseText').textContent = state.verses[state.index] || ''; const hook = state.hooks[state.index] || ''; const hookEl = document.getElementById('hookText'); if(document.getElementById('showHooks').checked && hook){ hookEl.hidden=false; hookEl.textContent = hook; } else hookEl.hidden=true; document.getElementById('versePos').textContent = `Verso ${state.index+1} / ${state.verses.length}`; updateProgress(); }

function updateProgress(){ const pct = state.verses.length ? Math.round(((state.index+1)/state.verses.length)*100) : 0; document.querySelector('.bar').style.width = pct+'%'; document.getElementById('progressPct').textContent = pct+'%'; }

function renderActivity(){ const a = document.getElementById('activityArea'); a.innerHTML=''; if(state.mode==='study') return renderStudyActivity(a); if(state.mode==='game') return renderGameActivity(a); return renderMixedActivity(a); }

function renderStudyActivity(el){ const t = document.createElement('div'); t.innerHTML = `<strong>Modo Estudio</strong><div style="color:var(--muted)">Lee el verso y realiza la acción sugerida.</div>`; const btn = document.createElement('button'); btn.className='btn primary'; btn.textContent='Marcar memorizado'; btn.addEventListener('click', ()=>{ state.score++; state.tries++; saveState(); updateScore(); if(document.getElementById('autoAdvance').checked){ if(state.index < state.verses.length-1) state.index++; renderVerse(); } }); el.appendChild(t); el.appendChild(btn); }

function renderGameActivity(el){ const t = document.createElement('div'); t.innerHTML = `<strong>Modo Juego</strong><div style="color:var(--muted)">Selecciona la siguiente línea correcta.</div>`; el.appendChild(t);
  if(state.index >= state.verses.length-1) { const m = document.createElement('div'); m.textContent='Fin.'; el.appendChild(m); return; }
  const next = state.verses[state.index+1]; const opts = makeOptions(next);
  opts.forEach(o=>{ const d = document.createElement('div'); d.className='choice'; d.textContent=o; d.addEventListener('click', ()=>{ state.tries++; if(o===next){ state.score++; state.index++; renderVerse(); } else { d.classList.add('wrong'); } updateScore(); }); el.appendChild(d); });
}

function renderMixedActivity(el){ const t = document.createElement('div'); t.innerHTML = `<strong>Modo Mixto</strong><div style="color:var(--muted)">Pista + opción multiple.</div>`; el.appendChild(t); const hint = document.createElement('div'); hint.style.marginTop='8px'; hint.style.padding='8px'; hint.style.background='rgba(255,255,255,0.02)'; hint.textContent = state.hooks[state.index] || 'Sin pista'; el.appendChild(hint); renderGameActivity(el); }

function updateScore(){ document.getElementById('score').textContent = state.score; document.getElementById('tries').textContent = state.tries; saveState(); }

function makeOptions(correct){ const pool = state.verses.filter(v=>v!==correct); shuffle(pool); const opts = [correct, pool[0]||'', pool[1]||'']; shuffle(opts); return opts; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } }

// Load from Google Drive: uses Google Drive's public file listing via `https://www.googleapis.com/drive/v3/files` requires API key.
// Instead we use the workaround: attempt to list via `https://drive.google.com/drive/folders/ID` and parse HTML links (works if folder is public). This is fragile but acceptable for public folders.

async function loadFromDrive(folderId){ const url = `https://drive.google.com/drive/folders/${folderId}`;
  try{
    const res = await fetch(url); const text = await res.text(); // parse simple links to `/file/d/FILE_ID/view`
    const fileIds = Array.from(text.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{10,})/g)).map(m=>m[1]);
    const unique = [...new Set(fileIds)];
    // fetch each file's text by composing export link
    const songs = [];
    for(const fid of unique){ try{ const furl = `https://drive.google.com/uc?export=download&id=${fid}`; const r = await fetch(furl); const body = await r.text(); const parsed = parseSongFile(body); songs.push(parsed); }catch(e){ console.warn('no se pudo leer file',fid,e); } }
    if(songs.length>0){ // pick first for now or show selection (we pick first for simplicity)
      state.verses = songs[0].verses; state.hooks = songs[0].hooks || new Array(state.verses.length).fill(''); state.index=0; renderVerse(); renderActivity(); alert(`Cargadas ${songs.length} archivos. Mostrando: ${songs[0].title || 'Untitled'}`);
    } else { alert('No se encontraron archivos legibles en la carpeta pública. Asegúrate de que los archivos sean .txt y la carpeta sea pública.'); }
  }catch(e){ console.error(e); alert('Error cargando Drive. Puedes subir archivos locales como alternativa.'); }
}
