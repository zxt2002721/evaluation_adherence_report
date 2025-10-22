"""Upload exported questionnaire files to Google Drive.

Prerequisites:
  pip install google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib
  Create a Google Cloud service account with Drive API access (Drive API enabled).
  Share the destination Drive folder with the service account email.

Usage:
  python upload_to_drive.py web/questionnaires.csv \
      --credentials path/to/service-account.json \
      --folder-id <drive-folder-id>

If --credentials is omitted, the script will look for the
GOOGLE_APPLICATION_CREDENTIALS environment variable.
"""

from __future__ import annotations

import argparse
import mimetypes
import os
from pathlib import Path
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def upload_to_drive(file_path: Path, creds_path: Optional[Path], folder_id: Optional[str]) -> dict:
    """Upload a local file to Google Drive using a service account."""

    if creds_path is None:
        env_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not env_path:
            raise SystemExit("Credentials path missing: provide --credentials or set GOOGLE_APPLICATION_CREDENTIALS")
        creds_path = Path(env_path)

    creds = service_account.Credentials.from_service_account_file(str(creds_path))

    creds = creds.with_scopes(SCOPES)

    service = build("drive", "v3", credentials=creds)

    mime_type, _ = mimetypes.guess_type(file_path.name)
    media = MediaFileUpload(str(file_path), mimetype=mime_type or "application/octet-stream")

    metadata = {"name": file_path.name}
    if folder_id:
        metadata["parents"] = [folder_id]

    request = service.files().create(body=metadata, media_body=media, fields="id,webViewLink,webContentLink")
    return request.execute()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload a file to Google Drive")
    parser.add_argument("file", type=Path, help="Path to the local file to upload")
    parser.add_argument("--credentials", type=Path, help="Path to the service-account JSON credentials")
    parser.add_argument("--folder-id", help="Destination Drive folder ID (optional)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    file_path: Path = args.file

    if not file_path.exists():
        raise SystemExit(f"File not found: {file_path}")

    result = upload_to_drive(file_path, args.credentials, args.folder_id)
    link = result.get("webViewLink") or result.get("webContentLink")
    print("Upload successful. File ID:", result.get("id"))
    if link:
        print("View/download link:", link)


if __name__ == "__main__":
    main()
