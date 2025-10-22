# 🚀 快速配置指南

## 只需 3 步，2 分钟完成！

### 📝 步骤 1：创建 GitHub Token（1 分钟）

1. 打开：https://github.com/settings/tokens/new
2. 填写：
   - **Note**：`Netlify Upload` 
   - **Expiration**：选择 `No expiration`
   - **权限**：勾选 ✅ **`repo`**
3. 点击底部绿色按钮 **"Generate token"**
4. **复制** token（`ghp_xxxx...`）

### ⚙️ 步骤 2：配置 Netlify（30 秒）

1. 打开：https://app.netlify.com/ → 您的站点 → **Site settings** → **Environment variables**
2. 点击 **"Add a variable"**
3. 填写：
   - **Key**：`GITHUB_TOKEN`
   - **Value**：粘贴刚才的 token
4. 点击 **"Save"**

### 🚀 步骤 3：重新部署（30 秒）

1. 点击 **Deploys** → **"Trigger deploy"** → **"Deploy site"**
2. 等待部署完成 ✅

---

## ✅ 完成！

现在问卷数据会自动上传到：

```
https://github.com/zxt2002721/evaluation_adherence_report/tree/main/questionnaire_data/
```

---

## 📖 详细文档

需要更多信息？查看：`GITHUB_STORAGE_SETUP.md`

---

## 🔍 验证配置

提交一份问卷后：
1. 查看 GitHub 仓库的 `questionnaire_data` 文件夹
2. 应该能看到新创建的 JSON 文件

---

**就这么简单！** 🎉
