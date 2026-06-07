const categoryLabels = ["文献", "研发动态", "会议摘要", "监管动态", "入口"];

const state = {
  items: [],
  treatments: [],
  supportiveTreatments: [],
  chinaResearch: [],
  marketProducts: [],
  latestResearch: [],
  guidancePathways: [],
  evidenceMatrix: [],
  trialRadar: [],
  query: "",
  category: "all",
  source: "all",
  language: "all",
  treatmentQuery: "",
  treatmentClass: "all",
  biomarker: "all",
  chinaQuery: "",
  chinaTopic: "all",
  trialMechanism: "all",
  trialStatus: "all"
};

const els = {
  feed: document.querySelector("#feed"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categoryFilter"),
  source: document.querySelector("#sourceFilter"),
  language: document.querySelector("#languageFilter"),
  totalCount: document.querySelector("#totalCount"),
  sourceCount: document.querySelector("#sourceCount"),
  updatedAt: document.querySelector("#updatedAt"),
  resultCount: document.querySelector("#resultCount"),
  chinaCount: document.querySelector("#chinaCount"),
  treatmentTotal: document.querySelector("#treatmentTotal"),
  overviewChina: document.querySelector("#overviewChina"),
  overviewTreatment: document.querySelector("#overviewTreatment"),
  overviewLatest: document.querySelector("#overviewLatest"),
  overviewTrials: document.querySelector("#overviewTrials")
};

const treatmentEls = {
  container: document.querySelector("#treatments"),
  scope: document.querySelector("#treatmentScope"),
  count: document.querySelector("#treatmentCount"),
  classFilter: document.querySelector("#treatmentClassFilter"),
  biomarkerFilter: document.querySelector("#biomarkerFilter"),
  search: document.querySelector("#treatmentSearchInput"),
  supportive: document.querySelector("#supportiveTreatments")
};

const chinaEls = {
  container: document.querySelector("#chinaResearchList"),
  scope: document.querySelector("#chinaScope"),
  search: document.querySelector("#chinaSearchInput"),
  topic: document.querySelector("#chinaTopicFilter")
};

const marketEls = {
  container: document.querySelector("#marketCards"),
  scope: document.querySelector("#marketScope"),
  count: document.querySelector("#marketCount")
};

const latestEls = {
  container: document.querySelector("#latestResearchList"),
  scope: document.querySelector("#latestScope"),
  count: document.querySelector("#latestCount")
};

const guidanceEls = {
  container: document.querySelector("#guidanceCards"),
  scope: document.querySelector("#guidanceScope"),
  count: document.querySelector("#guidanceCount")
};

const matrixEls = {
  container: document.querySelector("#matrixTable"),
  scope: document.querySelector("#matrixScope"),
  count: document.querySelector("#matrixCount")
};

const trialEls = {
  container: document.querySelector("#trialCards"),
  scope: document.querySelector("#trialScope"),
  count: document.querySelector("#trialCount"),
  mechanism: document.querySelector("#trialMechanismFilter"),
  status: document.querySelector("#trialStatusFilter")
};

async function boot() {
  try {
    const [
      feedResponse,
      treatmentResponse,
      chinaResponse,
      marketResponse,
      latestResponse,
      guidanceResponse,
      matrixResponse,
      trialResponse
    ] = await Promise.all([
      fetch(`data/items.json?ts=${Date.now()}`),
      fetch(`data/treatments.json?ts=${Date.now()}`),
      fetch(`data/china-research.json?ts=${Date.now()}`),
      fetch(`data/global-market.json?ts=${Date.now()}`),
      fetch(`data/latest-research.json?ts=${Date.now()}`),
      fetch(`data/guidance-pathways.json?ts=${Date.now()}`),
      fetch(`data/evidence-matrix.json?ts=${Date.now()}`),
      fetch(`data/trial-radar.json?ts=${Date.now()}`)
    ]);
    if (!feedResponse.ok) throw new Error(`Feed HTTP ${feedResponse.status}`);
    if (!treatmentResponse.ok) throw new Error(`Treatments HTTP ${treatmentResponse.status}`);
    if (!chinaResponse.ok) throw new Error(`China research HTTP ${chinaResponse.status}`);
    if (!marketResponse.ok) throw new Error(`Global market HTTP ${marketResponse.status}`);
    if (!latestResponse.ok) throw new Error(`Latest research HTTP ${latestResponse.status}`);
    if (!guidanceResponse.ok) throw new Error(`Guidance HTTP ${guidanceResponse.status}`);
    if (!matrixResponse.ok) throw new Error(`Matrix HTTP ${matrixResponse.status}`);
    if (!trialResponse.ok) throw new Error(`Trial radar HTTP ${trialResponse.status}`);

    const data = await feedResponse.json();
    const treatmentData = await treatmentResponse.json();
    const chinaData = await chinaResponse.json();
    const marketData = await marketResponse.json();
    const latestData = await latestResponse.json();
    const guidanceData = await guidanceResponse.json();
    const matrixData = await matrixResponse.json();
    const trialData = await trialResponse.json();

    state.items = Array.isArray(data.items) ? data.items : [];
    state.treatments = Array.isArray(treatmentData.treatments) ? treatmentData.treatments : [];
    state.supportiveTreatments = Array.isArray(treatmentData.offLabelOrSupportive) ? treatmentData.offLabelOrSupportive : [];
    state.chinaResearch = Array.isArray(chinaData.items) ? chinaData.items : [];
    state.marketProducts = Array.isArray(marketData.products) ? marketData.products : [];
    state.latestResearch = Array.isArray(latestData.items) ? latestData.items : [];
    state.guidancePathways = Array.isArray(guidanceData.pathways) ? guidanceData.pathways : [];
    state.evidenceMatrix = Array.isArray(matrixData.items) ? matrixData.items : [];
    state.trialRadar = Array.isArray(trialData.items) ? trialData.items : [];

    hydrateMeta(data, chinaData);
    hydrateFilters();
    hydrateTreatmentMeta(treatmentData);
    hydrateTreatmentFilters();
    hydrateChinaMeta(chinaData);
    hydrateChinaFilters();
    hydrateMarketMeta(marketData);
    hydrateLatestMeta(latestData);
    hydrateGuidanceMeta(guidanceData);
    hydrateMatrixMeta(matrixData);
    hydrateTrialMeta(trialData);
    hydrateTrialFilters();
    bindEvents();
    render();
    renderLatestResearch();
    renderGuidance();
    renderMatrix();
    renderTrials();
    renderMarket();
    renderTreatments();
    renderChinaResearch();
  } catch (error) {
    els.resultCount.textContent = "数据读取失败";
    els.feed.innerHTML = `<article class="item"><h3>无法读取数据文件</h3><p>请确认本地服务器正在运行，或稍后重试。</p></article>`;
    console.error(error);
  }
}

function hydrateMeta(data) {
  const sources = new Set(state.items.map((item) => item.source).filter(Boolean));
  els.totalCount.textContent = state.items.length;
  els.sourceCount.textContent = sources.size;
  els.updatedAt.textContent = formatDate(data.updatedAt);
  els.chinaCount.textContent = state.chinaResearch.length;
  els.treatmentTotal.textContent = state.treatments.length;
  els.overviewChina.textContent = state.chinaResearch.length;
  els.overviewTreatment.textContent = state.treatments.length;
  els.overviewLatest.textContent = state.latestResearch.length;
  els.overviewTrials.textContent = state.trialRadar.length;
}

function hydrateFilters() {
  for (const label of categoryLabels) {
    els.category.append(new Option(label, label));
  }

  const sources = [...new Set(state.items.map((item) => item.source).filter(Boolean))].sort();
  for (const source of sources) {
    els.source.append(new Option(source, source));
  }
}

function hydrateTreatmentMeta(data) {
  treatmentEls.scope.textContent = data.scopeNote || "按官方标签和关键证据整理";
  treatmentEls.count.textContent = `${state.treatments.length} 个治疗项`;
}

function hydrateTreatmentFilters() {
  const classes = [...new Set(state.treatments.map((item) => item.class).filter(Boolean))].sort();
  for (const value of classes) {
    treatmentEls.classFilter.append(new Option(value, value));
  }

  const biomarkers = [...new Set(state.treatments.map((item) => item.biomarker).filter(Boolean))].sort();
  for (const value of biomarkers) {
    treatmentEls.biomarkerFilter.append(new Option(value, value));
  }
}

function hydrateChinaMeta(data) {
  chinaEls.scope.textContent = data.scopeNote || "基于 PubMed 机构字段自动识别中国相关研究";
}

function hydrateChinaFilters() {
  const topics = [...new Set(state.chinaResearch.map((item) => item.topic).filter(Boolean))].sort();
  for (const topic of topics) {
    chinaEls.topic.append(new Option(topic, topic));
  }
}

function hydrateMarketMeta(data) {
  marketEls.scope.textContent = data.scopeNote || "按主要监管地区和公开财报整理";
  marketEls.count.textContent = `${state.marketProducts.length} 个产品`;
}

function hydrateLatestMeta(data) {
  latestEls.scope.textContent = data.scopeNote || "展示 PubMed 过去 24 小时内新上线或更新的 MG 研究。";
  latestEls.count.textContent = `${state.latestResearch.length} 篇新研究`;
}

function hydrateGuidanceMeta(data) {
  guidanceEls.scope.textContent = data.scopeNote || "按指南和正式来源整理 MG 诊疗路径。";
  guidanceEls.count.textContent = `${state.guidancePathways.length} 个路径节点`;
}

function hydrateMatrixMeta(data) {
  matrixEls.scope.textContent = data.scopeNote || "横向比较核心 MG 治疗药物证据。";
  matrixEls.count.textContent = `${state.evidenceMatrix.length} 个药物`;
}

function hydrateTrialMeta(data) {
  trialEls.scope.textContent = data.scopeNote || "自动检索 ClinicalTrials.gov 中 MG 相关研究。";
  trialEls.count.textContent = `${state.trialRadar.length} 项试验`;
}

function hydrateTrialFilters() {
  const mechanisms = [...new Set(state.trialRadar.map((item) => item.mechanism).filter(Boolean))].sort();
  for (const mechanism of mechanisms) {
    trialEls.mechanism.append(new Option(mechanism, mechanism));
  }

  const statuses = [...new Set(state.trialRadar.map((item) => item.status).filter(Boolean))].sort();
  for (const status of statuses) {
    trialEls.status.append(new Option(formatTrialStatus(status), status));
  }
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  els.category.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });

  els.source.addEventListener("change", (event) => {
    state.source = event.target.value;
    render();
  });

  els.language.addEventListener("change", (event) => {
    state.language = event.target.value;
    render();
  });

  treatmentEls.search.addEventListener("input", (event) => {
    state.treatmentQuery = event.target.value.trim().toLowerCase();
    renderTreatments();
  });

  treatmentEls.classFilter.addEventListener("change", (event) => {
    state.treatmentClass = event.target.value;
    renderTreatments();
  });

  treatmentEls.biomarkerFilter.addEventListener("change", (event) => {
    state.biomarker = event.target.value;
    renderTreatments();
  });

  chinaEls.search.addEventListener("input", (event) => {
    state.chinaQuery = event.target.value.trim().toLowerCase();
    renderChinaResearch();
  });

  chinaEls.topic.addEventListener("change", (event) => {
    state.chinaTopic = event.target.value;
    renderChinaResearch();
  });

  trialEls.mechanism.addEventListener("change", (event) => {
    state.trialMechanism = event.target.value;
    renderTrials();
  });

  trialEls.status.addEventListener("change", (event) => {
    state.trialStatus = event.target.value;
    renderTrials();
  });
}

