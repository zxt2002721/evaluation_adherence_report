Simple static web UI for evaluating 24 task pages.

How it works:

- Loads `web/tasks.json` (generated from repo folders) to list tasks.
- Splits tasks into 3 parts proportionally by `type` (e.g., regular/urgent).
- Lets you open each task report and then fill a questionnaire.
- Saves each submission to `localStorage` and supports export to JSON/CSV.

Usage:

1) Ensure `web/tasks.json` exists. Generate via `python generate_tasks_manifest.py` from repo root.
2) Open `index.html` (repo根目录) 在浏览器中访问。最好通过本地 HTTP 服务打开（例如 VS Code Live Server 或 `python -m http.server`），避免 file:// 限制。
3) Choose a part (1/2/3), open tasks, and submit questionnaires.
4) 填写完成后，可在主界面点击“上传问卷到云端”将当前所有本地问卷一次性同步到 Netlify Blobs。

Custom 3-level grading (紧急级/关注级/稳定级):

- Create `task_levels.json` at repo root (see `task_levels.example.json` for a template).
- Keys are task folder names (e.g. `patient_urgent_...`), values are one of `紧急级`, `关注级`, `稳定级`.
- Re-run `python generate_tasks_manifest.py` to embed these levels into `web/tasks.json`.
- The UI will then segment proportionally by `level` (3 types). If no level is provided, it falls back to `type` inferred from folder name.

Upload exports to Google Drive (optional):

1) Install dependencies: `pip install google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib`.
2) Create a Google Cloud service account with Drive API access and download its JSON key.
3) Share your target Drive folder with the service account email.
4) Run `python upload_to_drive.py /path/to/questionnaires.csv --credentials /path/to/service-account.json --folder-id <folderId>`.
   - You can set `GOOGLE_APPLICATION_CREDENTIALS` instead of passing `--credentials`.

Automatic uploads while working locally:

- Install `watchdog` plus上述依赖：`pip install watchdog google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib`
- 启动监控脚本：
  `python watch_and_upload.py --files web/questionnaires.csv web/questionnaires.json --credentials service-account.json --folder-id <folderId>`
- 脚本会监听文件变更（例如导出后覆盖）并自动上传到 Google Drive。按 Ctrl+C 停止。

Online submission via Netlify Blobs:

- 在 Netlify Site settings 中启用 Blob storage 功能。
- （可选）设置环境变量 `NETLIFY_BLOBS_STORE` 指定存储名称，默认 `questionnaires`。
- 部署站点后，问卷提交会调用 `/.netlify/functions/submit_questionnaire`，自动将 JSON 写入 Netlify 的 Blob 存储，可在 Netlify UI 或 API 内下载。
- 主界面“上传问卷到云端”按钮会把当前本地所有问卷打包并上传为单个 JSON 文件，文件名包含时间戳，可在 Netlify Data → Blobs → `questionnaires` 中查看或下载。
