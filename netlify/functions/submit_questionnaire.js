export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { formData, records } = payload;
  if (!formData && !(Array.isArray(records) && records.length)) {
    return { statusCode: 400, body: 'Missing formData or records' };
  }

  try {
    const { getStore } = await import('@netlify/blobs');
    const storeName = process.env.NETLIFY_BLOBS_STORE || 'questionnaires';
    
    // 尝试多种环境变量来获取配置
    const siteId = process.env.NETLIFY_BLOBS_SITE_ID 
      || process.env.NETLIFY_SITE_ID 
      || process.env.SITE_ID
      || event.headers['x-nf-site-id']; // Netlify 自动提供的 header
    
    const token = process.env.NETLIFY_BLOBS_TOKEN 
      || process.env.NETLIFY_AUTH_TOKEN
      || process.env.NETLIFY_TOKEN;
    
    const endpoint = process.env.NETLIFY_BLOBS_ENDPOINT;

    // 构建选项
    const options = { name: storeName };
    
    // 如果有 siteId 和 token，则手动配置
    if (siteId && token) {
      options.siteID = siteId; // 注意：属性名是 siteID（大写 ID）
      options.token = token;
      if (endpoint) {
        options.endpoint = endpoint;
      }
      console.log('Using manual Blobs configuration with siteID:', siteId.substring(0, 8) + '...');
    } else {
      // 否则依赖 Netlify 自动注入的环境配置
      console.log('Using automatic Netlify Blobs configuration');
    }

    const store = getStore(options);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let key;

    if (Array.isArray(records) && records.length) {
      key = `bundle_${timestamp}.json`;
      await store.set(
        key,
        JSON.stringify({
          uploaded_at: new Date().toISOString(),
          count: records.length,
          records,
        })
      );
    } else {
      key = `${timestamp}_${formData.task_id || 'unknown'}.json`;
      await store.set(
        key,
        JSON.stringify(formData),
        {
          metadata: {
            task_id: formData.task_id || '',
            task_level: formData.task_level || '',
            part: formData.part || '',
          },
        }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ key, store: storeName }),
    };
  } catch (err) {
    console.error('submit_questionnaire error:', err);
    return { statusCode: 500, body: err instanceof Error ? err.message : 'Upload failed' };
  }
};
