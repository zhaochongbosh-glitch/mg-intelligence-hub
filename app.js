const APP_ROOT = new URL(".", document.currentScript.src);
const DATA_ROOT = new URL("data/", APP_ROOT);

const state = {
  data: {},
  filters: {
    feedQuery: "",
    feedCategory: "all",
    feedSource: "all",
    feedLanguage: "all",
    chinaQuery: "",
    chinaTopic: "all",
    treatmentQuery: "",
    treatmentClass: "all",
    biomarker: "all",
    trialMechanism: "all",
    trialStatus: "all"
  }
};

const categoryLabels = ["文献", "研发动态", "会议摘要", "监管动态", "入口", "中国研究"];

const dataFiles = {
  feed: "items.json",
  latest: "latest-research.json",
  china: "china-research.json",
  treatments: "treatments.json",
  market: "global-market.json",
  guidance: "guidance-pathways.json",
  matrix: "evidence-matrix.json",
  trials: "trial-radar.json"
};

const trustDefaults = {
  feed: {
    sourceType: "聚合来源",
    evidenceLevel: "信息线索",
    reviewStatus: "自动更新",
    reviewNote: "自动聚合条目用于情报线索，临床或监管结论需回到原始链接复核。"
  },
  latest: {
    sourceType: "PubMed",
    evidenceLevel: "文献摘要",
    reviewStatus: "自动更新",
    reviewNote: "每 24 小时抓取 PubMed 新上线记录；中文摘要仅作阅读辅助。"
  },
  china: {
    sourceType: "PubMed Affiliation",
    evidenceLevel: "文献索引",
    reviewStatus: "自动更新",
    reviewNote: "通过机构字段近似识别中国研究者/机构，仍需打开 PubMed 原文确认。"
  },
  treatments: {
    sourceType: "标签/文献/监管文件",
    evidenceLevel: "人工证据汇总",
    reviewStatus: "部分核查",
    reviewNote: "药物机制、适应症、证据和安全性为人工整理，后续应逐条复核说明书、审评文件和文献。"
  },
  matrix: {
    sourceType: "RCT/OLE/RWE 文献",
    evidenceLevel: "人工证据矩阵",
    reviewStatus: "部分核查",
    reviewNote: "用于横向比较证据层级，不替代原始研究和正式指南。"
  },
  trials: {
    sourceType: "ClinicalTrials.gov",
    evidenceLevel: "试验登记",
    reviewStatus: "自动更新",
    reviewNote: "登记信息反映试验状态，不等同于已发表疗效或安全性证据。"
  },
  market: {
    sourceType: "监管/财报/公司公告",
    evidenceLevel: "市场情报",
    reviewStatus: "需定期复核",
    reviewNote: "批准国家和销售额会变动，建议按季度回看监管数据库、年报和公司公告。"
  },
  guidance: {
    sourceType: "指南/共识/监管文件",
    evidenceLevel: "专家路径",
    reviewStatus: "人工整理",
    reviewNote: "路径用于形成临床问题和情报框架，具体决策应结合最新版指南与患者情况。"
  }
};

boot();

async function boot() {
  try {
    state.data = await loadAllData();
    hydrateStats();
    hydrateControls();
    bindControls();
    renderVisibleModules();
  } catch (error) {
    console.error(error);
    for (const target of document.querySelectorAll("[data-render]")) {
      target.innerHTML = `<article class="item"><h3>数据读取失败</h3><p>请稍后刷新页面，或检查 data 文件是否存在。</p></article>`;
    }
  }
}

async function loadAllData() {
  const entries = await Promise.all(
    Object.entries(dataFiles).map(async ([key, file]) => {
      const response = await fetch(new URL(`${file}?ts=${Date.now()}`, DATA_ROOT));
      if (!response.ok) throw new Error(`${file} HTTP ${response.status}`);
      return [key, await response.json()];
    })
  );
  return Object.fromEntries(entries);
}

function hydrateStats() {
  setAll("[data-stat='latest']", latestItems().length);
  setAll("[data-stat='china']", chinaItems().length);
  setAll("[data-stat='treatments']", treatmentItems().length);
  setAll("[data-stat='trials']", trialItems().length);
  setAll("[data-stat='updated']", formatDate(state.data.feed?.updatedAt));
}

