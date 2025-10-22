/* Upload questionnaire records to Netlify */

const Export = (()=>{
  async function uploadAll({ onStart, onSuccess, onError } = {}){
    const data = Storage.list();
    if(!data.length){
      const err = new Error('本地暂无已保存的问卷');
      onError?.(err);
      throw err;
    }

    onStart?.();

    try{
      const res = await fetch('/.netlify/functions/submit_questionnaire', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ records: data })
      });
      if(!res.ok){
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const result = await res.json();
      const uploadedAt = new Date().toISOString();
      data.forEach(rec=>{
        rec.uploaded_at = uploadedAt;
        rec.upload_response = result;
        Storage.upsert(rec);
      });
      onSuccess?.(result);
      return result;
    }catch(err){
      onError?.(err);
      throw err;
    }
  }

  return { uploadAll };
})();
