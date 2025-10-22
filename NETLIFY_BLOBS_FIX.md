# Netlify Blobs 配置错误修复指南

## 错误信息
```
MissingBlobsEnvironmentError: The environment has not been configured to use Netlify Blobs. 
To use it manually, supply the following properties when creating a store: siteID, token
```

## 问题原因
Netlify Blobs 需要 `siteID` 和 `token` 才能工作，但环境变量未正确配置。

## 解决方案

### 方案 1：在 Netlify 控制台配置环境变量（推荐）

1. **登录 Netlify 控制台**
   - 访问 https://app.netlify.com/

2. **获取 Site ID**
   - 进入您的站点
   - 点击 `Site settings` → `General` → `Site details`
   - 复制 `Site ID`

3. **创建 Personal Access Token**
   - 点击右上角头像 → `User settings`
   - 选择 `Applications` → `Personal access tokens`
   - 点击 `New access token`
   - 输入描述（例如：Blobs Access）
   - 勾选权限（至少需要 `Sites` 相关权限）
   - 点击 `Generate token` 并复制令牌

4. **设置环境变量**
   - 回到站点设置
   - 点击 `Environment variables`
   - 添加以下变量：
     ```
     SITE_ID = your-site-id-here
     NETLIFY_AUTH_TOKEN = your-token-here
     ```

5. **重新部署**
   - 点击 `Deploys` → `Trigger deploy` → `Deploy site`

### 方案 2：启用 Netlify Blobs 自动配置

1. **确保 Netlify Blobs 插件已启用**
   - 检查 `netlify.toml` 是否包含：
     ```toml
     [[plugins]]
       package = "@netlify/blobs"
     ```

2. **在站点设置中启用 Blobs**
   - Netlify 控制台 → Site settings → Storage → Blobs
   - 确保 Blobs 存储已启用

### 方案 3：本地开发配置

如果在本地使用 Netlify Dev 测试：

1. **创建 `.env` 文件**（参考 `.env.example`）
   ```bash
   SITE_ID=your-site-id
   NETLIFY_AUTH_TOKEN=your-token
   ```

2. **运行 Netlify Dev**
   ```bash
   netlify dev
   ```

## 代码改进说明

已对 `submit_questionnaire.js` 进行以下改进：

1. ✅ 修复了属性名：`siteId` → `siteID`（正确的属性名）
2. ✅ 增加了更多环境变量来源（包括 Netlify headers）
3. ✅ 添加了日志输出，方便调试
4. ✅ 支持自动配置和手动配置两种模式

## 验证配置

部署后，查看 Function 日志应该看到：
- `Using manual Blobs configuration with siteID: xxxxx...` （手动配置成功）
- 或 `Using automatic Netlify Blobs configuration` （自动配置）

## 常见问题

**Q: 我设置了环境变量，但还是报错？**
A: 确保在添加环境变量后重新部署了站点。

**Q: Token 权限应该选哪些？**
A: 至少需要 `Sites` 相关的读写权限。

**Q: 本地测试可以，部署后失败？**
A: 检查 Netlify 控制台的环境变量是否正确设置。

## 相关文档

- [Netlify Blobs 官方文档](https://docs.netlify.com/blobs/overview/)
- [Netlify 环境变量配置](https://docs.netlify.com/environment-variables/overview/)