function hydrateControls() {
  fillSelect("feed-category", categoryLabels);
  fillSelect("feed-source", [...new Set(feedItems().map((item) => item.source).filter(Boolean))].sort());
  fillSelect("china-topic", [...new Set(chinaItems().map((item) => item.topic).filter(Boolean))].sort());
  fillSelect("treatment-class", [...new Set(treatmentItems().map((item) => item.class).filter(Boolean))].sort());
  fillSelect("biomarker", [...new Set(treatmentItems().map((item) => item.biomarker).filter(Boolean))].sort());
  fillSelect("trial-mechanism", [...new Set(trialItems().map((item) => item.mechanism).filter(Boolean))].sort());
  fillSelect(
    "trial-status",
    [...new Set(trialItems().map((item) => item.status).filter(Boolean))].sort(),
    formatTrialStatus
  );
}

function bindControls() {
  onInput("feed-search", (value) => {
    state.filters.feedQuery = value.toLowerCase();
    renderFeed();
  });
  onChange("feed-category", (value) => {
    state.filters.feedCategory = value;
    renderFeed();
  });
  onChange("feed-source", (value) => {
    state.filters.feedSource = value;
    renderFeed();
  });
  onChange("feed-language", (value) => {
    state.filters.feedLanguage = value;
    renderFeed();
  });
  onInput("china-search", (value) => {
    state.filters.chinaQuery = value.toLowerCase();
    renderChina();
  });
  onChange("china-topic", (value) => {
    state.filters.chinaTopic = value;
    renderChina();
  });
  onInput("treatment-search", (value) => {
    state.filters.treatmentQuery = value.toLowerCase();
    renderTreatments();
  });
  onChange("treatment-class", (value) => {
    state.filters.treatmentClass = value;
    renderTreatments();
  });
  onChange("biomarker", (value) => {
    state.filters.biomarker = value;
    renderTreatments();
  });
  onChange("trial-mechanism", (value) => {
    state.filters.trialMechanism = value;
    renderTrials();
  });
  onChange("trial-status", (value) => {
    state.filters.trialStatus = value;
    renderTrials();
  });
}

function renderVisibleModules() {
  if (exists("latest")) renderLatest();
  if (exists("china")) renderChina();
  if (exists("feed")) renderFeed();
  if (exists("matrix")) renderMatrix();
  if (exists("treatments")) renderTreatments();
  if (exists("supportive")) renderSupportive();
  if (exists("trials")) renderTrials();
  if (exists("market")) renderMarket();
  if (exists("guidance")) renderGuidance();
}

function renderLatest() {
  const items = latestItems().sort(sortByDateDesc);
  setScope("latest", state.data.latest?.scopeNote);
  setCount("latest", `${items.length} 篇新研究`);
  const target = targetFor("latest");
  if (!items.length) {
    target.innerHTML = `<article class="latest-empty"><h3>过去 24 小时暂未抓取到新摘要</h3><p>PubMed 未必每天都有新上线的 MG 摘要；自动任务仍会每 24 小时检查一次。</p></article>`;
    return;
  }
  target.innerHTML = items.map(renderLatestCard).join("");
}

