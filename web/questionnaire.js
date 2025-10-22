/* Questionnaire page logic */

function $(sel){ return document.querySelector(sel); }

function getQuery(){
  const u = new URL(location.href);
  return Object.fromEntries(u.searchParams.entries());
}

function showToast(msg){
  const el = document.querySelector('#toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  setTimeout(()=>{ el.classList.remove('show'); el.classList.add('hidden'); }, 1400);
}

function fillFormSaved(taskId){
  const saved = Storage.get(taskId);
  if(!saved) return;
  const form = $('#form');
  for(const [k,v] of Object.entries(saved)){
    if(form.elements[k]) form.elements[k].value = v;
  }
}

function countAnswered(form){
  let answered = 0;
  for(let i=1;i<=12;i++){
    const el = form.elements['q'+i];
    if(el && el.value !== '') answered++;
  }
  ['q13','q14','q15'].forEach(k=>{ const el=form.elements[k]; if(el && el.value) answered++; });
  return answered;
}

function updateProgress(){
  const form = $('#form');
  const total = 15;
  const done = countAnswered(form);
  const bar = document.querySelector('#progressBar');
  const txt = document.querySelector('#progressText');
  if(bar) bar.style.width = Math.round(done/total*100) + '%';
  if(txt) txt.textContent = `已完成 ${done}/${total}`;
}

function levelToColor(level){
  if(level==='紧急级') return 'red';
  if(level==='关注级') return 'yellow';
  if(level==='稳定级') return 'green';
  return '';
}

window.addEventListener('DOMContentLoaded', ()=>{
  const q = getQuery();
  const taskId = q.task || '';
  const part = q.part || '';
  const type = q.type || '';
  const level = q.level || '';
  const risk = q.risk || '';
  const path = q.path || '';

  $('#backLink').href = '../index.html';

  // Meta banner with level/type visuals
  const color = levelToColor(level);
  const metaHTML = `
    <div>
      <div><strong>任务：</strong><code>${taskId || '未知'}</code></div>
      <div class="meta">分组：${part || '未知'} · 类型：${type || '未知'}${risk ? ` · 风险等级：${risk}` : ''}</div>
    </div>
    <div style="margin-left:auto; text-align:right;">
      ${level ? `<span class="badge ${color}">${level}</span>` : ''}
      ${path ? `<div class="muted-note">${path}</div>` : ''}
    </div>`;
  $('#taskMeta').innerHTML = metaHTML;

  const form = $('#form');
  form.elements['task_id'].value = taskId;
  form.elements['part'].value = part;
  if(type) form.elements['task_type'].value = type;
  if(level) form.elements['task_level'].value = level;
  if(risk) form.elements['task_risk_label'].value = risk;
  if(path) form.elements['task_path'].value = path;

  // Try to infer type/path from storage of last segmentation by scanning index page state if available is not trivial.
  // Leave empty; optional.

  fillFormSaved(taskId);
  updateProgress();
  document.querySelector('#form').addEventListener('input', updateProgress);

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const record = Object.fromEntries(fd.entries());
    record.saved_at = new Date().toISOString();
    // Normalize numbers
    for(let i=1;i<=12;i++){ const k='q'+i; if(record[k]==='') delete record[k]; }
    Storage.upsert(record);
    showToast('已保存到本地');
  });
});
