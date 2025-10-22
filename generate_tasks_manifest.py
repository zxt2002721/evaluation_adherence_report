import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).parent
WEB = ROOT / "web"
LEVELS_JSON = ROOT / "task_levels.json"

def load_levels_map():
    if LEVELS_JSON.exists():
        try:
            data = json.loads(LEVELS_JSON.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return data
        except Exception as e:
            print(f"Warning: failed to read task_levels.json: {e}")
    return {}

def detect_level_from_html(text: str, risk_score: int | None = None, risk_label: str | None = None):
    tlow = text.lower()
    # 1) Try to read CSS class on urgency banner
    m = re.search(r'class\s*=\s*"([^"]*urgency-banner[^"]*)"', text, re.IGNORECASE)
    if m:
        classes = set(m.group(1).lower().split())
        if 'urgency-urgent' in classes:
            return '紧急级'
        if any(c in classes for c in ['urgency-attention','urgency-warning','urgency-yellow']):
            return '关注级'
        if any(c in classes for c in ['urgency-stable','urgency-green','urgency-normal','urgency-low']):
            return '稳定级'
    # 2) Fallback to visible labels / emojis
    if ('紧急级' in text) or ('🔴' in text):
        return '紧急级'
    if ('关注级' in text) or ('🟡' in text):
        return '关注级'
    if ('稳定级' in text) or ('🟢' in text):
        return '稳定级'
    # 3) Last resort: infer from risk label or risk score
    if risk_label:
        if '高' in risk_label:
            return '紧急级'
        if '中' in risk_label:
            return '关注级'
        if '低' in risk_label:
            return '稳定级'
    if isinstance(risk_score, int):
        if risk_score >= 60:
            return '紧急级'
        if risk_score >= 40:
            return '关注级'
        return '稳定级'
    return None

def detect_risk_score(text: str):
    m = re.search(r"风险评分[:：]\s*(\d+)\s*/\s*100", text)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            return None
    return None

def detect_risk_label(text: str):
    m = re.search(r"风险等级[:：]\s*([\u4e00-\u9fa5A-Za-z]+)", text)
    if m:
        return m.group(1).strip()
    return None

def find_tasks():
    tasks = []
    levels_map = load_levels_map()
    for d in sorted([p for p in ROOT.iterdir() if p.is_dir() and p.name.startswith("patient_")]):
        # infer type from folder name
        if "regular" in d.name:
            ttype = "regular"
        elif "urgent" in d.name:
            ttype = "urgent"
        else:
            ttype = "unknown"

        # find doctor_report.html under compliance_*/
        report = None
        for sub in d.glob("compliance_*/*"):
            if sub.name == "doctor_report.html":
                report = sub
                break
        if report is None:
            # fallback: search deeper just in case
            for sub in d.rglob("doctor_report.html"):
                report = sub
                break

        if report is None:
            # skip if no report found
            continue

        # create a simple id and label
        task_id = d.name
        label = d.name

        rel = report.relative_to(ROOT)
        level = levels_map.get(d.name)
        risk_score = None
        risk_label = None

        try:
            html = report.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            print(f"Warning: failed to read {report}: {e}")
            html = ''

        risk_score = detect_risk_score(html)
        risk_label = detect_risk_label(html)

        if level is None:
            try:
                level = detect_level_from_html(html, risk_score, risk_label)
            except Exception as e:
                print(f"Warning: parse failed for {report}: {e}")

        tasks.append({
            "id": task_id,
            "label": label,
            "type": ttype,
            "level": level,
            "risk_score": risk_score,
            "risk_label": risk_label,
            "path": str(rel.as_posix())
        })

    return tasks

def main():
    WEB.mkdir(exist_ok=True)
    tasks = find_tasks()
    out = {
        "generated_at": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        "task_count": len(tasks),
        "tasks": tasks,
    }
    (WEB / "tasks.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(tasks)} tasks to web/tasks.json")
    # summary
    from collections import Counter
    type_counts = Counter(t["type"] for t in tasks)
    level_vals = [t.get("level") for t in tasks if t.get("level")]
    if level_vals:
        level_counts = Counter(level_vals)
        print("Levels:", dict(level_counts))
    risk_labels = [t.get("risk_label") for t in tasks if t.get("risk_label")]
    if risk_labels:
        print("Risk labels:", dict(Counter(risk_labels)))
    print("Types:", dict(type_counts))

if __name__ == "__main__":
    main()