function renderLatestCard(item) {
  const statusLabel = {
    translated: "中文摘要已生成",
    pending: "等待中文摘要",
    "no-abstract": "暂无摘要",
    error: "摘要生成失败"
  }[item.translationStatus] || "待处理";
  const points = (item.keyPoints || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  return `
    <article class="latest-card">
      <div class="latest-card__head">
        <div>
          <p class="section-kicker">PMID ${escapeHtml(item.pmid || "")}</p>
          <h3>${escapeHtml(item.title || "未命名研究")}</h3>
          <p>${escapeHtml([item.journal, item.authors].filter(Boolean).join(" | "))}</p>
        </div>
        <span>${escapeHtml(statusLabel)}</span>
      </div>
      ${renderTrustMeta(item, "latest")}
      <p class="zh-abstract">${escapeHtml(item.zhSummary || "中文摘要待生成。")}</p>
      ${points ? `<ul class="latest-points">${points}</ul>` : ""}
      <details>
        <summary>查看英文摘要</summary>
        <p>${escapeHtml(item.abstract || "PubMed 暂未提供摘要。")}</p>
      </details>
      <div class="latest-actions">
        <span>${formatDate(item.date)}</span>
        <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 原文</a>
      </div>
    </article>
  `;
}

function renderChina() {
  const items = chinaItems().filter(matchesChina).sort(sortByDateDesc);
  setScope("china", state.data.china?.scopeNote);
  targetFor("china").innerHTML = items.length
    ? items.map(renderChinaCard).join("")
    : `<article class="china-card"><h3>没有找到匹配研究</h3><p>可以换一个作者、机构或主题关键词。</p></article>`;
}

function renderChinaCard(item) {
  const tags = (item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="china-card">
      <div class="china-card__date">${formatDate(item.date)}</div>
      <div>
        <div class="china-card__meta">
          <span>${escapeHtml(item.topic || "研究")}</span>
          <span>${escapeHtml(item.journal || "PubMed")}</span>
        </div>
        ${renderTrustMeta(item, "china")}
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary || item.authors || "")}</p>
        <p class="institution">${escapeHtml(item.institutionHint || "机构信息见 PubMed 原文")}</p>
        <div class="china-card__footer">
          <div class="china-tags">${tags}</div>
          <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 原文</a>
        </div>
      </div>
    </article>
  `;
}

function renderFeed() {
  const items = feedItems().filter(matchesFeed).sort(sortByDateDesc);
  setCount("feed", `${items.length} 条匹配信息`);
  targetFor("feed").innerHTML = items.length
    ? items.map(renderFeedItem).join("")
    : `<article class="item"><h3>没有找到匹配条目</h3><p>可以调整关键词、类型或来源筛选。</p></article>`;
}

function renderFeedItem(item) {
  const tags = (item.tags || []).map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="item" data-category="${escapeAttribute(item.category || "")}">
      <div class="item__top">
        <span class="pill">${escapeHtml(item.category || "信息")}</span>
        <span>${escapeHtml(item.source || "未知来源")}</span>
        <span>${formatDate(item.date)}</span>
      </div>
      ${renderTrustMeta(item, "feed")}
      <h3>${escapeHtml(item.title || "未命名条目")}</h3>
      <p>${escapeHtml(item.summary || "")}</p>
      <div class="item__actions">
        <div class="tags">${tags}</div>
        <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看原文</a>
      </div>
    </article>
  `;
}

