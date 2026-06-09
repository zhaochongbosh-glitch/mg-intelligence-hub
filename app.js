const APP_ROOT = new URL(".", import.meta.url);
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
    trialStatus: "all",
    trialSource: "all"
  }
};

const categoryLabels = ["文献", "研发动态", "会议摘要", "监管动态", "入口", "中国研究"];

const dataFiles = {
  feed: "items.json",
  latest: "latest-research.json",
  china: "china-research.json",
  huashanTeam: "huashan-team.json",
  treatments: "treatments.json",
  market: "global-market.json",
  guidance: "guidance-pathways.json",
  matrix: "evidence-matrix.json",
  trials: "trial-radar.json",
  updateStatus: "update-status.json"
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
    reviewNote: "每日抓取 PubMed 近 7 天新上线或更新记录；中文摘要仅作阅读辅助。"
  },
  china: {
    sourceType: "PubMed Affiliation",
    evidenceLevel: "文献索引",
    reviewStatus: "自动更新",
    reviewNote: "通过机构字段近似识别中国研究者/机构，仍需打开 PubMed 摘要确认。"
  },
  huashanTeam: {
    sourceType: "PubMed Affiliation / Web of Science manual review",
    evidenceLevel: "团队论文索引",
    reviewStatus: "PubMed 自动更新，WoS 待人工复核",
    reviewNote: "作者署名单位由 PubMed Affiliation 字段近似识别；Web of Science 需机构订阅或导出文件后人工复核。"
  },
  treatments: {
    sourceType: "标签/文献/监管文件",
    evidenceLevel: "人工证据汇总",
    reviewStatus: "部分核查",
    reviewNote: "药物机制、适应症、证据和安全性为人工整理，后续应逐条复核说明书、审评文件和文献。"
  },
  safety: {
    sourceType: "标签/openFDA/上市后报告",
    evidenceLevel: "安全性信号",
    reviewStatus: "部分核查",
    reviewNote: "自发报告用于发现信号，不能直接证明发生率或因果关系；请回到标签、监管文件和原始报告复核。"
  },
  "china-access": {
    sourceType: "NMPA/财报/公司公告",
    evidenceLevel: "中国准入与商业化",
    reviewStatus: "需定期复核",
    reviewNote: "中国批准、医保、医院准入和销售口径会持续变化；请按 NMPA、医保局、企业公告和财报逐条复核。"
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
    hydrateShareTools();
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
  fillSelect("trial-source", [...new Set(trialItems().map(trialRegistry).filter(Boolean))].sort());
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
  onChange("trial-source", (value) => {
    state.filters.trialSource = value;
    renderTrials();
  });
}

function renderVisibleModules() {
  if (exists("latest")) renderLatest();
  if (exists("china")) renderChina();
  if (exists("huashan-team")) renderHuashanTeam();
  if (exists("feed")) renderFeed();
  if (exists("matrix")) renderMatrix();
  if (exists("treatments")) renderTreatments();
  if (exists("supportive")) renderSupportive();
  if (exists("safety")) renderSafety();
  if (exists("china-access")) renderChinaAccess();
  if (exists("china-registered-trials")) renderChinaRegisteredTrials();
  if (exists("trials")) renderTrials();
  if (exists("market")) renderMarket();
  if (exists("guidance")) renderGuidance();
  if (exists("update-status")) renderUpdateStatus();
  if (exists("review-queue")) renderReviewQueue();
  if (exists("faers")) renderFaersExplorer();
}

