import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


def clean_text(value):
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def clean_number(value):
    if pd.isna(value) or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return clean_text(value)


def first_value(row, names):
    for name in names:
        if name in row:
            value = row.get(name)
            if not pd.isna(value):
                return value
    return ""


def normalize_issn(value):
    return re.sub(r"[^0-9X]", "", clean_text(value).upper())


def normalize_journal_name(value):
    text = clean_text(value).lower().replace("&", " and ")
    text = re.sub(r"\bthe\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return text.strip()


def load_existing_metric_index(output_path):
    if not output_path.exists():
        return {"issn": {}, "name": {}}
    try:
        payload = json.loads(output_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"issn": {}, "name": {}}

    index = {"issn": {}, "name": {}}
    for record in payload.get("records", []):
        for value in [record.get("issn"), record.get("eissn")]:
            key = normalize_issn(value)
            if key and key not in index["issn"]:
                index["issn"][key] = record
        for value in [record.get("journalName"), record.get("abbreviatedJournal")]:
            key = normalize_journal_name(value)
            if key and key not in index["name"]:
                index["name"][key] = record
    return index


def find_existing_metric(index, journal_name, abbreviated, issn, eissn):
    for value in [issn, eissn]:
        key = normalize_issn(value)
        if key and key in index["issn"]:
            return index["issn"][key]
    for value in [journal_name, abbreviated]:
        key = normalize_journal_name(value)
        if key and key in index["name"]:
            return index["name"][key]
    return {}


def infer_metric_year(path):
    match = re.search(r"(20\d{2})(?:[-_ ]?(\d{1,2}))?", path.name)
    if not match:
        return ""
    if match.group(2):
        return f"{match.group(1)}-{int(match.group(2)):02d}"
    return match.group(1)


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: import-journal-metrics.py <input.xlsx> <output.json>")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    df = pd.read_excel(input_path)
    existing_index = load_existing_metric_index(output_path)

    required_groups = {
        "journal name": ["Journal Name", "Journal name"],
        "abbreviated journal": ["Abbreviated Journal", "Abbreviated journal"],
        "impact factor": ["JIF", "2025 JIF"],
        "category": ["Category", "Categories"],
        "ISSN": ["ISSN"],
        "eISSN": ["eISSN"],
    }
    missing = [
        label
        for label, names in required_groups.items()
        if not any(name in df.columns for name in names)
    ]
    if missing:
        raise SystemExit(f"Missing columns: {', '.join(missing)}")

    records = []
    for _, row in df.iterrows():
        journal_name = clean_text(first_value(row, ["Journal Name", "Journal name"]))
        abbreviated = clean_text(first_value(row, ["Abbreviated Journal", "Abbreviated journal"]))
        if not journal_name and not abbreviated:
            continue
        issn = clean_text(first_value(row, ["ISSN"]))
        eissn = clean_text(first_value(row, ["eISSN"]))
        existing = find_existing_metric(existing_index, journal_name, abbreviated, issn, eissn)
        records.append({
            "journalName": journal_name,
            "abbreviatedJournal": abbreviated,
            "impactFactor": clean_number(first_value(row, ["JIF", "2025 JIF"])),
            "quartile": clean_text(first_value(row, ["JIF Quartile"])) or clean_text(existing.get("quartile")),
            "category": clean_text(first_value(row, ["Category", "Categories"])),
            "issn": issn,
            "eissn": eissn,
            "jifRank": clean_text(first_value(row, ["JIF Rank"])) or clean_text(existing.get("jifRank")),
            "jcrRank": clean_text(first_value(row, ["Rank"])),
            "fiveYearImpactFactor": clean_number(first_value(row, ["5-year JIF"])),
        })

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFile": input_path.name,
        "metricYear": infer_metric_year(input_path),
        "provenance": {
            "sourceType": "JCR Impact Factor Excel",
            "evidenceLevel": "Journal metric reference",
            "reviewStatus": "Excel imported; journal-level metrics require annual refresh",
            "reviewNote": "Impact Factor values are imported from the user-provided Excel file and matched to PubMed records by ISSN/eISSN or journal name. Quartile values are imported when present; if absent in the source file, previously matched quartiles are preserved where available."
        },
        "records": records,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(records)} journal metrics to {output_path}")


if __name__ == "__main__":
    main()
