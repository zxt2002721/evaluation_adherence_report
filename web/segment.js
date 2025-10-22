/* Segmentation by type, proportional into N parts. Stable using saved seed. */

const Segment = (()=>{
  const KEY = 'segmentation_v1';

  const LEVEL_ORDER = ['紧急级','关注级','稳定级'];

  function inferFromRisk(r){
    if(!r) return null;
    if(/高/.test(r)) return '紧急级';
    if(/中/.test(r)) return '关注级';
    if(/低/.test(r)) return '稳定级';
    return null;
  }

  function groupingKey(t){
    return t.level || inferFromRisk(t.risk_label) || t.type || 'unknown';
  }

  function sortTasks(list){
    return list.slice().sort((a,b)=>{
      const la = groupingKey(a);
      const lb = groupingKey(b);
      const pa = LEVEL_ORDER.indexOf(la);
      const pb = LEVEL_ORDER.indexOf(lb);
      const orderA = pa === -1 ? LEVEL_ORDER.length : pa;
      const orderB = pb === -1 ? LEVEL_ORDER.length : pb;
      if(orderA !== orderB) return orderA - orderB;
      return (a.id||'').localeCompare(b.id||'');
    });
  }

  function proportionalSplit(tasks, partsCount){
    const sorted = sortTasks(tasks);
    const parts = Array.from({length:partsCount},()=>[]);

    const byLevel = new Map();
    for(const t of sorted){
      const key = groupingKey(t);
      if(!byLevel.has(key)) byLevel.set(key, []);
      byLevel.get(key).push(t);
    }

    const totals = {};
    for(const [key, items] of byLevel.entries()){
      totals[key] = items.length;
      const base = Math.floor(items.length / partsCount);
      let remainder = items.length % partsCount;
      let idx = 0;
      for(let p=0;p<partsCount;p++){
        const take = base + (remainder>0 ? 1 : 0);
        if(remainder>0) remainder--;
        for(let j=0;j<take;j++){
          const item = items[idx++];
          if(item) parts[p].push(item);
        }
      }
    }

    // Balance totals (deterministic) if lengths differ more than 1
    const total = tasks.length;
    const desired = Math.floor(total/partsCount);
    let remainder = total % partsCount;
    const targetSizes = Array.from({length:partsCount},(_,i)=>desired + (i < remainder ? 1 : 0));

    for(let p=0;p<partsCount;p++){
      while(parts[p].length > targetSizes[p]){
        // move last item to the smallest bucket that is below target
        const item = parts[p].pop();
        let dest = 0;
        for(let q=0;q<partsCount;q++){
          if(parts[q].length < targetSizes[q]){ dest = q; break; }
        }
        parts[dest].push(item);
      }
    }

    return {parts, totals, total};
  }

  function load(){
    try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch{ return null; }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }

  function ensure(tasks, n){
    const st = proportionalSplit(tasks, n);
    save(st);
    return st;
  }
  function recompute(tasks, n){
    const st = proportionalSplit(tasks, n);
    save(st);
    return st;
  }

  return { ensure, recompute };
})();
