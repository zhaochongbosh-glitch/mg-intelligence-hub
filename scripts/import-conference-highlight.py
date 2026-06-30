from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]


def clean(text: str) -> str:
    return text.strip().replace("\xa0", " ")


def slug(text: str) -> str:
    mapping = {
        "一、FcRn抑制剂：从成人到儿童，从临床试验到真实世界": "fcrn",
        "二、补体抑制剂：从下游C5到上游C1s，从急性期到长期维持": "complement",
        "三、B细胞靶向治疗与新型生物制剂": "b-cell",
        "四、真实世界证据与流行病学": "rwe",
        "五、特殊亚群与精准治疗": "precision",
        "六、数字化与患者报告结局": "digital",
        "总结与展望": "summary",
    }
    if text in mapping:
        return mapping[text]
    fallback = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return fallback or "section"


def parse_docx(doc_path: Path) -> dict:
    lines = [clean(p.text) for p in Document(doc_path).paragraphs if clean(p.text)]
    if len(lines) < 4:
        raise SystemExit("Document is too short to import as conference highlight.")

    article = {
        "title": lines[0],
        "byline": lines[1],
        "intro": lines[2],
        "sections": [],
        "references": [],
        "disclaimer": "",
    }

    current_section = None
    current_subsection = None
    in_references = False
    in_disclaimer = False
    skip_table_lines = 0

    def start_section(text: str) -> None:
        nonlocal current_section, current_subsection
        current_section = {"title": text, "id": slug(text), "blocks": []}
        article["sections"].append(current_section)
        current_subsection = None

    def add_block(kind: str, text: str) -> None:
        if current_section is None:
            start_section("会议撷英")
        target = current_subsection["blocks"] if current_subsection else current_section["blocks"]
        target.append({"kind": kind, "text": text})

    for line in lines[3:]:
        if in_disclaimer:
            article["disclaimer"] = f"{article['disclaimer']} {line}".strip()
            continue
        if line.startswith("免责声明"):
            in_disclaimer = True
            article["disclaimer"] = line.replace("免责声明：", "").strip()
            continue
        if in_references:
            article["references"].append(line)
            continue
        if line.startswith("参考文献"):
            in_references = True
            continue
        if skip_table_lines:
            skip_table_lines -= 1
            continue
        if re.match(r"^[一二三四五六]、", line) or line == "总结与展望":
            start_section(line)
            continue
        if current_section is None:
            start_section("会议撷英")
        if re.match(r"^\d+\.\d+", line):
            current_subsection = {"title": line, "blocks": []}
            current_section["blocks"].append({"kind": "subsection", "subsection": current_subsection})
            continue
        if line == "指标":
            add_block("table", "")
            skip_table_lines = 6
            continue
        if re.match(r"^\d）", line):
            add_block("trend", line)
            continue
        add_block("p", line)

    return article


def render_block(block: dict) -> str:
    kind = block["kind"]
    if kind == "subsection":
        subsection = block["subsection"]
        inner = "\n".join(render_block(child) for child in subsection["blocks"])
        return f"""<section class="conference-subsection">
  <h3>{html.escape(subsection["title"])}</h3>
  {inner}
</section>"""
    if kind == "table":
        return """<div class="conference-table-wrap"><table class="conference-table">
  <thead><tr><th>指标</th><th>Claseprubart vs 安慰剂</th></tr></thead>
  <tbody>
    <tr><td>双重应答率（MG-ADL≥3 + QMG≥4）</td><td>63% vs 14%（OR=29.00, p=0.0006）</td></tr>
    <tr><td>首次应答时间</td><td>早至第1周，中位第3周</td></tr>
    <tr><td>应答持续性</td><td>所有第13周应答者维持≥6周</td></tr>
  </tbody>
</table></div>"""
    if kind == "trend":
        return f'<p class="trend-line">{html.escape(block["text"])}</p>'
    return f"<p>{html.escape(block['text'])}</p>"


