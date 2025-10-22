/**
 * 上传问卷数据到 GitHub 仓库
 * 使用 GitHub API 将数据存储为 JSON 文件
 */

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
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || 'zxt2002721';
    const githubRepo = process.env.GITHUB_REPO || 'evaluation_adherence_report';
    const githubBranch = process.env.GITHUB_BRANCH || 'main';
    const storagePath = process.env.GITHUB_STORAGE_PATH || 'questionnaire_data';

    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename, content;

    if (Array.isArray(records) && records.length) {
      filename = `${storagePath}/bundle_${timestamp}.json`;
      content = JSON.stringify({
        uploaded_at: new Date().toISOString(),
        count: records.length,
        records,
      }, null, 2);
    } else {
      filename = `${storagePath}/${timestamp}_${formData.task_id || 'unknown'}.json`;
      content = JSON.stringify({
        ...formData,
        uploaded_at: new Date().toISOString(),
      }, null, 2);
    }

    const apiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filename}`;
    console.log(`Uploading to GitHub: ${filename}`);

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function'
      },
      body: JSON.stringify({
        message: `Add questionnaire data: ${filename}`,
        content: Buffer.from(content).toString('base64'),
        branch: githubBranch,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        filename,
        url: result.content.html_url,
        sha: result.content.sha
      }),
    };
  } catch (err) {
    console.error('submit_questionnaire error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Upload failed'
      })
    };
  }
};