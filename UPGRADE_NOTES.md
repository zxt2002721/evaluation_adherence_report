# 📊 问卷数据存储升级

## ✨ 更新内容

已将问卷数据存储从 **Netlify Blobs** 升级为 **GitHub 仓库存储**。

### 为什么更改？

| | Netlify Blobs | GitHub 存储 |
|---|---|---|
| **配置复杂度** | ❌ 需要 Site ID + Token | ✅ 只需 1 个 Token |
| **费用** | ⚠️ 可能收费 | ✅ 完全免费 |
| **数据持久化** | ✅ 持久化 | ✅ 持久化 |
| **版本历史** | ❌ 无 | ✅ 有 Git 历史 |
| **可视化** | ⚠️ 需 API | ✅ GitHub Web 界面 |
| **数据导出** | ⚠️ 需编程 | ✅ 可直接克隆 |

---

## 🚀 快速开始

### 方式 1：超快速（推荐）

查看：**[QUICKSTART.md](./QUICKSTART.md)** - 只需 3 步，2 分钟！

### 方式 2：详细指南

查看：**[GITHUB_STORAGE_SETUP.md](./GITHUB_STORAGE_SETUP.md)** - 完整文档

---

## 📦 更改的文件

```
modified:   netlify/functions/submit_questionnaire.js  # 改用 GitHub API
modified:   package.json                                # 移除 @netlify/blobs 依赖
modified:   netlify.toml                                # 更新配置说明
modified:   .env.example                                # 新的环境变量模板
new file:   QUICKSTART.md                               # 快速配置指南
new file:   GITHUB_STORAGE_SETUP.md                     # 详细配置文档
new file:   test_github_upload.js                       # 测试脚本
new file:   .gitignore                                  # Git 忽略规则
```

---

## ✅ 配置检查清单

- [ ] 创建 GitHub Personal Access Token（需要 `repo` 权限）
- [ ] 在 Netlify 环境变量中设置 `GITHUB_TOKEN`
- [ ] 重新部署 Netlify 站点
- [ ] 测试提交一份问卷
- [ ] 检查 GitHub 仓库的 `questionnaire_data` 目录

---

## 🧪 本地测试

### 方法 1：使用测试脚本

```bash
# 设置 Token
$env:GITHUB_TOKEN="your_token_here"

# 运行测试
node test_github_upload.js
```

### 方法 2：使用 Netlify Dev

```bash
# 创建 .env 文件
echo "GITHUB_TOKEN=your_token_here" > .env

# 启动开发服务器
netlify dev
```

---

## 📂 数据存储位置

所有问卷数据将存储在：

```
https://github.com/zxt2002721/evaluation_adherence_report/tree/main/questionnaire_data/
```

### 文件结构

```
questionnaire_data/
├── 2025-01-21T12-30-45-123Z_task001.json      # 单个问卷
├── 2025-01-21T12-35-20-456Z_task002.json
├── bundle_2025-01-21T13-00-00-789Z.json       # 批量上传
└── ...
```

---

## 🔍 查看数据

### 在 GitHub Web 界面
https://github.com/zxt2002721/evaluation_adherence_report/tree/main/questionnaire_data

### 使用 Git 命令
```bash
git clone https://github.com/zxt2002721/evaluation_adherence_report.git
cd evaluation_adherence_report/questionnaire_data
ls -la
```

### 使用 GitHub API
```bash
curl https://api.github.com/repos/zxt2002721/evaluation_adherence_report/contents/questionnaire_data
```

---

## 📊 数据格式

### 单个问卷
```json
{
  "task_id": "task123",
  "task_level": "1",
  "part": "A",
  "answers": { ... },
  "uploaded_at": "2025-01-21T12:30:45.123Z"
}
```

### 批量上传
```json
{
  "uploaded_at": "2025-01-21T12:30:45.123Z",
  "count": 10,
  "records": [
    { ... },
    { ... }
  ]
}
```

---

## ❓ 常见问题

### Q: 需要修改前端代码吗？
**A:** 不需要！API 接口保持不变，前端无需修改。

### Q: 旧的 Netlify Blobs 数据怎么办？
**A:** 需要手动迁移。可以使用 Netlify CLI 导出数据。

### Q: 可以用其他仓库吗？
**A:** 可以！设置 `GITHUB_OWNER` 和 `GITHUB_REPO` 环境变量。

### Q: 数据安全吗？
**A:** 
- 私有仓库：只有您能访问
- Token 加密存储在 Netlify
- 建议定期轮换 Token

### Q: 有数据大小限制吗？
**A:** 
- 单个文件：< 100MB（GitHub 限制）
- 仓库总大小：建议 < 1GB
- 对于问卷数据完全足够

---

## 🔄 回退方案

如果需要回退到 Netlify Blobs，查看：`NETLIFY_BLOBS_FIX.md`

---

## 📞 技术支持

遇到问题？

1. 查看 **[GITHUB_STORAGE_SETUP.md](./GITHUB_STORAGE_SETUP.md)** 的"常见问题"部分
2. 运行 `node test_github_upload.js` 测试配置
3. 检查 Netlify Function 日志

---

## 📝 更新日志

**2025-01-21**
- ✅ 迁移到 GitHub 存储
- ✅ 移除 Netlify Blobs 依赖
- ✅ 添加测试脚本
- ✅ 完善文档

---

**升级完成！享受更简单、免费的数据存储方案！** 🎉
