"""Watch local questionnaire exports and push them to Google Drive.

This script monitors one or more files (e.g. `web/questionnaires.csv`) and
automatically uploads the latest version to Google Drive whenever the files
change. It reuses the `upload_to_drive.py` helper and supports the same
service-account based authentication.

Example usage:

    pip install watchdog google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib

    python watch_and_upload.py \
        --files web/questionnaires.csv web/questionnaires.json \
        --credentials service-account.json \
        --folder-id <drive-folder-id>

Press Ctrl+C to stop the watcher.
"""

from __future__ import annotations

import argparse
import queue
import threading
import time
from pathlib import Path
from typing import Iterable, Optional

from watchdog.events import FileSystemEventHandler, FileModifiedEvent, FileCreatedEvent
from watchdog.observers import Observer

from upload_to_drive import upload_to_drive


class TargetFileWatcher(FileSystemEventHandler):
    def __init__(self, targets: set[Path], pending_queue: "queue.Queue[Path]") -> None:
        super().__init__()
        self.targets = {p.resolve() for p in targets}
        self.pending_queue = pending_queue

    def _handle_event(self, src_path: str) -> None:
        path = Path(src_path).resolve()
        if path in self.targets:
            self.pending_queue.put(path)

    def on_modified(self, event: FileModifiedEvent) -> None:  # type: ignore[override]
        if not event.is_directory:
            self._handle_event(event.src_path)

    def on_created(self, event: FileCreatedEvent) -> None:  # type: ignore[override]
        if not event.is_directory:
            self._handle_event(event.src_path)


def worker(
    pending_queue: "queue.Queue[Path]",
    debounce: float,
    credentials: Optional[Path],
    folder_id: Optional[str],
) -> None:
    """Consume file events and upload after a debounce interval."""

    while True:
        path = pending_queue.get()
        try:
            time.sleep(debounce)
            print(f"Uploading {path} -> Google Drive ...")
            result = upload_to_drive(path, credentials, folder_id)
            link = result.get("webViewLink") or result.get("webContentLink")
            print(f"  ✓ Upload complete. File ID: {result.get('id')}"
                  + (f" | Link: {link}" if link else ""))
        except Exception as exc:  # noqa: BLE001
            print(f"  ✗ Upload failed for {path}: {exc}")
        finally:
            pending_queue.task_done()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Watch files and upload to Google Drive when they change")
    parser.add_argument(
        "--files",
        nargs="+",
        type=Path,
        required=True,
        help="List of files to monitor (e.g. web/questionnaires.csv web/questionnaires.json)",
    )
    parser.add_argument(
        "--credentials",
        type=Path,
        help="Path to the Google service-account JSON credentials."
             " If omitted, GOOGLE_APPLICATION_CREDENTIALS env var is used.",
    )
    parser.add_argument(
        "--folder-id",
        help="Optional Drive folder ID to upload into.",
    )
    parser.add_argument(
        "--debounce",
        type=float,
        default=2.0,
        help="Seconds to wait after a change before uploading (default: 2.0).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    files: list[Path] = [p.resolve() for p in args.files]

    missing = [p for p in files if not p.exists()]
    if missing:
        print("Warning: the following files do not exist yet; watcher will wait for them:")
        for p in missing:
            print(f"  - {p}")

    pending: "queue.Queue[Path]" = queue.Queue()

    thread = threading.Thread(
        target=worker,
        args=(pending, args.debounce, args.credentials, args.folder_id),
        daemon=True,
    )
    thread.start()

    directories = {p.parent for p in files}
    observer = Observer()
    for directory in directories:
        observer.schedule(TargetFileWatcher(set(files), pending), str(directory), recursive=False)
        print(f"Watching {directory} ...")

    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping watcher ...")
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()

