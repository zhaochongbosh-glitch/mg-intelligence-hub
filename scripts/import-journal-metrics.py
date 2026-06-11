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

    required = ["Journal Name", "Abbreviated Journal", "JIF", "JIF Quartile", "Category", "ISSN", "eISSN"]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise SystemExit(f"Missing columns: {', '.join(missing)}")

    records = []
    for _, row in df.iterrows():
        journal_name = clean_text(row.get("Journal Name"))
        abbreviated = clean_text(row.get("Abbreviated Journal"))
        if not journal_name and not abbreviated:
            continue
        records.append({
            "journalName": journal_name,
            "abbreviatedJournal": abbreviated,
            "impactFactor": clean_number(row.get("JIF")),
            "quartile": clean_text(row.get("JIF Quartile")),
            "category": clean_text(row.get("Category")),
            "issn": clean_text(row.get("ISSN")),
            "eissn": clean_text(row.get("eISSN")),
            "jifRank": clean_text(row.get("JIF Rank")),
        })

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFile": input_path.name,
        "metricYear": infer_metric_year(input_path),
        "provenance": {
            "sourceType": "JCR Impact Factor Excel",
            "evidenceLevel": "Journal metric reference",
            "reviewStatus": "Excel imported; journal-level metrics require annual refresh",
            "reviewNote": "Impact Factor and quartile values are imported from the user-provided Excel file and matched to PubMed records by ISSN/eISSN or journal name."
        },
        "records": records,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(records)} journal metrics to {output_path}")


if __name__ == "__main__":
    main()