function render() {
  const items = state.items.filter(matchesFilters).sort(sortByDateDesc);
  els.feed.innerHTML = "";
  els.empty.hidden = items.length > 0;
  els.resultCount.textContent = `${items.length} 条匹配信息`;

  for (const item of items) {
    els.feed.append(renderItem(item));
  }
}

function matchesFilters(item) {
  const text = [item.title, item.summary, item.source, item.category, ...(item.tags || [])]
    .join(" ")
    .toLowerCase();
  const matchesQuery = !state.query || text.includes(state.query);
  const matchesCategory = state.category === "all" || item.category === state.category;
  const matchesSource = state.source === "all" || item.source === state.source;
  const matchesLanguage = state.language === "all" || item.language === state.language;
  return matchesQuery && matchesCategory && matchesSource && matchesLanguage;
}

function renderItem(item) {
  const article = document.createElement("article");
  article.className = "item";
  article.dataset.category = item.category || "";

  const tags = (item.tags || [])
    .map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`)
    .join("");

  article.innerHTML = `
    <div class="item__top">
      <span class="pill">${escapeHtml(item.category || "信息")}</span>
      <span>${escapeHtml(item.source || "未知来源")}</span>
      <span>${formatDate(item.date)}</span>
    </div>
    <h3>${escapeHtml(item.title || "未命名条目")}</h3>
    <p>${escapeHtml(item.summary || "")}</p>
    <div class="item__actions">
      <div class="tags">${tags}</div>
      <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看原文</a>
    </div>
  `;

  return article;
}

function renderChinaResearch() {
  const items = state.chinaResearch.filter(matchesChinaFilters).sort(sortByDateDesc);
  chinaEls.container.innerHTML = "";

  for (const item of items) {
    chinaEls.container.append(renderChinaItem(item));
  }

  if (!items.length) {
    chinaEls.container.innerHTML = `<article class="china-card"><h3>没有找到匹配研究</h3><p>可以换一个作者、机构或主题关键词。</p></article>`;
  }
}

function renderMarket() {
  marketEls.container.innerHTML = "";
  for (const product of state.marketProducts) {
    marketEls.container.append(renderMarketCard(product));
  }
}

function renderLatestResearch() {
  latestEls.container.innerHTML = "";
  const items = state.latestResearch.sort(sortByDateDesc);
  if (!items.length) {
    latestEls.container.innerHTML = `
      <article class="latest-empty">
        <h3>过去 24 小时暂未抓取到新摘要</h3>
        <p>PubMed 未必每天都有新上线的 MG 摘要；自动任务仍会每 24 小时检查一次。</p>
      </article>
    `;
    return;
  }

  for (const item of items) {
    latestEls.container.append(renderLatestItem(item));
  }
}

function renderLatestItem(item) {
  const article = document.createElement("article");
  article.className = "latest-card";
  const keyPoints = (item.keyPoints || [])
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join("");
  const statusLabel = {
    translated: "中文摘要已生成",
    pending: "等待中文摘要",
    "no-abstract": "暂无摘要",
    error: "摘要生成失败"
  }[item.translationStatus] || "待处理";

  article.innerHTML = `
    <div class="latest-card__head">
      <div>
        <p class="section-kicker">PMID ${escapeHtml(item.pmid || "")}</p>
        <h3>${escapeHtml(item.title || "未命名研究")}</h3>
        <p>${escapeHtml([item.journal, item.authors].filter(Boolean).join(" | "))}</p>
      </div>
      <span>${escapeHtml(statusLabel)}</span>
    </div>
    <p class="zh-abstract">${escapeHtml(item.zhSummary || "中文摘要待生成。")}</p>
    ${keyPoints ? `<ul class="latest-points">${keyPoints}</ul>` : ""}
    <details>
      <summary>查看英文摘要</summary>
      <p>${escapeHtml(item.abstract || "PubMed 暂未提供摘要。")}</p>
    </details>
    <div class="latest-actions">
      <span>${formatDate(item.date)}</span>
      <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 原文</a>
    </div>
  `;
  return article;
}

function renderGuidance() {
  guidanceEls.container.innerHTML = "";
  for (const item of state.guidancePathways) {
    const article = document.createElement("article");
    article.className = "guidance-card";
    const links = (item.sources || [])
      .map((source) => `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`)
      .join("");
    article.innerHTML = `
      <p class="section-kicker">${escapeHtml(item.step)}</p>
      <h3>${escapeHtml(item.clinicalQuestion)}</h3>
      <dl>
        <div><dt>共识方向</dt><dd>${escapeHtml(item.consensus)}</dd></div>
        <div><dt>中国实践关注</dt><dd>${escapeHtml(item.chinaPractice)}</dd></div>
        <div><dt>情报用途</dt><dd>${escapeHtml(item.intelligenceUse)}</dd></div>
      </dl>
      <div class="guidance-links">${links}</div>
    `;
    guidanceEls.container.append(article);
  }
}

function renderMatrix() {
  const rows = state.evidenceMatrix
    .map((item) => `
      <tr>
        <th>
          <strong>${escapeHtml(item.brand)}</strong>
          <span>${escapeHtml(item.mechanism)}</span>
        </th>
        <td>${escapeHtml(item.population)}</td>
        <td>${escapeHtml(item.pivotalTrial)}</td>
        <td>${escapeHtml(item.longTermEvidence)}</td>
        <td>${escapeHtml(item.realWorldEvidence)}</td>
        <td>${escapeHtml(item.safetyFocus)}</td>
        <td>${escapeHtml(item.chinaAccess)}</td>
        <td><span class="evidence-badge">${escapeHtml(item.evidenceLevel)}</span></td>
      </tr>
    `)
    .join("");

  matrixEls.container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>药物/机制</th>
          <th>适用人群</th>
          <th>关键 RCT</th>
          <th>长期数据</th>
          <th>真实世界</th>
          <th>安全性重点</th>
          <th>中国可及性</th>
          <th>证据层级</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderTrials() {
  const items = state.trialRadar.filter((item) => {
    const mechanismOk = state.trialMechanism === "all" || item.mechanism === state.trialMechanism;
    const statusOk = state.trialStatus === "all" || item.status === state.trialStatus;
    return mechanismOk && statusOk;
  });
  trialEls.container.innerHTML = "";
  trialEls.count.textContent = `${items.length} / ${state.trialRadar.length} 项试验`;
  for (const item of items) {
    trialEls.container.append(renderTrialCard(item));
  }
}

function renderTrialCard(item) {
  const article = document.createElement("article");
  article.className = "trial-card";
  const interventions = (item.interventions || []).map((name) => `<span>${escapeHtml(name)}</span>`).join("");
  article.innerHTML = `
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
    <div class="trial-tags">${interventions}</div>
    <p>${escapeHtml((item.countries || []).join(", ") || "国家/地区待补充")}</p>
    <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看 ClinicalTrials.gov</a>
  `;
  return article;
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

function renderMarketCard(product) {
  const article = document.createElement("article");
  article.className = "market-card";
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

  article.innerHTML = `
    <div class="market-card__head">
      <div>
        <p class="eyebrow-dark">${escapeHtml(product.class || "治疗药物")}</p>
        <h3>${escapeHtml(product.brand)} <span>${escapeHtml(product.generic || "")}</span></h3>
        <p>${escapeHtml(product.company || "")}</p>
      </div>
      <strong>${escapeHtml(String(product.approvalCount || (product.approvals || []).length))} 个市场</strong>
    </div>
    <div class="sales-box">
      <span>${escapeHtml(sales.year || "最新")} 销售额</span>
      <strong>${escapeHtml(sales.value || "未披露")}</strong>
      <p>${escapeHtml(sales.scope || "")}</p>
      <small>${escapeHtml(sales.trend || "")}</small>
    </div>
    <ul class="approval-list">${approvals}</ul>
    <div class="market-links">${sources}</div>
  `;

  return article;
}

function matchesChinaFilters(item) {
  const text = [
    item.title,
    item.journal,
    item.authors,
    item.institutionHint,
    item.topic,
    item.summary,
    ...(item.tags || [])
  ]
    .join(" ")
    .toLowerCase();
  const matchesQuery = !state.chinaQuery || text.includes(state.chinaQuery);
  const matchesTopic = state.chinaTopic === "all" || item.topic === state.chinaTopic;
  return matchesQuery && matchesTopic;
}

function renderChinaItem(item) {
  const article = document.createElement("article");
  article.className = "china-card";
  const tags = (item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  article.innerHTML = `
    <div class="china-card__date">${formatDate(item.date)}</div>
    <div>
      <div class="china-card__meta">
        <span>${escapeHtml(item.topic || "研究")}</span>
        <span>${escapeHtml(item.journal || "PubMed")}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary || item.authors || "")}</p>
      <p class="institution">${escapeHtml(item.institutionHint || "机构信息见 PubMed 原文")}</p>
      <div class="china-card__footer">
        <div class="china-tags">${tags}</div>
        <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 原文</a>
      </div>
    </div>
  `;

  return article;
}

function renderTreatments() {
  const treatments = state.treatments.filter(matchesTreatmentFilters);
  treatmentEls.container.innerHTML = "";
  treatmentEls.count.textContent = `${treatments.length} / ${state.treatments.length} 个治疗项`;

  for (const treatment of treatments) {
    treatmentEls.container.append(renderTreatment(treatment));
  }

  treatmentEls.supportive.innerHTML = state.supportiveTreatments
    .map((item) => `<p><strong>${escapeHtml(item.name)}</strong>：${escapeHtml(item.note)}</p>`)
    .join("");
}

function matchesTreatmentFilters(item) {
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

  const matchesQuery = !state.treatmentQuery || text.includes(state.treatmentQuery);
  const matchesClass = state.treatmentClass === "all" || item.class === state.treatmentClass;
  const matchesBiomarker = state.biomarker === "all" || item.biomarker === state.biomarker;
  return matchesQuery && matchesClass && matchesBiomarker;
}

function renderTreatment(item) {
  const article = document.createElement("article");
  article.className = "treatment-card";

  const approval = item.approval || {};
  const signals = (item.safetySignals || []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");
  const links = (item.links || [])
    .map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");

  article.innerHTML = `
    <div class="treatment-card__head">
      <div>
        <p class="eyebrow-dark">${escapeHtml(item.class || "治疗")}</p>
        <h3>${escapeHtml(item.brand)} <span>${escapeHtml(item.generic)}</span></h3>
        <p>${escapeHtml(item.zhName || "")}</p>
      </div>
      <strong>${escapeHtml(item.evidenceGrade || "证据待补充")}</strong>
    </div>
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
  `;

  return article;
}

function sortByDateDesc(a, b) {
  return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value || "#");
}

boot();