function hydrateShareTools() {
  const footer = document.querySelector("footer");
  if (!footer || footer.querySelector(".site-share")) return;

  const title = document.title || "重症肌无力信息港";
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=188x188&data=${encodedUrl}`;

  const share = document.createElement("section");
  share.className = "site-share";
  share.setAttribute("aria-label", "页面分享");
  share.innerHTML = `
    <span class="site-share__label">分享本页</span>
    <div class="site-share__actions">
      <button class="share-button" type="button" data-share="native">系统分享</button>
      <button class="share-button" type="button" data-share="wechat">微信</button>
      <a class="share-button" href="https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}" target="_blank" rel="noreferrer">微博</a>
      <a class="share-button" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noreferrer">LinkedIn</a>
      <button class="share-button" type="button" data-share="copy">复制链接</button>
    </div>
    <span class="share-copy-status" aria-live="polite"></span>
  `;

  const modal = document.createElement("div");
  modal.className = "share-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="share-modal__panel" role="dialog" aria-modal="true" aria-label="微信分享二维码">
      <div class="share-modal__head">
        <strong>微信分享</strong>
        <button class="share-button share-button--compact" type="button" data-share="close">关闭</button>
      </div>
      <img class="share-modal__qr" src="${escapeAttribute(qrUrl)}" alt="当前页面二维码">
      <p>${escapeHtml(title)}</p>
      <button class="share-button" type="button" data-share="copy">复制链接</button>
    </div>
  `;

  footer.append(share);
  document.body.append(modal);

  const status = share.querySelector(".share-copy-status");
  const setStatus = (message) => {
    status.textContent = message;
    window.setTimeout(() => {
      status.textContent = "";
    }, 2200);
  };
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("已复制");
    } catch {
      window.prompt("复制本页链接", url);
    }
  };
  const openModal = () => {
    modal.hidden = false;
    modal.querySelector("[data-share='close']")?.focus();
  };
  const closeModal = () => {
    modal.hidden = true;
  };

  share.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-share]");
    if (!target) return;
    const action = target.dataset.share;
    if (action === "native") {
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch {
          // User canceled native share.
        }
      } else {
        await copyUrl();
      }
    }
    if (action === "wechat") openModal();
    if (action === "copy") await copyUrl();
  });

  modal.addEventListener("click", async (event) => {
    if (event.target === modal || event.target.closest("[data-share='close']")) {
      closeModal();
      return;
    }
    if (event.target.closest("[data-share='copy']")) await copyUrl();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
}

function renderLatest() {
  const items = latestItems().sort(sortByDateDesc);
  setScope("latest", state.data.latest?.scopeNote);
  setCount("latest", `${items.length} 篇新研究`);
  const target = targetFor("latest");
  if (!items.length) {
    target.innerHTML = `<article class="latest-empty"><h3>近 7 天暂未抓取到新摘要</h3><p>PubMed 未必每周都有新上线的 MG 摘要；自动任务仍会每日检查一次。</p></article>`;
    return;
  }
  target.innerHTML = items.map(renderLatestCard).join("");
}

function renderLatestCard(item) {
  const indexedDate = item.indexedAt || item.date;
  const statusLabel = {
    translated: "中文摘要已生成",
    pending: "等待中文摘要",
    "no-abstract": "暂无摘要",
    error: "摘要生成失败"
  }[item.translationStatus] || "待处理";
  const points = (item.keyPoints || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const intelligence = renderLatestIntelligence(item);
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
      ${intelligence}
      ${points ? `<ul class="latest-points">${points}</ul>` : ""}
      <details>
        <summary>查看英文摘要</summary>
        <p>${escapeHtml(item.abstract || "PubMed 暂未提供摘要。")}</p>
      </details>
      <div class="latest-actions">
        <div class="latest-actions__dates">
          <span>PubMed 上线/更新：${formatDate(indexedDate)}</span>
          <span>发表：${formatDate(item.date)}</span>
        </div>
        <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 摘要</a>
      </div>
    </article>
  `;
}

function renderLatestIntelligence(item = {}) {
  const intelligence = item.intelligence || {};
  const rows = [
    ["研究类型", intelligence.studyType],
    ["研究对象", intelligence.population],
    ["关键发现", intelligence.keyFinding],
    ["情报意义", intelligence.clinicalImplication],
    ["复核重点", intelligence.reviewFocus]
  ].filter(([, value]) => value);

  if (!rows.length) return "";

  return `
    <dl class="latest-intel-grid">
      ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
    </dl>
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
  const indexedDate = item.indexedAt || item.date;
  const tags = (item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="china-card">
      <div class="china-card__date">
        <span>PubMed 更新</span>
        <strong>${formatDate(indexedDate)}</strong>
        <small>发表 ${formatDate(item.date)}</small>
      </div>
      <div>
        <div class="china-card__meta">
          <span>${escapeHtml(item.topic || "研究")}</span>
          <span>${escapeHtml(item.journal || "PubMed")}</span>
        </div>
        ${renderTrustMeta(item, "china")}
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary || item.authors || "")}</p>
        <p class="institution">${escapeHtml(item.institutionHint || "机构信息见 PubMed 摘要")}</p>
        <div class="china-card__footer">
          <div class="china-tags">${tags}</div>
          <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 摘要</a>
        </div>
      </div>
    </article>
  `;
}

function renderHuashanTeam() {
  const items = huashanTeamItems().sort(sortByDateDesc);
  const data = state.data.huashanTeam || {};
  setScope("huashan-team", data.scopeNote);
  setCount("huashan-team", `${items.length} 篇团队论文`);
  const summary = targetFor("huashan-summary", false);
  if (summary) summary.innerHTML = renderHuashanSummary(items, data);
  targetFor("huashan-team").innerHTML = items.length
    ? items.map(renderHuashanArticle).join("")
    : `<article class="huashan-paper"><h3>暂未抓取到团队论文</h3><p>请检查 PubMed 检索式或稍后重新运行数据更新。</p></article>`;
}

function renderHuashanSummary(items, data = {}) {
  const years = items.map((item) => String(item.date || "").slice(0, 4)).filter(Boolean);
  const latest = items[0];
  return `
    <div class="huashan-overview">
      <article>
        <span>PubMed records</span>
        <strong>${items.length}</strong>
        <p>按发表日期倒序</p>
      </article>
      <article>
        <span>Latest year</span>
        <strong>${escapeHtml(years[0] || "待更新")}</strong>
        <p>${escapeHtml(latest?.journal || "最新论文期刊待读取")}</p>
      </article>
      <article>
        <span>Source status</span>
        <strong>PubMed</strong>
        <p>${escapeHtml(data.webOfScience?.note || "Web of Science 需人工复核或 API 接入。")}</p>
      </article>
    </div>
  `;
}

function renderHuashanArticle(item) {
  const indexedDate = item.indexedAt || item.date;
  const tags = (item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const authors = item.authors ? item.authors.split(", ").slice(0, 8).join(", ") : "作者信息见 PubMed";
  return `
    <article class="huashan-paper">
      <div class="huashan-paper__date">
        <span>PubMed 更新</span>
        <strong>${formatDate(indexedDate)}</strong>
        <small>发表 ${formatDate(item.date)}</small>
      </div>
      <div class="huashan-paper__body">
        <div class="huashan-paper__meta">
          <span>${escapeHtml(item.journal || "PubMed")}</span>
          <span>PMID ${escapeHtml(item.pmid || "")}</span>
          <span>${escapeHtml(item.webOfScienceStatus || "WoS 待复核")}</span>
        </div>
        ${renderTrustMeta(item, "huashanTeam")}
        <h3>${escapeHtml(item.title || "未命名论文")}</h3>
        <p class="huashan-authors">${escapeHtml(authors)}</p>
        <p class="zh-abstract">${escapeHtml(item.zhSummary || "中文摘要待生成。")}</p>
        ${item.sourceAffiliation ? `<p class="institution">${escapeHtml(item.sourceAffiliation)}</p>` : ""}
        <details>
          <summary>查看英文摘要</summary>
          <p>${escapeHtml(item.abstract || "PubMed 暂未提供摘要。")}</p>
        </details>
        <div class="huashan-paper__footer">
          <div class="china-tags">${tags}</div>
          <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">PubMed 摘要</a>
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
    .map((link) => normalizeSourceLink(link, item))
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

function renderSafety() {
  const items = treatmentItems();
  setScope("safety", "按药物整理重点安全信号、上市后监测说明和原始数据入口；自发报告信号不等同于因果关系。");
  setCount("safety", `${items.length} 个治疗项`);
  const summary = targetFor("safety-summary", false);
  if (summary) summary.innerHTML = renderSafetySummary(items);
  targetFor("safety").innerHTML = items.map(renderSafetyCard).join("");
}

function renderSafetySummary(items) {
  const signalCounts = new Map();
  for (const item of items) {
    for (const signal of item.safetySignals || []) {
      signalCounts.set(signal, (signalCounts.get(signal) || 0) + 1);
    }
  }
  const topSignals = [...signalCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 8)
    .map(([signal, count]) => `<span>${escapeHtml(signal)} <strong>${count}</strong></span>`)
    .join("");
  const classes = [...new Set(items.map((item) => item.class).filter(Boolean))]
    .map((name) => `<span>${escapeHtml(name)}</span>`)
    .join("");
  return `
    <div class="safety-overview">
      <article>
        <p>监测药物</p>
        <strong>${items.length}</strong>
        <span>来自获批治疗图谱</span>
      </article>
      <article>
        <p>重点信号</p>
        <div class="safety-signal-cloud">${topSignals}</div>
      </article>
      <article>
        <p>机制类别</p>
        <div class="safety-signal-cloud">${classes}</div>
      </article>
    </div>
  `;
}

function renderSafetyCard(item) {
  const signals = (item.safetySignals || []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");
  const links = safetyLinks(item)
    .map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
  return `
    <article class="safety-card">
      <div class="safety-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(item.class || "治疗药物")}</p>
          <h3>${escapeHtml(item.brand)} <span>${escapeHtml(item.generic || "")}</span></h3>
          <p>${escapeHtml(item.zhName || "")}</p>
        </div>
        <strong>${escapeHtml(item.route || "给药待补充")}</strong>
      </div>
      ${renderTrustMeta(item, "safety")}
      <div class="safety-alert">
        <span>上市后监测重点</span>
        <p>${escapeHtml(item.postMarketing || "待补充上市后安全性监测说明。")}</p>
      </div>
      <div class="safety-tags">${signals}</div>
      <dl class="safety-detail">
        <div><dt>适用人群</dt><dd>${escapeHtml(item.approvedUse || "待补充")}</dd></div>
        <div><dt>抗体/标志物</dt><dd>${escapeHtml(item.biomarker || "待补充")}</dd></div>
        <div><dt>风险阅读提示</dt><dd>自发报告数据库适合发现潜在信号，不能直接估计发生率，也不能单独证明药物因果关系。</dd></div>
      </dl>
      <div class="safety-links">${links}</div>
    </article>
  `;
}

function safetyLinks(item) {
  const links = item.links || [];
  const preferred = links.filter((link) => /openFDA|FAERS|Label|标签|DailyMed|FDA/i.test(link.label || link.url || ""));
  return (preferred.length ? preferred : links).slice(0, 4).map((link) => normalizeSourceLink(link, item));
}

function normalizeSourceLink(link = {}, item = {}) {
  if (!/openFDA|FAERS|api\.fda\.gov\/drug\/event/i.test(`${link.label || ""} ${link.url || ""}`)) return link;
  const url = new URL("pages/faers.html", APP_ROOT);
  if (item.id) url.searchParams.set("drug", item.id);
  if (item.brand) url.searchParams.set("brand", item.brand);
  if (item.generic) url.searchParams.set("generic", item.generic);
  if (link.url) url.searchParams.set("api", link.url);
  return {
    ...link,
    label: "FAERS 可视化",
    url: url.href
  };
}

async function renderFaersExplorer() {
  const target = targetFor("faers");
  const params = new URLSearchParams(window.location.search);
  const treatment = findFaersTreatment(params);
  const title = treatment ? `${treatment.brand} (${treatment.generic})` : params.get("brand") || params.get("generic") || "FAERS";
  setAll("[data-faers-title]", title);
  setAll("[data-faers-subtitle]", treatment?.zhName || "openFDA FAERS 药品不良事件报告");
  target.innerHTML = `<article class="faers-loading"><h3>正在读取 openFDA FAERS 数据</h3><p>请稍候。</p></article>`;

  try {
    const apiUrl = buildFaersApiUrl(params, treatment);
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`openFDA HTTP ${response.status}`);
    const data = await response.json();
    target.innerHTML = renderFaersDashboard(data, treatment, apiUrl);
  } catch (error) {
    target.innerHTML = `
      <article class="faers-empty">
        <h3>暂时无法读取 FAERS 数据</h3>
        <p>${escapeHtml(error.message || "openFDA 请求失败。")}</p>
        <a href="safety.html">返回安全监测</a>
      </article>
    `;
  }
}

function findFaersTreatment(params) {
  const drug = params.get("drug");
  const brand = params.get("brand");
  const generic = params.get("generic");
  return treatmentItems().find((item) =>
    (drug && item.id === drug) ||
    (brand && item.brand?.toLowerCase() === brand.toLowerCase()) ||
    (generic && item.generic?.toLowerCase() === generic.toLowerCase())
  );
}

function buildFaersApiUrl(params, treatment) {
  const existing = params.get("api");
  if (existing) {
    const url = new URL(existing);
    url.searchParams.set("sort", "receivedate:desc");
    url.searchParams.set("limit", "100");
    return url.href;
  }

  const brand = params.get("brand") || treatment?.brand;
  const generic = params.get("generic") || treatment?.generic;
  const search = brand
    ? `patient.drug.openfda.brand_name:"${brand}"`
    : `patient.drug.openfda.generic_name:"${generic || ""}"`;
  const url = new URL("https://api.fda.gov/drug/event.json");
  url.searchParams.set("search", search);
  url.searchParams.set("sort", "receivedate:desc");
  url.searchParams.set("limit", "100");
  return url.href;
}

function renderFaersDashboard(data = {}, treatment, apiUrl) {
  const reports = Array.isArray(data.results) ? data.results : [];
  const total = data.meta?.results?.total ?? reports.length;
  const serious = reports.filter((report) => report.serious === "1").length;
  const deaths = reports.filter((report) => report.seriousnessdeath === "1").length;
  const latestDate = reports.map(reportDate).filter(Boolean).sort().at(-1);
  const reactionBars = renderFaersBars(countFaersValues(reports, reactionTerms), "reaction");
  const countryBars = renderFaersBars(countFaersValues(reports, (report) => [report.primarysourcecountry || report.primarysource?.reportercountry]), "country");
  const outcomeBars = renderFaersBars(countFaersValues(reports, outcomeTerms), "outcome");
  const tableRows = reports.slice(0, 12).map(renderFaersReportRow).join("");
  const labelSignals = (treatment?.safetySignals || []).map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");

  return `
    <div class="faers-disclaimer">
      <strong>解读边界</strong>
      <span>FAERS 是自发报告系统。报告数可用于发现潜在信号，不能直接代表发生率、风险比或药物因果关系。</span>
    </div>
    <div class="faers-kpis">
      <article><span>openFDA 命中</span><strong>${formatNumber(total)}</strong><p>当前查询的报告总数</p></article>
      <article><span>本页样本</span><strong>${reports.length}</strong><p>最多展示最近 100 条</p></article>
      <article><span>严重报告</span><strong>${serious}</strong><p>本页样本内 serious=1</p></article>
      <article><span>死亡结局</span><strong>${deaths}</strong><p>本页样本内 death=1</p></article>
      <article><span>最近接收</span><strong>${latestDate ? formatFaersDate(latestDate) : "未显示"}</strong><p>按 receivedate 估算</p></article>
    </div>
    ${treatment ? `
      <section class="faers-panel">
        <div class="section-heading compact">
          <div>
            <p class="section-kicker">Label Context</p>
            <h2>标签/人工整理的重点风险</h2>
          </div>
        </div>
        <p>${escapeHtml(treatment.postMarketing || "暂无人工整理的上市后监测说明。")}</p>
        <div class="safety-tags">${labelSignals}</div>
      </section>
    ` : ""}
    <section class="faers-grid">
      <article class="faers-panel">
        <h2>常见报告反应</h2>
        ${reactionBars || `<p class="muted">暂无 reaction 字段。</p>`}
      </article>
      <article class="faers-panel">
        <h2>报告来源国家/地区</h2>
        ${countryBars || `<p class="muted">暂无国家字段。</p>`}
      </article>
      <article class="faers-panel">
        <h2>严重性结局标记</h2>
        ${outcomeBars || `<p class="muted">暂无严重性结局字段。</p>`}
      </article>
    </section>
    <section class="faers-panel">
      <div class="section-heading compact">
        <div>
          <p class="section-kicker">Recent Reports</p>
          <h2>最近报告样本</h2>
        </div>
        <a class="ghost-link" href="${escapeAttribute(apiUrl)}" target="_blank" rel="noreferrer">查看原始 JSON</a>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>接收日期</th><th>国家</th><th>性别/年龄</th><th>报告反应</th><th>疑似药物</th><th>严重性</th></tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="6">暂无报告样本。</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function countFaersValues(reports, getter) {
  const counts = new Map();
  for (const report of reports) {
    for (const value of getter(report).filter(Boolean)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
}

function reactionTerms(report) {
  return (report.patient?.reaction || []).map((item) => item.reactionmeddrapt);
}

function outcomeTerms(report) {
  const map = [
    ["seriousnessdeath", "Death"],
    ["seriousnesslifethreatening", "Life-threatening"],
    ["seriousnesshospitalization", "Hospitalization"],
    ["seriousnessdisabling", "Disabling"],
    ["seriousnesscongenitalanomali", "Congenital anomaly"],
    ["seriousnessother", "Other serious"]
  ];
  return map.filter(([key]) => report[key] === "1").map(([, label]) => label);
}

function renderFaersBars(entries, type) {
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return entries
    .map(([label, count]) => `
      <div class="faers-bar faers-bar--${type}">
        <span>${escapeHtml(label)}</span>
        <div><i style="width: ${Math.max(4, Math.round((count / max) * 100))}%"></i></div>
        <strong>${count}</strong>
      </div>
    `)
    .join("");
}

function renderFaersReportRow(report) {
  const reactions = reactionTerms(report).slice(0, 4).join("; ");
  const drugs = (report.patient?.drug || [])
    .filter((drug) => drug.drugcharacterization === "1" || drug.drugcharacterization === "2")
    .map((drug) => drug.medicinalproduct || drug.openfda?.brand_name?.[0] || drug.openfda?.generic_name?.[0])
    .filter(Boolean)
    .slice(0, 4)
    .join("; ");
  const patient = [
    formatFaersSex(report.patient?.patientsex),
    report.patient?.patientonsetage ? `${report.patient.patientonsetage}${formatFaersAgeUnit(report.patient.patientonsetageunit)}` : ""
  ].filter(Boolean).join(" / ");
  return `
    <tr>
      <td>${escapeHtml(formatFaersDate(reportDate(report)) || "未显示")}</td>
      <td>${escapeHtml(report.primarysourcecountry || report.primarysource?.reportercountry || "未显示")}</td>
      <td>${escapeHtml(patient || "未显示")}</td>
      <td>${escapeHtml(reactions || "未显示")}</td>
      <td>${escapeHtml(drugs || "未显示")}</td>
      <td>${escapeHtml(report.serious === "1" ? outcomeTerms(report).join("; ") || "Serious" : "Non-serious/未标记")}</td>
    </tr>
  `;
}

function reportDate(report) {
  return report.receivedate || report.receiptdate || report.transmissiondate || "";
}

function formatFaersDate(value = "") {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function formatFaersSex(value) {
  return { 1: "男", 2: "女", 0: "未知" }[value] || "";
}

function formatFaersAgeUnit(value) {
  return { 800: "十年", 801: "年", 802: "月", 803: "周", 804: "日", 805: "小时" }[value] || "";
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value) || 0);
}

function renderChinaAccess() {
  const items = chinaAccessItems();
  setScope("china-access", "从全球批准与市场数据中单列中国 NMPA 记录，并补充证据矩阵中的中国可及性说明。");
  setCount("china-access", `${items.length} 个中国获批产品`);
  const summary = targetFor("china-access-summary", false);
  if (summary) summary.innerHTML = renderChinaAccessSummary(items);
  targetFor("china-access").innerHTML = items.length
    ? items.map(renderChinaAccessCard).join("")
    : `<article class="china-access-card"><h3>暂无中国准入记录</h3><p>请检查 global-market.json 中是否已录入中国/NMPA 批准信息。</p></article>`;
}

function renderChinaAccessSummary(items) {
  const classes = [...new Set(items.map((item) => item.product.class).filter(Boolean))];
  const companies = [...new Set(items.map((item) => item.product.company).filter(Boolean))];
  const latest = items[0];
  return `
    <div class="access-overview">
      <article>
        <p>中国获批产品</p>
        <strong>${items.length}</strong>
        <span>NMPA 记录</span>
      </article>
      <article>
        <p>覆盖机制</p>
        <div class="access-cloud">${classes.map((name) => `<span>${escapeHtml(name)}</span>`).join("")}</div>
      </article>
      <article>
        <p>涉及企业</p>
        <div class="access-cloud">${companies.map((name) => `<span>${escapeHtml(name)}</span>`).join("")}</div>
      </article>
      <article>
        <p>最新记录</p>
        <strong>${escapeHtml(latest?.approval.approvalDate || "待补充")}</strong>
        <span>${escapeHtml(latest?.product.brand || "")}</span>
      </article>
    </div>
  `;
}

function renderChinaAccessCard(item) {
  const { product, approval, matrix } = item;
  const sales = product.sales || {};
  const sources = (product.sourceUrls || [])
    .slice(0, 4)
    .map((url, index) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">来源 ${index + 1}</a>`)
    .join("");
  return `
    <article class="china-access-card">
      <div class="china-access-card__head">
        <div>
          <p class="eyebrow-dark">${escapeHtml(product.class || "治疗药物")}</p>
          <h3>${escapeHtml(product.brand)} <span>${escapeHtml(product.generic || "")}</span></h3>
          <p>${escapeHtml(product.company || "公司待补充")}</p>
        </div>
        <strong>${escapeHtml(approval.approvalDate || "日期待补充")}</strong>
      </div>
      ${renderTrustMeta(product, "china-access")}
      <div class="approval-highlight">
        <span>${escapeHtml(approval.agency || "NMPA")}</span>
        <p>${escapeHtml(approval.indication || "适应症文本待补充")}</p>
      </div>
      <dl class="china-access-grid">
        <div><dt>中国可及性</dt><dd>${escapeHtml(matrix?.chinaAccess || "需补充医保、医院准入和真实世界使用信息。")}</dd></div>
        <div><dt>证据层级</dt><dd>${escapeHtml(matrix?.evidenceLevel || "证据层级待补充")}</dd></div>
        <div><dt>商业化口径</dt><dd>${escapeHtml(sales.scope || "销售口径待补充")}</dd></div>
        <div><dt>公开销售额</dt><dd>${escapeHtml([sales.year, sales.value].filter(Boolean).join("：") || "未单独披露")} ${sales.trend ? `（${escapeHtml(sales.trend)}）` : ""}</dd></div>
      </dl>
      <div class="access-links">${sources}</div>
    </article>
  `;
}

function chinaAccessItems() {
  return marketItems()
    .map((product) => ({
      product,
      approval: chinaApproval(product),
      matrix: matrixForProduct(product)
    }))
    .filter((item) => item.approval)
    .sort((a, b) => approvalTimestamp(b.approval.approvalDate) - approvalTimestamp(a.approval.approvalDate));
}

function chinaApproval(product) {
  return (product.approvals || []).find((approval) => /中国|China/i.test(approval.countryOrRegion || "") || /NMPA|CDE/i.test(approval.agency || ""));
}

function matrixForProduct(product) {
  const text = `${product.id || ""} ${product.brand || ""} ${product.generic || ""}`.toLowerCase();
  return matrixItems().find((item) => text.includes(String(item.id || "").toLowerCase()) || textIncludesAny(text, item.brand));
}

function textIncludesAny(text, value = "") {
  return String(value)
    .toLowerCase()
    .split(/\s+|\/|,|，/)
    .filter((part) => part.length > 3)
    .some((part) => text.includes(part));
}

function approvalTimestamp(value = "") {
  const match = String(value).match(/\d{4}(?:-\d{1,2})?/);
  return match ? new Date(`${match[0]}-01`).getTime() : 0;
}

function renderTrials() {
  const items = trialItems().filter(matchesTrial);
  setScope("trials", state.data.trials?.scopeNote);
  setCount("trials", `${items.length} / ${trialItems().length} 项试验`);
  targetFor("trials").innerHTML = items.map(renderTrialCard).join("");
}

function renderTrialCard(item) {
  const interventions = (item.interventions || []).map((name) => `<span>${escapeHtml(name)}</span>`).join("");
  const registry = trialRegistry(item);
  return `
    <article class="trial-card">
      <div class="trial-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(registry)} · ${escapeHtml(item.mechanism || "机制待分类")}</p>
          <h3>${escapeHtml(item.title || item.nctId)}</h3>
          <p>${escapeHtml([item.sponsor, item.phase].filter(Boolean).join(" | "))}</p>
        </div>
        <strong>${escapeHtml(formatTrialStatus(item.status))}</strong>
      </div>
      <div class="trial-meta">
        <span>注册号: ${escapeHtml(item.nctId || item.id || "待补充")}</span>
        <span>更新: ${escapeHtml(item.lastUpdate || "未知")}</span>
        <span>完成: ${escapeHtml(item.completionDate || "未知")}</span>
      </div>
      ${renderTrustMeta(item, "trials")}
      <div class="trial-tags">${interventions}</div>
      <p>${escapeHtml((item.countries || []).join(", ") || "国家/地区待补充")}</p>
      <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">查看 ${escapeHtml(registry)}</a>
    </article>
  `;
}

function renderChinaRegisteredTrials() {
  const items = trialItems().filter((item) => trialRegistry(item) === "ChiCTR");
  setCount("china-registered-trials", `${items.length} 个 ChiCTR 入口/条目`);
  targetFor("china-registered-trials").innerHTML = items.length
    ? items.map(renderTrialCard).join("")
    : `<article class="trial-card"><h3>暂无 ChiCTR 条目</h3><p>建议在 ChiCTR 官网以“重症肌无力 / myasthenia gravis / gMG”等关键词人工复核。</p></article>`;
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

function renderUpdateStatus() {
  const status = state.data.updateStatus || {};
  const automaticSources = status.sources || [];
  const manualSources = manualReviewSources();
  const attentionCount = automaticSources.filter((source) => /failed|error|失败/i.test(source.status || "")).length;
  setCount("update-status", `${automaticSources.length} 个自动来源，${manualSources.length} 个人工复核来源，${attentionCount} 个异常`);

  const overview = `
    <div class="status-overview">
      <article>
        <span>当前状态</span>
        <strong>${escapeHtml(formatStatusLabel(status.status || "unknown"))}</strong>
        <p>${escapeHtml(status.scope || "未记录更新范围")}</p>
      </article>
      <article>
        <span>最近完成</span>
        <strong>${escapeHtml(formatDateTime(status.runFinishedAt || status.updatedAt))}</strong>
        <p>脚本运行结束时间</p>
      </article>
      <article>
        <span>自动来源</span>
        <strong>${automaticSources.length}</strong>
        <p>${attentionCount ? `${attentionCount} 个自动来源异常` : "本次自动来源暂无异常标记"}</p>
      </article>
      <article>
        <span>人工复核来源</span>
        <strong>${manualSources.length}</strong>
        <p>${escapeHtml(status.nextReviewHint || "监管、市场、安全和指南类数据保持人工复核。")}</p>
      </article>
    </div>
  `;

  const automaticCards = automaticSources.map((source) => renderSourceStatusCard(source, "auto")).join("");
  const manualCards = manualSources.map((source) => renderSourceStatusCard(source, "manual")).join("");

  const outputs = status.outputs?.length
    ? `<div class="status-outputs">${status.outputs.map(renderStatusOutput).join("")}</div>`
    : `<article class="status-empty"><h3>暂无输出明细</h3><p>当前基线数据已建立；自动脚本正式运行后会在这里记录各数据文件的更新条数。</p></article>`;

  targetFor("update-status").innerHTML = `
    ${overview}
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Automatic Sources</p>
          <h3>自动更新来源</h3>
        </div>
        <span>${automaticSources.length} 个来源</span>
      </div>
      <div class="source-status-grid">${automaticCards || renderEmptyStatusCard("暂无自动来源记录", "请先运行 GitHub Actions 自动更新任务。")}</div>
    </section>
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Manual Review Sources</p>
          <h3>人工复核来源</h3>
        </div>
        <span>${manualSources.length} 个来源</span>
      </div>
      <div class="source-status-grid">${manualCards}</div>
    </section>
    <section class="status-block">
      <div class="status-block__head">
        <div>
          <p class="section-kicker">Generated Outputs</p>
          <h3>本次输出记录</h3>
        </div>
        <span>${(status.outputs || []).length} 个文件</span>
      </div>
      ${outputs}
    </section>
  `;
}

function renderSourceStatusCard(source = {}, mode = "auto") {
  const isManual = mode === "manual";
  const tone = isManual ? "manual" : sourceStatusTone(source.status);
  const timing = source.finishedAt ? `完成：${formatDateTime(source.finishedAt)}` : source.lastChecked ? `核查：${formatDate(source.lastChecked)}` : "";
  const count = Number.isFinite(source.count) ? `${source.count} 条` : source.countLabel || "";
  const link = source.url
    ? `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">打开来源</a>`
    : "";
  return `
    <article class="source-status-card" data-status="${escapeAttribute(tone)}">
      <div>
        <p class="section-kicker">${escapeHtml(source.frequency || (isManual ? "MANUAL REVIEW" : "AUTO RUN"))}</p>
        <h3>${escapeHtml(source.name || "未命名来源")}</h3>
      </div>
      <div class="source-status-card__badges">
        <strong>${escapeHtml(formatStatusLabel(source.status || (isManual ? "manual-review" : "unknown")))}</strong>
        ${count ? `<span>${escapeHtml(count)}</span>` : ""}
      </div>
      <p>${escapeHtml(source.fallbackPolicy || source.reason || "暂无容错说明")}</p>
      ${timing || link ? `<div class="source-status-card__meta">${timing ? `<span>${escapeHtml(timing)}</span>` : ""}${link}</div>` : ""}
    </article>
  `;
}

function renderEmptyStatusCard(title, body) {
  return `<article class="status-empty"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
}

function renderStatusOutput(output = {}) {
  return `
    <article>
      <strong>${escapeHtml(output.file || output.name || "未命名输出")}</strong>
      <span>${escapeHtml(output.count ?? output.status ?? "已记录")}</span>
    </article>
  `;
}

function renderReviewQueue() {
  const queue = reviewQueueItems();
  const highCount = queue.filter((item) => item.priority === "高").length;
  setCount("review-queue", `${queue.length} 项待复核，${highCount} 项高优先级`);
  targetFor("review-queue").innerHTML = queue.length
    ? queue.map(renderReviewQueueCard).join("")
    : `<article class="review-card"><h3>暂无待复核事项</h3><p>当数据来源失败、监管/销售额/安全性字段需要人工确认时，会自动出现在这里。</p></article>`;
}

function renderReviewQueueCard(item) {
  const link = item.url
    ? `<a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">打开来源</a>`
    : `<span>暂无直接来源链接</span>`;
  return `
    <article class="review-card">
      <div class="review-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(item.type)}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <strong class="priority-badge priority-${escapeAttribute(priorityClass(item.priority))}">${escapeHtml(item.priority)}</strong>
      </div>
      <p>${escapeHtml(item.reason)}</p>
      <div class="review-meta">
        <span>状态：${escapeHtml(item.status || "待复核")}</span>
        <span>建议频率：${escapeHtml(item.cadence || "按需")}</span>
        <span>最近核查：${escapeHtml(item.lastChecked ? formatDate(item.lastChecked) : "未记录")}</span>
      </div>
      <div class="review-actions">${link}</div>
    </article>
  `;
}

function reviewQueueItems() {
  const queue = [];
  const add = (item) => {
    if (!item?.title) return;
    queue.push({
      priority: priorityForReview(item.status, item.type),
      cadence: "每月",
      ...item
    });
  };

  for (const source of state.data.updateStatus?.sources || []) {
    if (/failed|error|manual|review|人工|失败|待/i.test(source.status || "")) {
      add({
        type: "数据源",
        title: source.name,
        status: formatStatusLabel(source.status),
        reason: source.fallbackPolicy || "该来源需要确认自动化状态或人工处理规则。",
        cadence: source.frequency || "按运行日志",
        lastChecked: state.data.updateStatus?.updatedAt
      });
    }
  }

  for (const product of marketItems()) {
    const meta = resolveTrustMeta(product, "market");
    add({
      type: "全球批准/市场",
      title: `${product.brand || product.generic || "未命名产品"} · ${product.company || "公司待补充"}`,
      status: meta.reviewStatus,
      reason: "批准国家、批准时间、适应症文本和销售额口径会持续变化，需回到监管数据库、财报和公司公告复核。",
      cadence: "每月/财报季",
      lastChecked: meta.lastChecked,
      url: product.sourceUrls?.[0]
    });
  }

  for (const treatment of treatmentItems()) {
    const meta = resolveTrustMeta(treatment, "treatments");
    add({
      type: "治疗证据/安全",
      title: `${treatment.brand || treatment.generic || "未命名治疗"} · ${treatment.zhName || treatment.class || ""}`.trim(),
      status: meta.reviewStatus,
      reason: "机制、适应症、关键 RCT、真实世界证据和上市后风险信号应逐条对照标签、审评文件和原始文献。",
      cadence: "每月",
      lastChecked: meta.lastChecked,
      url: treatment.links?.[0]?.url
    });
  }

  for (const trial of trialItems().filter((item) => trialRegistry(item) === "ChiCTR")) {
    const meta = resolveTrustMeta(trial, "trials");
    add({
      type: "ChiCTR",
      title: trial.title || trial.nctId || trial.id,
      status: meta.reviewStatus,
      reason: "中国临床试验注册中心目前作为人工复核入口保留，需打开官网核对注册版本、状态和研究者信息。",
      cadence: "每周/手动",
      lastChecked: meta.lastChecked,
      url: trial.url
    });
  }

  for (const pathway of guidanceItems()) {
    const meta = resolveTrustMeta(pathway, "guidance");
    add({
      type: "指南路径",
      title: pathway.clinicalQuestion || pathway.step,
      status: meta.reviewStatus,
      reason: "指南、共识和中国实践路径需要按新版指南、专家共识和监管变化更新。",
      cadence: "每季度",
      lastChecked: meta.lastChecked,
      url: pathway.sources?.[0]?.url
    });
  }

  for (const item of matrixItems()) {
    const meta = resolveTrustMeta(item, "matrix");
    add({
      type: "证据矩阵",
      title: `${item.brand || "未命名药物"} · ${item.mechanism || ""}`.trim(),
      status: meta.reviewStatus,
      reason: "横向比较依赖关键 RCT、长期随访和真实世界研究，新增证据后需要同步调整证据层级。",
      cadence: "每月/文献更新后",
      lastChecked: meta.lastChecked
    });
  }

  return queue.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || a.type.localeCompare(b.type, "zh-CN"));
}

function manualReviewSources() {
  return [
    {
      name: "CDE/NMPA",
      status: "manual-review",
      frequency: "WEEKLY / MANUAL",
      countLabel: "官方入口",
      reason: "CDE/NMPA 站内检索、受理号、审评进度、批准日期和适应症文本需要打开官方页面逐条确认。",
      url: "https://www.cde.org.cn/main/fullsearch/fullsearchpage"
    },
    {
      name: "ChiCTR",
      status: "manual-review",
      frequency: "WEEKLY / MANUAL",
      countLabel: `${trialItems().filter((item) => trialRegistry(item) === "ChiCTR").length} 条`,
      reason: "中国临床试验注册中心作为本土注册试验入口保留；注册号、版本、状态和研究者信息需人工核对。",
      url: "https://www.chictr.org.cn/"
    },
    {
      name: "全球批准与销售额",
      status: "needs-review",
      frequency: "MONTHLY / QUARTERLY",
      countLabel: `${marketItems().length} 个产品`,
      reason: "批准国家、批准机构、适应症和销售额口径会变化，需按监管数据库、财报和公司公告复核。",
      url: "trials-market.html"
    },
    {
      name: "中国准入与商业化",
      status: "needs-review",
      frequency: "MONTHLY",
      countLabel: `${chinaAccessItems().length} 个中国获批产品`,
      reason: "NMPA 批准、医保谈判、医院准入、患者援助和中国销售口径属于高变化字段，不能完全自动改写。",
      url: "china-access.html"
    },
    {
      name: "安全性与上市后监测",
      status: "partial-review",
      frequency: "MONTHLY",
      countLabel: `${treatmentItems().length} 个治疗项`,
      reason: "标签、FAERS/openFDA 信号、真实世界研究和风险管理结论需人工解释；自发报告不能直接代表发生率。",
      url: "safety.html"
    },
    {
      name: "指南路径与证据矩阵",
      status: "manual-curation",
      frequency: "QUARTERLY",
      countLabel: `${guidanceItems().length + matrixItems().length} 个节点`,
      reason: "指南、共识、证据等级和真实世界研究更新需要人工判断临床意义后再调整页面内容。",
      url: "guidance.html"
    }
  ];
}

function sourceStatusTone(status = "") {
  if (/failed|error|失败/i.test(status)) return "failed";
  if (/manual|review|人工|待/i.test(status)) return "manual";
  if (/configured|success|ok|成功|已配置/i.test(status)) return "ok";
  return "unknown";
}

function formatStatusLabel(status = "") {
  const map = {
    "strategy-defined": "策略已定义",
    configured: "已配置",
    "manual-review": "人工复核",
    "needs-review": "需定期复核",
    "partial-review": "部分核查",
    "manual-curation": "人工整理",
    skipped: "跳过",
    partial: "部分成功",
    failed: "失败",
    success: "成功"
  };
  return map[status] || status || "未记录";
}

function priorityForReview(status = "", type = "") {
  const text = `${status} ${type}`;
  if (/failed|error|失败|全球批准|市场|ChiCTR|数据源|需|待/i.test(text)) return "高";
  if (/部分|人工|指南|证据/i.test(text)) return "中";
  return "低";
}

function priorityRank(priority = "") {
  return { 高: 3, 中: 2, 低: 1 }[priority] || 0;
}

function priorityClass(priority = "") {
  return { 高: "high", 中: "medium", 低: "low" }[priority] || "low";
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
    (state.filters.trialStatus === "all" || item.status === state.filters.trialStatus) &&
    (state.filters.trialSource === "all" || trialRegistry(item) === state.filters.trialSource)
  );
}

function trialRegistry(item = {}) {
  return item.registry || item.source || item.trust?.sourceType || "ClinicalTrials.gov";
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

function huashanTeamItems() {
  return state.data.huashanTeam?.items || [];
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
  return new Date(b.indexedAt || b.date || b.lastUpdate || 0).getTime() - new Date(a.indexedAt || a.date || a.lastUpdate || 0).getTime();
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

function formatDateTime(value) {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
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
    SUSPENDED: "暂停",
    MANUAL_REVIEW: "人工复核入口"
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