def render_page(article: dict) -> str:
    display_title = article["title"].replace("会议撷英--", "会议撷英：")
    key_takeaways = [
        ("靶向治疗进入多机制竞争期", "FcRn、C5/C1s、CD19、APRIL/BAFF 等机制并行推进，MG 治疗正在从单一免疫抑制走向多靶点精准干预。"),
        ("早期与特殊亚群更受关注", "青少年 gMG、早期病程、MuSK+ MG、胸腺瘤相关 MG、妊娠及极晚发型 MG 均出现更细分的数据。"),
        ("真实世界证据开始回答临床问题", "激素减量、治疗持续性、危象负担、经济负担和患者偏好成为本届 EAN MG 研究的重要补充维度。"),
        ("去激素化与给药便利性成为新目标", "长期控制、减少激素暴露、改善生活质量和降低给药负担，正在重塑“理想治疗”的评价框架。"),
        ("会议摘要仍需审慎解读", "会议摘要多为阶段性结果，尚未完全同行评议，关键结论需等待全文发表、监管文件或后续真实世界验证。"),
    ]
    toc = "\n".join(
        f'<a href="#{html.escape(section["id"])}">{html.escape(section["title"])}<span></span></a>'
        for section in article["sections"]
    )
    takeaways = "\n".join(
        f"<article><strong>{html.escape(title)}</strong><p>{html.escape(body)}</p></article>"
        for title, body in key_takeaways
    )
    sections = "\n".join(
        f"""<section class="conference-section" id="{html.escape(section["id"])}">
  <h2>{html.escape(section["title"])}</h2>
  {"".join(render_block(block) for block in section["blocks"])}
</section>"""
        for section in article["sections"]
    )
    references = "\n".join(f"<li>{html.escape(ref)}</li>" for ref in article["references"])

    return f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="2026 EAN 重症肌无力研究全景解读，梳理 FcRn 抑制剂、补体抑制剂、B 细胞靶向治疗、真实世界证据、特殊亚群与数字化管理进展。" />
    <title>会议撷英：2026 EAN 重症肌无力研究全景解读 | 重症肌无力信息港</title>
    <link rel="stylesheet" href="../styles.css" />
    <link rel="canonical" href="https://mg-intelligence-hub.huashanmuscle.com/pages/conferences.html" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="重症肌无力信息港" />
    <meta property="og:title" content="会议撷英：2026 EAN 重症肌无力研究全景解读" />
    <meta property="og:description" content="从靶向治疗新时代到个体化精准管理，系统梳理 EAN 2026 MG 相关核心研究进展。" />
    <meta property="og:url" content="https://mg-intelligence-hub.huashanmuscle.com/pages/conferences.html" />
    <meta property="og:image" content="https://mg-intelligence-hub.huashanmuscle.com/assets/hero-research-hub.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <script src="https://tracking.huashanmuscle.com/api/script.js" data-site-id="5472948dff6d" defer></script>
  </head>
  <body data-page="conferences">
    <header class="page-hero conference-hero">
      <div>
        <p class="eyebrow">Conference Intelligence · 会议撷英</p>
        <h1>{html.escape(display_title)}</h1>
        <p>{html.escape(article["intro"])}</p>
        <div class="conference-meta" aria-label="会议文章信息">
          <span>会议：EAN 2026</span>
          <span>地点：瑞士日内瓦</span>
          <span>时间：2026-06-27 至 2026-06-30</span>
          <span>类目：会议资讯 / 会议撷英</span>
        </div>
      </div>
    </header>

    <main>
      <nav class="section-nav" aria-label="页面导航">
        <a href="../index.html">首页</a>
        <a href="research/">研究情报</a>
        <a href="conferences.html" aria-current="page">会议资讯</a>
        <a href="huashan-team.html">华山MG团队</a>
        <a href="therapy.html">治疗与证据</a>
        <a href="safety.html">安全监测</a>
        <a href="china-access.html">中国准入</a>
        <a href="evidence-chain.html">证据链</a>
        <a href="trials-market.html">试验与市场</a>
        <a href="guidance.html">指南路径</a>
        <a href="disclaimer.html">使用说明</a>
        <a href="data-status.html">数据状态</a>
      </nav>

      <section class="module-section conference-brief">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Editorial Brief</p>
            <h2>网页导读</h2>
            <p>本文由上传 Word 稿件整理为站内会议资讯长文，适合网页阅读、微信内置浏览器浏览和社交媒体转发。</p>
          </div>
          <span class="article-badge">会议撷英</span>
        </div>
        <div class="conference-brief-grid">
          <article>
            <span>摘要规模</span>
            <strong>85 篇 MG 相关摘要</strong>
            <p>覆盖口头报告、电子海报、药物机制、真实世界研究与患者报告结局。</p>
          </article>
          <article>
            <span>核心主题</span>
            <strong>靶向治疗与精准管理</strong>
            <p>聚焦 FcRn、补体、B 细胞通路及特殊亚群治疗策略。</p>
          </article>
          <article>
            <span>证据属性</span>
            <strong>会议摘要整理</strong>
            <p>用于学术情报和研究跟踪，临床决策仍需回到全文、指南与监管文件。</p>
          </article>
        </div>
      </section>

      <section class="article-layout">
        <aside class="article-toc" aria-label="文章目录">
          <strong>目录</strong>
          {toc}
        </aside>
        <article class="conference-article">
          <div class="article-title-block">
            <p class="section-kicker">{html.escape(article["byline"])}</p>
            <h2>从靶向治疗新时代到个体化精准管理</h2>
            <p>{html.escape(article["intro"])}</p>
          </div>

          <section class="key-takeaways" aria-label="重点结论">
            <p class="section-kicker">Key Takeaways</p>
            <h2>值得优先关注的 5 个信号</h2>
            <div class="takeaway-grid">
              {takeaways}
            </div>
          </section>

          {sections}

          <section class="conference-section reference-section" id="references">
            <h2>参考文献与摘要来源</h2>
            <p>以下参考文献均来自第12届欧洲神经病学年会（EAN 2026）摘要集，发表于 <em>European Journal of Neurology</em> Volume 33, Supplement 1, June 2026。</p>
            <details open>
              <summary>展开 EAN 2026 MG 相关摘要编号</summary>
              <ol class="reference-list">
                {references}
              </ol>
            </details>
          </section>

          <section class="article-disclaimer" id="disclaimer">
            <strong>免责声明</strong>
            <p>{html.escape(article["disclaimer"])}</p>
          </section>
        </article>
      </section>
    </main>

    <footer>
      <p>仅用于科研与医学情报整理，不构成医疗建议。会议摘要内容请以大会摘要集、正式全文和监管文件为准。</p>
    </footer>

    <script type="application/ld+json">
      {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "会议撷英：2026 EAN重症肌无力研究全景解读",
        "datePublished": "2026-06-30",
        "dateModified": "2026-06-30",
        "author": {{ "@type": "Person", "name": "赵重波 & Hermes" }},
        "publisher": {{ "@type": "Organization", "name": "重症肌无力信息港" }},
        "about": ["Myasthenia Gravis", "EAN 2026", "FcRn", "Complement inhibitors", "Real-world evidence"]
      }}
    </script>
    <script src="../app.js" type="module"></script>
  </body>
