from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def update_text(path: str, updater) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    updated = updater(text)
    if updated != text:
        file_path.write_text(updated, encoding="utf-8")


def ensure_after(text: str, marker: str, insertion: str, exists: str) -> str:
    if exists in text:
        return text
    if marker not in text:
        return text
    return text.replace(marker, marker + "\n" + insertion, 1)


def wire_navigation() -> None:
    update_text(
        "index.html",
        lambda text: ensure_after(
            text,
            '        <a href="pages/research/">研究情报</a>',
            '        <a href="pages/conferences.html">会议资讯</a>',
            '<a href="pages/conferences.html">会议资讯</a>',
        ),
    )
    for file_path in (ROOT / "pages").glob("*.html"):
        if file_path.name == "conferences.html":
            continue
        rel = file_path.relative_to(ROOT).as_posix()
        update_text(
            rel,
            lambda text: ensure_after(
                text,
                '        <a href="research/">研究情报</a>',
                '        <a href="conferences.html">会议资讯</a>',
                '<a href="conferences.html">会议资讯</a>',
            ),
        )
    update_text(
        "pages/research/index.html",
        lambda text: ensure_after(
            text,
            '        <a href="./" aria-current="page">研究情报</a>',
            '        <a href="../conferences.html">会议资讯</a>',
            '<a href="../conferences.html">会议资讯</a>',
        ),
    )


def wire_home_card() -> None:
    card = """          <a class="portal-card" href="pages/conferences.html">
            <span>Conference</span>
            <strong>会议资讯</strong>
            <p>会议撷英、国际会议摘要解读和 MG 研究进展专题整理。</p>
          </a>
"""

    def updater(text: str) -> str:
        if '<a class="portal-card" href="pages/conferences.html">' in text:
            start = text.index('          <a class="portal-card" href="pages/conferences.html">')
            end = text.index("          </a>", start) + len("          </a>\n")
            text = text[:start] + card + text[end:]
            return text
        return text.replace('          <a class="portal-card" href="pages/huashan-team.html">', card + '          <a class="portal-card" href="pages/huashan-team.html">', 1)

    update_text("index.html", updater)


def wire_feed_item() -> None:
    path = ROOT / "data" / "items.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    item_id = "conference-ean-2026-mg-panorama"
    feed_item = {
        "id": item_id,
        "category": "会议摘要",
        "source": "EAN 2026",
        "language": "zh",
        "date": "2026-06-30",
        "title": "会议撷英：2026 EAN重症肌无力研究全景解读：从靶向治疗新时代到个体化精准管理",
        "summary": "归入“会议资讯 / 会议撷英”：系统梳理 EAN 2026 中重症肌无力相关摘要，覆盖 FcRn 抑制剂、补体抑制剂、B 细胞靶向治疗、真实世界证据、特殊亚群与数字化管理。",
        "url": "https://mg-intelligence-hub.huashanmuscle.com/pages/conferences.html",
        "trust": {
            "sourceType": "会议摘要整理",
            "evidenceLevel": "会议资讯 / 会议撷英",
            "reviewStatus": "人工整理",
            "lastChecked": "2026-06-30",
            "reviewNote": "会议摘要通常尚未完成完整同行评议，关键结论需等待正式全文、监管文件或后续真实世界数据验证。",
        },
        "tags": ["EAN 2026", "会议资讯", "会议撷英", "myasthenia gravis"],
    }
    items = [item for item in data["items"] if item.get("id") != item_id]
    insert_at = next((index for index, item in enumerate(items) if item.get("id") == "conference-watchlist"), len(items))
    items.insert(insert_at, feed_item)
    data["items"] = items
    data["updatedAt"] = "2026-06-30T00:00:00+08:00"
    data.get("provenance", {})["lastChecked"] = "2026-06-30"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def wire_sitemap() -> None:
    url = """  <url>
    <loc>https://mg-intelligence-hub.huashanmuscle.com/pages/conferences.html</loc>
    <lastmod>2026-06-30</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
"""
    update_text(
        "sitemap.xml",
        lambda text: text
        if "pages/conferences.html" in text
        else text.replace(
            "  <url>\n    <loc>https://mg-intelligence-hub.huashanmuscle.com/pages/huashan-team.html</loc>",
            url + "  <url>\n    <loc>https://mg-intelligence-hub.huashanmuscle.com/pages/huashan-team.html</loc>",
            1,
        ),
    )


def main() -> None:
    wire_navigation()
    wire_home_card()
    wire_feed_item()
    wire_sitemap()
    print("Conference page wiring updated.")


if __name__ == "__main__":
    main()
