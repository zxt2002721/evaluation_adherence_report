/* LocalStorage helpers for questionnaire records */

const Storage = (()=>{
  const KEY = 'questionnaires_v1';
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function save(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  function upsert(record){
    const list = load();
    const idx = list.findIndex(r=>r.task_id===record.task_id);
    if(idx>=0) list[idx]=record; else list.push(record);
    save(list);
  }
  function get(task_id){ return load().find(r=>r.task_id===task_id) || null; }
  function list(){ return load(); }
  function clear(){ localStorage.removeItem(KEY); }
  return { upsert, get, list, clear };
})();