function renderMatrix() {
  const items = matrixItems();
  setScope("matrix", state.data.matrix?.scopeNote);
  setCount("matrix", `${items.length} 个药物`);
  const rows = items
    .map((item) => `
      <tr>
        <th><strong>${escapeHtml(item.brand)}</strong><span>${escapeHtml(item.mechanism)}</span></th>
        <td>${escapeHtml(item.population)}</td>
        <td>${escapeHtml(item.pivotalTrial)}</td>
        <td>${escapeHtml(item.longTermEvidence)}</td>
        <td>${escapeHtml(item.realWorldEvidence)}</td>
        <td>${escapeHtml(item.safetyFocus)}</td>
        <td>${escapeHtml(item.chinaAccess)}</td>
        <td>
          <span class="evidence-badge">${escapeHtml(item.evidenceLevel)}</span>
          ${renderReviewNote(item, "matrix")}
        </td>
      </tr>
    `)
    .join("");
  targetFor("matrix").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>药物/机制</th><th>适用人群</th><th>关键 RCT</th><th>长期数据</th>
          <th>真实世界</th><th>安全性重点</th><th>中国可及性</th><th>证据层级</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderTreatments() {
  const items = treatmentItems().filter(matchesTreatment);
  setScope("treatments", state.data.treatments?.scopeNote);
  setCount("treatments", `${items.length} / ${treatmentItems().length} 个治疗项`);
  targetFor("treatments").innerHTML = items.map(renderTreatmentCard).join("");
}

function renderTreatmentCard(item) {
  const approval = item.approval || {};
  const signals = (item.safetySignals || []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");
  const links = (item.links || [])
    .map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
  return `
    <article class="treatment-card">
      <div class="treatment-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(item.class || "治疗")}</p>
          <h3>${escapeHtml(item.brand)} <span>${escapeHtml(item.generic)}</span></h3>
          <p>${escapeHtml(item.zhName || "")}</p>
        </div>
        <strong>${escapeHtml(item.evidenceGrade || "证据待补充")}</strong>
      </div>
      ${renderTrustMeta(item, "treatments")}
      <dl class="treatment-grid">
        <div><dt>机制</dt><dd>${escapeHtml(item.mechanism)}</dd></div>
        <div><dt>适用人群</dt><dd>${escapeHtml(item.approvedUse)}</dd></div>
        <div><dt>抗体/标志物</dt><dd>${escapeHtml(item.biomarker)}</dd></div>
        <div><dt>给药</dt><dd>${escapeHtml(item.route)}</dd></div>
        <div><dt>关键证据</dt><dd>${escapeHtml(item.pivotalEvidence)}</dd></div>
        <div><dt>真实世界证据</dt><dd>${escapeHtml(item.realWorldEvidence)}</dd></div>
        <div><dt>上市后安全</dt><dd>${escapeHtml(item.postMarketing)}</dd></div>
        <div><dt>批准状态</dt><dd>FDA: ${escapeHtml(approval.fda || "需补充")}；EMA: ${escapeHtml(approval.ema || "需补充")}；NMPA: ${escapeHtml(approval.nmpa || "需补充")}</dd></div>
      </dl>
      <div class="safety-tags">${signals}</div>
      <div class="treatment-links">${links}</div>
    </article>
  `;
}

function renderSupportive() {
  targetFor("supportive").innerHTML = (state.data.treatments?.offLabelOrSupportive || [])
    .map((item) => `<p><strong>${escapeHtml(item.name)}</strong>：${escapeHtml(item.note)}</p>`)
    .join("");
}

function renderTrials() {
  const items = trialItems().filter(matchesTrial);
  setScope("trials", state.data.trials?.scopeNote);
  setCount("trials", `${items.length} / ${trialItems().length} 项试验`);
  targetFor("trials").innerHTML = items.map(renderTrialCard).join("");
}

function renderTrialCard(item) {
  const interventions = (item.interventions || []).map((name) => `<span>${escapeHtml(name)}</span>`).join("");
  return `
    <article class="trial-card">
      <div class="trial-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(item.mechanism || "机制待分类")}</p>
          <h3>${escapeHtml(item.title || item.nctId)}</h3>
          <p>${escapeHtml([item.sponsor, item.phase].filter(Boolean).join(" | "))}</p>
        </div>
        <strong>${escapeHtml(formatTrialStatus(item.status))}</strong>
      </div>
      <div class="trial-meta">
        <span>NCT: ${escapeHtml(item.nctId)}</span>
        <span>更新: ${escapeHtml(item.lastUpdate || "未知")}</span>
        <span>完成: ${escapeHtml(item.completionDate || "未知")}</span>
      </div>
      ${renderTrustMeta(item, "trials")}
      <div class="trial-tags">${interventions}</div>
      <p>${escapeHtml((item.countries || []).join(", ") || "国家/地区待补充")}</p>
      <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看 ClinicalTrials.gov</a>
    </article>
  `;
}

function renderMarket() {
  const items = marketItems();
  setScope("market", state.data.market?.scopeNote);
  setCount("market", `${items.length} 个产品`);
  targetFor("market").innerHTML = items.map(renderMarketCard).join("");
}

function renderMarketCard(product) {
  const approvals = (product.approvals || [])
    .map((approval) => `
      <li>
        <strong>${escapeHtml(approval.countryOrRegion)}</strong>
        <span>${escapeHtml(approval.agency)} · ${escapeHtml(approval.approvalDate)}</span>
        <em>${escapeHtml(approval.indication)}</em>
      </li>
    `)
    .join("");
  const sources = (product.sourceUrls || [])
    .slice(0, 3)
    .map((url, index) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">来源 ${index + 1}</a>`)
    .join("");
  const sales = product.sales || {};
  return `
    <article class="market-card">
      <div class="market-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(product.class || "治疗药物")}</p>
          <h3>${escapeHtml(product.brand)} <span>${escapeHtml(product.generic || "")}</span></h3>
          <p>${escapeHtml(product.company || "")}</p>
        </div>
        <strong>${escapeHtml(String(product.approvalCount || (product.approvals || []).length))} 个市场</strong>
      </div>
      ${renderTrustMeta(product, "market")}
      <div class="sales-box">
        <span>${escapeHtml(sales.year || "最新")} 销售额</span>
        <strong>${escapeHtml(sales.value || "未披露")}</strong>
        <p>${escapeHtml(sales.scope || "")}</p>
        <small>${escapeHtml(sales.trend || "")}</small>
      </div>
      <ul class="approval-list">${approvals}</ul>
      <div class="market-links">${sources}</div>
    </article>
  `;
}

function renderGuidance() {
  const items = guidanceItems();
  setScope("guidance", state.data.guidance?.scopeNote);
  setCount("guidance", `${items.length} 个路径节点`);
  targetFor("guidance").innerHTML = items
    .map((item) => {
      const links = (item.sources || [])
        .map((source) => `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`)
        .join("");
      return `
        <article class="guidance-card">
          <p class="section-kicker">${escapeHtml(item.step)}</p>
          <h3>${escapeHtml(item.clinicalQuestion)}</h3>
          ${renderTrustMeta(item, "guidance")}
          <dl>
            <div><dt>共识方向</dt><dd>${escapeHtml(item.consensus)}</dd></div>
            <div><dt>中国实践关注</dt><dd>${escapeHtml(item.chinaPractice)}</dd></div>
            <div><dt>情报用途</dt><dd>${escapeHtml(item.intelligenceUse)}</dd></div>
          </dl>
          <div class="guidance-links">${links}</div>
        </article>
      `;
    })
    .join("");
}

function renderTrustMeta(item = {}, moduleName) {
  const meta = resolveTrustMeta(item, moduleName);
  const parts = [
    ["来源", meta.sourceType],
    ["证据", meta.evidenceLevel],
    ["复核", meta.reviewStatus],
    ["核查", meta.lastChecked ? formatDate(meta.lastChecked) : ""]
  ].filter(([, value]) => value);

  if (!parts.length) return "";

  const note = meta.reviewNote ? ` title="${escapeAttribute(meta.reviewNote)}"` : "";
  const pills = parts
    .map(([label, value]) => `<span class="trust-pill ${trustPillClass(label, value)}"${label === "复核" ? note : ""}>${label}: ${escapeHtml(value)}</span>`)
    .join("");
  return `<div class="trust-row" aria-label="数据来源与人工复核">${pills}</div>`;
}

function renderReviewNote(item = {}, moduleName) {
  const meta = resolveTrustMeta(item, moduleName);
  const status = meta.reviewStatus || "待复核";
  const checked = meta.lastChecked ? ` · ${formatDate(meta.lastChecked)}` : "";
  return `<small class="review-note">${escapeHtml(status)}${escapeHtml(checked)}</small>`;
}

function resolveTrustMeta(item = {}, moduleName) {
  const moduleData = state.data[moduleName] || {};
  const fallback = trustDefaults[moduleName] || {};
  const root = moduleData.provenance || moduleData.trust || {};
  const itemTrust = item.trust || item.provenance || {};
  const sourceType = itemTrust.sourceType || item.sourceType || item.source || root.sourceType || fallback.sourceType;
  const evidenceLevel =
    itemTrust.evidenceLevel || item.evidenceLevel || item.evidenceGrade || root.evidenceLevel || fallback.evidenceLevel;
  const reviewStatus = itemTrust.reviewStatus || item.reviewStatus || root.reviewStatus || fallback.reviewStatus;
  const lastChecked =
    itemTrust.lastChecked || item.lastChecked || root.lastChecked || moduleData.updatedAt || item.lastUpdate || item.date || fallback.lastChecked;
  const reviewNote = itemTrust.reviewNote || item.reviewNote || root.reviewNote || fallback.reviewNote;
  return { sourceType, evidenceLevel, reviewStatus, lastChecked, reviewNote };
}

function trustPillClass(label, value = "") {
  const text = `${label} ${value}`;
  if (/待|需|部分/.test(text)) return "trust-pill--warning";
  if (/自动/.test(text)) return "trust-pill--auto";
  if (/已核查|人工/.test(text)) return "trust-pill--review";
  return "";
}

function matchesFeed(item) {
  const text = [item.title, item.summary, item.source, item.category, ...(item.tags || [])].join(" ").toLowerCase();
  return (
    (!state.filters.feedQuery || text.includes(state.filters.feedQuery)) &&
    (state.filters.feedCategory === "all" || item.category === state.filters.feedCategory) &&
    (state.filters.feedSource === "all" || item.source === state.filters.feedSource) &&
    (state.filters.feedLanguage === "all" || item.language === state.filters.feedLanguage)
  );
}

function matchesChina(item) {
  const text = [item.title, item.journal, item.authors, item.institutionHint, item.topic, item.summary, ...(item.tags || [])]
    .join(" ")
    .toLowerCase();
  return (
    (!state.filters.chinaQuery || text.includes(state.filters.chinaQuery)) &&
    (state.filters.chinaTopic === "all" || item.topic === state.filters.chinaTopic)
  );
}

function matchesTreatment(item) {
  const text = [
    item.brand,
    item.generic,
    item.zhName,
    item.class,
    item.target,
    item.mechanism,
    item.approvedUse,
    item.biomarker,
    item.pivotalEvidence,
    item.realWorldEvidence,
    item.postMarketing,
    ...(item.safetySignals || [])
  ]
    .join(" ")
    .toLowerCase();
  return (
    (!state.filters.treatmentQuery || text.includes(state.filters.treatmentQuery)) &&
    (state.filters.treatmentClass === "all" || item.class === state.filters.treatmentClass) &&
    (state.filters.biomarker === "all" || item.biomarker === state.filters.biomarker)
  );
}

function matchesTrial(item) {
  return (
    (state.filters.trialMechanism === "all" || item.mechanism === state.filters.trialMechanism) &&
    (state.filters.trialStatus === "all" || item.status === state.filters.trialStatus)
  );
}

function feedItems() {
  return state.data.feed?.items || [];
}

function latestItems() {
  return state.data.latest?.items || [];
}

function chinaItems() {
  return state.data.china?.items || [];
}

function treatmentItems() {
  return state.data.treatments?.treatments || [];
}

function marketItems() {
  return state.data.market?.products || [];
}

function guidanceItems() {
  return state.data.guidance?.pathways || [];
}

function matrixItems() {
  return state.data.matrix?.items || [];
}

function trialItems() {
  return state.data.trials?.items || [];
}

function fillSelect(name, values, labeler = (value) => value) {
  const select = document.querySelector(`[data-control="${name}"]`);
  if (!select) return;
  for (const value of values) {
    select.append(new Option(labeler(value), value));
  }
}

function onInput(name, handler) {
  const input = document.querySelector(`[data-control="${name}"]`);
  if (input) input.addEventListener("input", (event) => handler(event.target.value.trim()));
}

function onChange(name, handler) {
  const select = document.querySelector(`[data-control="${name}"]`);
  if (select) select.addEventListener("change", (event) => handler(event.target.value));
}

function exists(name) {
  return Boolean(targetFor(name, false));
}

function targetFor(name, required = true) {
  const target = document.querySelector(`[data-render="${name}"]`);
  if (!target && required) throw new Error(`Missing render target ${name}`);
  return target;
}

function setCount(name, value) {
  setAll(`[data-count="${name}"]`, value);
}

function setScope(name, value) {
  setAll(`[data-scope="${name}"]`, value || "");
}

function setAll(selector, value) {
  for (const element of document.querySelectorAll(selector)) {
    element.textContent = value ?? "";
  }
}

function sortByDateDesc(a, b) {
  return new Date(b.date || b.lastUpdate || 0).getTime() - new Date(a.date || a.lastUpdate || 0).getTime();
}

function formatDate(value) {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatTrialStatus(status = "") {
  const map = {
    RECRUITING: "招募中",
    NOT_YET_RECRUITING: "尚未招募",
    ACTIVE_NOT_RECRUITING: "进行中不招募",
    COMPLETED: "已完成",
    TERMINATED: "已终止",
    WITHDRAWN: "已撤回",
    SUSPENDED: "暂停"
  };
  return map[status] || status || "未知";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value || "#");
}