</html>
"""


def write_conference_data(article: dict, doc_path: Path) -> None:
    data = {
        "updatedAt": "2026-06-30T00:00:00+08:00",
        "provenance": {
            "sourceType": "Uploaded Word manuscript / EAN 2026 abstract collection",
            "evidenceLevel": "会议摘要整理",
            "reviewStatus": "人工整理",
            "lastChecked": "2026-06-30",
            "reviewNote": "会议摘要尚未完全同行评议，关键结论需等待正式全文、指南或监管文件进一步验证。",
        },
        "categories": ["会议撷英"],
        "items": [
            {
                "id": "ean-2026-mg-panorama",
                "category": "会议撷英",
                "conference": "12th Congress of the European Academy of Neurology (EAN 2026)",
                "location": "Geneva, Switzerland",
                "date": "2026-06-30",
                "title": article["title"].replace("会议撷英--", "会议撷英："),
                "summary": "系统梳理 EAN 2026 中重症肌无力相关摘要，覆盖 FcRn 抑制剂、补体抑制剂、B 细胞靶向治疗、真实世界证据、特殊亚群与数字化管理。",
                "url": "pages/conferences.html",
                "sourceDocument": doc_path.name,
                "tags": ["EAN 2026", "会议资讯", "会议撷英", "myasthenia gravis"],
            }
        ],
    }
    (ROOT / "data" / "conference-highlights.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: import-conference-highlight.py <docx-path>")
    doc_path = Path(sys.argv[1])
    article = parse_docx(doc_path)
    (ROOT / "pages" / "conferences.html").write_text(render_page(article), encoding="utf-8")
    write_conference_data(article, doc_path)
    print(f"Imported conference highlight: {article['title']}")


if __name__ == "__main__":
    main()
