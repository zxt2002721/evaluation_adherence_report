# GitHub 存储配置指南

## 📋 概述

已将问卷数据存储方案从 Netlify Blobs 改为 GitHub 仓库存储。

**优点：**
- ✅ 完全免费
- ✅ 数据持久化
- ✅ 版本历史记录
- ✅ 可在 GitHub 上直接查看
- ✅ 配置简单（只需 1 个 Token）

---

## 🚀 快速配置（3 步完成）

### 步骤 1：创建 GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
3. 填写信息：
   - **Note**（名称）：`Netlify Questionnaire Upload`
   - **Expiration**（过期时间）：建议选择 `No expiration` 或 `1 year`
   - **权限**：勾选 ✅ **`repo`**（完整的仓库访问权限）

4. 点击页面底部 **"Generate token"**
5. **重要：** 立即复制生成的 token（格式：`ghp_xxxxxxxxxxxx`），离开页面后无法再次查看

### 步骤 2：在 Netlify 设置环境变量

1. 登录 https://app.netlify.com/
2. 选择您的站点
3. 进入 **Site settings** → **Environment variables**
4. 点击 **"Add a variable"**
5. 添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `GITHUB_TOKEN` | `ghp_xxxx...` | 刚才复制的 GitHub Token（必需） |

6. 点击 **"Save"**

### 步骤 3：重新部署

1. 进入 **Deploys** 标签
2. 点击 **"Trigger deploy"** → **"Deploy site"**
3. 等待部署完成 ✅

---

## 📂 数据存储位置

问卷数据将存储在您的 GitHub 仓库中：

```
https://github.com/zxt2002721/evaluation_adherence_report/tree/main/questionnaire_data/
```

### 文件命名规则

- **单个问卷**：`questionnaire_data/2025-01-21T12-30-45-123Z_task123.json`
- **批量上传**：`questionnaire_data/bundle_2025-01-21T12-30-45-123Z.json`

---

## ⚙️ 可选配置（高级）

如果需要自定义配置，可以在 Netlify 环境变量中添加：

| Key | 默认值 | 说明 |
|-----|--------|------|
| `GITHUB_OWNER` | `zxt2002721` | GitHub 用户名 |
| `GITHUB_REPO` | `evaluation_adherence_report` | 仓库名称 |
| `GITHUB_BRANCH` | `main` | 分支名称 |
| `GITHUB_STORAGE_PATH` | `questionnaire_data` | 存储目录 |

---

## 🧪 本地测试

创建 `.env` 文件（已提供 `.env.example` 模板）：

```bash
GITHUB_TOKEN=ghp_your_token_here
```

运行 Netlify Dev：

```bash
netlify dev
```

---

## ✅ 验证配置

部署后，提交一份问卷，然后：

1. 查看 Netlify Function 日志（Deploys → Functions）
2. 应该看到：`Uploading to GitHub: questionnaire_data/xxx.json`
3. 访问 GitHub 仓库检查文件是否创建成功

---

## 🔍 查看数据

### 方法 1：GitHub Web 界面
访问：https://github.com/zxt2002721/evaluation_adherence_report/tree/main/questionnaire_data

### 方法 2：Git 命令
```bash
git pull origin main
cd questionnaire_data
ls -la
```

### 方法 3：GitHub API
```bash
curl https://api.github.com/repos/zxt2002721/evaluation_adherence_report/contents/questionnaire_data
```

---

## ❗ 常见问题

### Q: Token 权限不足？
**A:** 确保勾选了 `repo` 权限（完整仓库访问）

### Q: 提交后没有文件？
**A:** 
1. 检查 Netlify 环境变量是否正确设置
2. 查看 Function 日志是否有错误
3. 确认 token 有效且未过期

### Q: 文件名乱码？
**A:** 这是正常的时间戳格式（ISO 8601），包含时区信息

### Q: 能否存储到其他仓库？
**A:** 可以！设置 `GITHUB_OWNER` 和 `GITHUB_REPO` 环境变量

### Q: 数据安全吗？
**A:** 
- Token 存储在 Netlify 环境变量中（加密）
- 私有仓库：数据仅您可见
- 公开仓库：任何人可访问（注意隐私）

---

## 📊 数据格式

### 单个问卷
```json
{
  "task_id": "task123",
  "task_level": "1",
  "part": "A",
  "answers": {...},
  "uploaded_at": "2025-01-21T12:30:45.123Z"
}
```

### 批量上传
```json
{
  "uploaded_at": "2025-01-21T12:30:45.123Z",
  "count": 10,
  "records": [...]
}
```

---

## 🔄 回退到 Netlify Blobs

如需回退，请参考 `NETLIFY_BLOBS_FIX.md`

---

## 📞 支持

遇到问题？
1. 查看 Netlify Function 日志
2. 检查 GitHub Token 权限
3. 查看此文档的常见问题部分

---

**配置完成后，系统将自动将所有问卷数据上传到 GitHub！** 🎉
