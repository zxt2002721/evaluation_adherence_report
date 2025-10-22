/* Load tasks, compute segmentation, and render list for selected part */

const TASKS_URL = 'web/tasks.json';
const PARTS = 3;

function $(sel){ return document.querySelector(sel); }

function loadJSON(url){
  return fetch(url, {cache:'no-store'}).then(r=>{
    if(!r.ok) throw new Error('加载失败: '+r.status);
    return r.json();
  });
}

function levelFromRisk(task){
  if(task.level) return task.level;
  const r = task.risk_label;
  if(!r) return null;
  if(/高/.test(r)) return '紧急级';
  if(/中/.test(r)) return '关注级';
  if(/低/.test(r)) return '稳定级';
  return null;
}

function keyLabel(task){
  return levelFromRisk(task) || task.type || 'unknown';
}

function renderTypeStats(tasks){
  const by = tasks.reduce((acc,t)=>{ const k = keyLabel(t); acc[k]=(acc[k]||0)+1; return acc; },{});
  const frag = Object.entries(by).map(([k,v])=>`${k}: ${v}`).join(' · ');
  $('#typeStats').textContent = `分布：${frag}`;
}

function renderPartStats(parts){
  const frag = parts.map((group,i)=>`第${i+1}组 ${group.length}个`).join(' · ');
  $('#partStats').textContent = `分组：${frag}`;
}

function taskLink(task){
  // link to local file path relative to repo root.
  return task.path;
}

function setUploadStatus(message, state){
  const el = $('#uploadStatus');
  if(!el) return;
  el.textContent = message;
  el.classList.remove('success','error');
  if(state) el.classList.add(state);
}

function evaluateUploadStatus(){
  const records = Storage.list();
  if(!records.length){
    setUploadStatus('暂无本地问卷','');
    return;
  }
  const allUploaded = records.every(r=>r.uploaded_at);
  if(allUploaded)
    setUploadStatus('所有问卷已上传','success');
  else
    setUploadStatus('存在未上传问卷','error');
}

function renderList(group){
  const list = $('#taskList');
  list.innerHTML = '';
  if(group.length===0){ list.innerHTML = '<li>该组暂无任务</li>'; return; }

  const saved = Storage.list();

  group.forEach((t,idx)=>{
    const li = document.createElement('li');
    const done = saved.find(s=>s.task_id===t.id);
    const status = done ? '<small class="badge">已填写</small>' : '';
    const qs = new URLSearchParams({
      task: t.id,
      part: String(currentPart()),
      type: t.type,
      level: t.level || '',
      risk: t.risk_label || '',
      path: t.path
    }).toString();
    li.innerHTML = `
      <div><strong>${idx+1}. ${t.label}</strong> ${status}</div>
      <div class="meta">分级：${keyLabel(t)}${t.risk_label?` · 风险等级：${t.risk_label}`:''} · 路径：<code>${t.path}</code></div>
      <div class="actions">
        <a class="button secondary" target="_blank" href="${taskLink(t)}">打开报告</a>
        <a class="button" href="web/questionnaire.html?${qs}">去填写问卷</a>
      </div>
    `;
    list.appendChild(li);
  });
}

function currentPart(){ return Number($('#partSelect').value)||1; }

async function main(){
  const data = await loadJSON(TASKS_URL);
  $('#totalCount').textContent = data.task_count ?? data.tasks?.length ?? 0;
  renderTypeStats(data.tasks);

  // segmentation
  const seg = Segment.ensure(data.tasks, PARTS);
  renderPartStats(seg.parts);

  $('#partSelect').addEventListener('change',()=>{
    renderList(seg.parts[currentPart()-1]||[]);
  });
  $('#reloadSeg').addEventListener('click',()=>{
    const again = Segment.recompute(data.tasks, PARTS);
    renderPartStats(again.parts);
    renderList(again.parts[currentPart()-1]||[]);
  });

  const uploadBtn = $('#uploadAll');
  if(uploadBtn){
    uploadBtn.addEventListener('click',()=>{
      Export.uploadAll({
        onStart(){
          uploadBtn.disabled = true;
          setUploadStatus('正在上传...', '');
        },
        onSuccess(result){
          setUploadStatus('上传成功', 'success');
          uploadBtn.disabled = false;
          evaluateUploadStatus();
        },
        onError(err){
          console.error('上传失败', err);
          setUploadStatus(err?.message || '上传失败，请稍后重试', 'error');
          uploadBtn.disabled = false;
          evaluateUploadStatus();
        }
      }).catch(()=>{});
    });
  }

  const exportBtn = $('#exportJson');
  if(exportBtn){
    exportBtn.addEventListener('click',()=>{
      const records = Storage.list();
      if(!records.length){
        alert('暂无本地问卷数据可导出');
        return;
      }

      // 创建 JSON 文件内容
      const exportData = {
        exported_at: new Date().toISOString(),
        count: records.length,
        records: records
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      
      // 创建下载链接
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questionnaires_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setUploadStatus(`已导出 ${records.length} 份问卷`, 'success');
    });
  }

  $('#clearAll').addEventListener('click',()=>{
    if(confirm('确认清空所有本地问卷记录？')){
      Storage.clear();
      location.reload();
    }
  });

  renderList(seg.parts[currentPart()-1]||[]);
  evaluateUploadStatus();
}

window.addEventListener('DOMContentLoaded',()=>{
  main().catch(err=>{
    console.error(err);
    alert('加载任务失败：'+err.message);
  });
});
