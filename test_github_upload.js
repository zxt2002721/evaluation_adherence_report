#!/usr/bin/env node

/**
 * 测试 GitHub 存储配置
 * 用法：node test_github_upload.js
 */

// 模拟 Netlify Function 的环境
const testConfig = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'YOUR_TOKEN_HERE',
  GITHUB_OWNER: process.env.GITHUB_OWNER || 'zxt2002721',
  GITHUB_REPO: process.env.GITHUB_REPO || 'evaluation_adherence_report',
  GITHUB_BRANCH: process.env.GITHUB_BRANCH || 'main',
  GITHUB_STORAGE_PATH: process.env.GITHUB_STORAGE_PATH || 'questionnaire_data'
};

// 测试数据
const testData = {
  task_id: 'test_task_001',
  task_level: '1',
  part: 'A',
  answer: 'Test answer',
  submitted_at: new Date().toISOString()
};

async function testGitHubUpload() {
  console.log('🧪 开始测试 GitHub 上传配置...\n');

  // 检查 Token
  if (testConfig.GITHUB_TOKEN === 'YOUR_TOKEN_HERE' || !testConfig.GITHUB_TOKEN) {
    console.error('❌ 错误：未设置 GITHUB_TOKEN');
    console.log('\n请设置环境变量：');
    console.log('  export GITHUB_TOKEN=your_token_here  # macOS/Linux');
    console.log('  $env:GITHUB_TOKEN="your_token_here"  # Windows PowerShell');
    process.exit(1);
  }

  console.log('📋 配置信息：');
  console.log(`  Owner: ${testConfig.GITHUB_OWNER}`);
  console.log(`  Repo: ${testConfig.GITHUB_REPO}`);
  console.log(`  Branch: ${testConfig.GITHUB_BRANCH}`);
  console.log(`  Path: ${testConfig.GITHUB_STORAGE_PATH}`);
  console.log(`  Token: ${testConfig.GITHUB_TOKEN.substring(0, 8)}...`);
  console.log();

  // 创建测试文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${testConfig.GITHUB_STORAGE_PATH}/test_${timestamp}.json`;
  const content = JSON.stringify({
    ...testData,
    uploaded_at: new Date().toISOString(),
    note: 'This is a test file. You can delete it.'
  }, null, 2);

  console.log(`📤 上传测试文件: ${filename}`);

  try {
    const apiUrl = `https://api.github.com/repos/${testConfig.GITHUB_OWNER}/${testConfig.GITHUB_REPO}/contents/${filename}`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${testConfig.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script'
      },
      body: JSON.stringify({
        message: `Test upload: ${filename}`,
        content: Buffer.from(content).toString('base64'),
        branch: testConfig.GITHUB_BRANCH,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GitHub API 错误: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    console.log('\n✅ 上传成功！\n');
    console.log('📂 文件信息：');
    console.log(`  文件名: ${filename}`);
    console.log(`  SHA: ${result.content.sha}`);
    console.log(`  URL: ${result.content.html_url}`);
    console.log('\n🎉 配置正确！可以部署到 Netlify 了。');

  } catch (err) {
    console.error('\n❌ 上传失败：', err.message);
    console.log('\n可能的原因：');
    console.log('  1. Token 权限不足（需要 repo 权限）');
    console.log('  2. Token 已过期');
    console.log('  3. 仓库名称或用户名错误');
    console.log('  4. 网络连接问题');
    process.exit(1);
  }
}

// 运行测试
testGitHubUpload().catch(err => {
  console.error('❌ 测试失败：', err);
  process.exit(1);
});
