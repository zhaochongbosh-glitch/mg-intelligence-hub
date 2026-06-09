import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const runStartedAt = new Date().toISOString();
const updateScope = parseUpdateScope();
const sourceRuns = [];
let previousData = {};

const KEYWORDS = [
  "myasthenia gravis",
  "重症肌无力",
  "gMG",
  "ocular myasthenia",
  "FcRn",
  "efgartigimod",
  "rozanolixizumab",
  "ravulizumab",
  "zilucoplan",
  "nipocalimab",
  "inebilizumab",
  "complement inhibitor"
];

const RSS_SOURCES = [
  {
    source: "FDA",
    category: "监管动态",
    language: "en",
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml"
  },
  {
    source: "FDA",
    category: "监管动态",
    language: "en",
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml"
  }
];

const MANUAL_ITEMS = [
  {
    id: "fda-drugs-rss",
    category: "监管动态",
    source: "FDA",
    language: "en",
    date: today(),
    title: "FDA: What's New: Drugs RSS",
    summary: "FDA 药品相关更新源。自动脚本会筛选 myasthenia gravis、neuromuscular、FcRn、complement 等关键词；有命中时会新增具体新闻卡片。",
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml",
    trust: trustMeta({
      sourceType: "FDA RSS",
      evidenceLevel: "官方入口",
      reviewStatus: "自动更新",
      reviewNote: "入口卡片用于持续监测，具体结论需打开 FDA 原始页面确认。"
    }),
    tags: ["FDA", "regulatory", "RSS"]
  },
  {
    id: "clinicaltrials-search-mg",
    category: "研发动态",
    source: "ClinicalTrials.gov",
    language: "en",
    date: today(),
    title: "ClinicalTrials.gov: Myasthenia Gravis 试验登记入口",
    summary: "用于追踪 MG 相关药物、抗体、细胞治疗和观察性研究的招募状态、研究设计与申办方信息。",
    url: "https://clinicaltrials.gov/search?cond=Myasthenia%20Gravis",
    trust: trustMeta({
      sourceType: "ClinicalTrials.gov",
      evidenceLevel: "官方入口",
      reviewStatus: "自动更新",
      reviewNote: "试验登记信息不等同于已发表疗效或安全性证据。"
    }),
    tags: ["clinical trial", "drug development"]
  },
  {
    id: "cde-search-mg",
    category: "监管动态",
    source: "CDE/NMPA",
    language: "zh",
    date: today(),
    title: "CDE 药审中心全站检索入口",
    summary: "可检索重症肌无力、适应症、药物名称、突破性治疗、优先审评、临床试验默示许可等信息。",
    url: "https://www.cde.org.cn/main/fullsearch/fullsearchpage",
    trust: trustMeta({
      sourceType: "CDE/NMPA",
      evidenceLevel: "官方入口",
      reviewStatus: "人工复核入口",
      reviewNote: "CDE 站内结果需要人工检索并核对发布日期、受理号和适应症描述。"
    }),
    tags: ["CDE", "NMPA", "中国监管"]
  },
  {
    id: "conference-watchlist",
    category: "会议摘要",
    source: "Watchlist",
    language: "en",
    date: today(),
    title: "会议摘要追踪清单",
    summary: "建议后续纳入 AAN、MGFA、EAN、AANEM、EULAR 等会议摘要页面，并按会议开放程度选择自动抓取或人工录入。",
    url: "https://www.aan.com/events/annual-meeting",
    trust: trustMeta({
      sourceType: "会议官网",
      evidenceLevel: "会议线索",
      reviewStatus: "待复核",
      reviewNote: "会议摘要通常未经过完整同行评议，需等待全文发表或官方资料更新。"
    }),
    tags: ["conference", "abstract"]
  }
];

const MANUAL_TRIAL_ITEMS = [
  {
    id: "chictr-mg-search",
    nctId: "ChiCTR",
    registry: "ChiCTR",
    title: "ChiCTR 中国临床试验注册中心：重症肌无力检索入口",
    status: "MANUAL_REVIEW",
    phase: "Registry",
    mechanism: "中国注册入口",
    sponsor: "Chinese Clinical Trial Registry",
    interventions: ["重症肌无力", "myasthenia gravis", "gMG"],
    conditions: ["Myasthenia Gravis", "Generalized Myasthenia Gravis"],
    countries: ["China"],
    startDate: "",
    completionDate: "",
    lastUpdate: today(),
    trust: trustMeta({
      sourceType: "ChiCTR",
      evidenceLevel: "中国试验注册入口",
      reviewStatus: "人工复核入口",
      reviewNote: "ChiCTR 页面可能需要验证，当前作为人工检索入口；命中试验需逐条核对注册号、版本、研究状态和入排标准。"
    }),
    url: "https://www.chictr.org.cn/"
  },
  {
    id: "chictr2100050903",
    nctId: "ChiCTR2100050903",
    registry: "ChiCTR",
    title: "HBM9161 皮下注射治疗全身型重症肌无力患者的有效性、安全性的多中心随机双盲研究",
    status: "MANUAL_REVIEW",
    phase: "PHASE2, PHASE3",
    mechanism: "FcRn",
    sponsor: "Harbour BioMed / HBM9161",
    interventions: ["HBM9161", "Batoclimab"],
    conditions: ["Generalized Myasthenia Gravis", "Myasthenia Gravis"],
    countries: ["China"],
    startDate: "",
    completionDate: "",
    lastUpdate: "2022-03-28",
    trust: trustMeta({
      sourceType: "ChiCTR",
      evidenceLevel: "中国试验注册",
      reviewStatus: "待复核",
      reviewNote: "来自 ChiCTR 公开索引线索；因官网可能触发访问验证，需人工打开原始记录核对版本和状态。"
    }),
    url: "https://www.chictr.org.cn/hvshowproject.html?id=156285&v=1.5"
  }
];

const SOURCE_CONFIG = {
  "pubmed-feed": {
    type: "automatic",
    frequency: "DAILY",
    fallbackPolicy: "失败时保留上一版 PubMed 文献信息流。"
  },
  "latest-research": {
    type: "automatic",
    frequency: "DAILY",
    fallbackPolicy: "失败时保留上一版近 7 天研究摘要。"
  },
  "china-research": {
    type: "automatic",
    frequency: "DAILY",
    fallbackPolicy: "失败时保留上一版中国研究列表。"
  },
  "huashan-team": {
    type: "automatic",
    frequency: "DAILY",
    fallbackPolicy: "失败时保留上一版华山 MG 团队论文列表。"
  },
  "clinical-trials": {
    type: "automatic",
    frequency: "DAILY",
    fallbackPolicy: "失败时保留上一版临床试验雷达。"
  },
  "fda-rss": {
    type: "automatic",
    frequency: "DAILY",
    fallbackPolicy: "失败时保留上一版 FDA RSS 命中条目。"
  }
};

async function main() {
  console.log(`MG data update started: scope=${updateScope}`);
  const previous = await loadPreviousData();
  previousData = previous;
  const writes = [];

  if (shouldUpdate("feed")) {
    const [pubmedResult, rssResult] = await Promise.all([
      runSource("pubmed-feed", fetchPubMed),
      runSource("fda-rss", fetchRssSources)
    ]);
    const feedItems = buildFeedItems({
      pubmedItems: pubmedResult.ok ? pubmedResult.data : previousFeedItems(previous.feed, "PubMed"),
      rssItems: rssResult.ok ? rssResult.data : previousFeedItems(previous.feed, "FDA"),
      manualItems: MANUAL_ITEMS
    });
    writes.push(["data/items.json", buildFeedData(feedItems, pubmedResult, rssResult)]);
  } else {
    recordSkipped("feed", "范围未选择 feed/literature/all");
  }

  if (shouldUpdate("latest")) {
    await sleep(400);
    const result = await runSource("latest-research", fetchLatestResearch);
    const items = result.ok ? result.data.sort(sortByDateDesc) : previous.latest.items || [];
    writes.push(["data/latest-research.json", buildLatestData(items, result)]);
  } else {
    recordSkipped("latest-research", "范围未选择 latest/literature/all");
  }

  if (shouldUpdate("china")) {
    await sleep(400);
    const result = await runSource("china-research", fetchChinaResearch);
    const items = result.ok ? dedupe(result.data).sort(sortByDateDesc) : previous.china.items || [];
    writes.push(["data/china-research.json", buildChinaData(items, result)]);
  } else {
    recordSkipped("china-research", "范围未选择 china/literature/all");
  }

  if (shouldUpdate("huashan")) {
    await sleep(400);
    const result = await runSource("huashan-team", fetchHuashanTeam);
    const items = result.ok ? dedupe(result.data).sort(sortByDateDesc) : previous.huashan.items || [];
    writes.push(["data/huashan-team.json", buildHuashanTeamData(items, result)]);
  } else {
    recordSkipped("huashan-team", "范围未选择 huashan/literature/all");
  }

  if (shouldUpdate("trials")) {
    const result = await runSource("clinical-trials", fetchTrialRadar);
    const items = result.ok ? result.data : previous.trials.items || [];
    writes.push(["data/trial-radar.json", buildTrialData(items, result)]);
  } else {
    recordSkipped("clinical-trials", "范围未选择 trials/all");
  }

  for (const [file, data] of writes) {
    validateDataShape(file, data);
    await writeJsonAtomic(file, data);
    console.log(`Wrote ${countItems(data)} records to ${file}`);
  }

  await writeUpdateStatus(writes);
  const failed = sourceRuns.filter((item) => item.status === "failed");
  if (failed.length) {
    console.warn(`Completed with ${failed.length} failed source(s); previous data was preserved where available.`);
  }
}

async function loadPreviousData() {
  return {
    feed: await readJson("data/items.json", { items: [] }),
    latest: await readJson("data/latest-research.json", { items: [] }),
    china: await readJson("data/china-research.json", { items: [] }),
    huashan: await readJson("data/huashan-team.json", { items: [] }),
    trials: await readJson("data/trial-radar.json", { items: [] })
  };
}

async function runSource(name, task) {
  const startedAt = new Date().toISOString();
  const config = SOURCE_CONFIG[name] || {};
  try {
    const data = await task();
    const count = Array.isArray(data) ? data.length : 0;
    const record = {
      name,
      ...config,
      status: "success",
      startedAt,
      finishedAt: new Date().toISOString(),
      count
    };
    sourceRuns.push(record);
    return { ok: true, data, record };
  } catch (error) {
    const record = {
      name,
      ...config,
      status: "failed",
      startedAt,
      finishedAt: new Date().toISOString(),
      error: error.message
    };
    sourceRuns.push(record);
    console.warn(`[${name}] ${error.message}`);
    return { ok: false, data: [], record };
  }
}

function recordSkipped(name, reason) {
  const config = SOURCE_CONFIG[name] || {};
  sourceRuns.push({
    name,
    ...config,
    status: "skipped",
    startedAt: runStartedAt,
    finishedAt: new Date().toISOString(),
    reason
  });
}

function buildFeedItems({ pubmedItems, rssItems, manualItems }) {
  return dedupe([...pubmedItems, ...rssItems, ...manualItems]).sort(sortByDateDesc);
}

function buildFeedData(items, pubmedResult, rssResult) {
  return withUpdateMeta({
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "PubMed/FDA RSS/官方入口",
      evidenceLevel: "信息线索",
      reviewStatus: sourceStatus(pubmedResult, rssResult),
      reviewNote: "聚合条目帮助快速发现信息，任何临床、监管或市场判断都应回到原始链接复核。"
    }),
    updatePolicy: updatePolicy("daily", "PubMed 或 FDA RSS 失败时保留对应来源的上一版条目。"),
    items
  }, pubmedResult, rssResult);
}

function buildLatestData(items, result) {
  return withUpdateMeta({
    updatedAt: new Date().toISOString(),
    windowHours: 168,
    windowDays: 7,
    translationStatus: process.env.OPENAI_API_KEY ? "translated" : "pending",
    provenance: trustMeta({
      sourceType: "PubMed",
      evidenceLevel: "文献摘要",
      reviewStatus: result.ok ? "自动更新" : "沿用旧数据",
      reviewNote: "中文摘要为阅读辅助，不能替代英文摘要、全文和同行评议结论。"
    }),
    updatePolicy: updatePolicy("daily", "PubMed 近 7 天检索失败时保留上一版最新摘要。"),
    scopeNote: "展示 PubMed 过去 7 天内新上线或更新的重症肌无力研究。配置 OPENAI_API_KEY 后，自动生成中文摘要。",
    items
  }, result);
}

function buildChinaData(items, result) {
  return withUpdateMeta({
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "PubMed Affiliation",
      evidenceLevel: "文献索引",
      reviewStatus: result.ok ? "自动更新" : "沿用旧数据",
      reviewNote: "中国研究者/机构通过 PubMed 机构字段近似识别，仍需人工查看原文记录确认。"
    }),
    updatePolicy: updatePolicy("daily", "中国机构检索失败时保留上一版中国研究列表。"),
    scopeNote: "自动检索 PubMed 中 MG 主题且作者机构字段命中 China、Chinese、Hong Kong、Taiwan 或 Macau 的论文；用于透明地近似识别中国研究者/中国机构相关研究。",
    query: '("myasthenia gravis"[Title/Abstract] OR "generalized myasthenia gravis"[Title/Abstract] OR "ocular myasthenia"[Title/Abstract]) AND (China[Affiliation] OR Chinese[Affiliation] OR "Hong Kong"[Affiliation] OR Taiwan[Affiliation] OR Macau[Affiliation])',
    items
  }, result);
}

function buildHuashanTeamData(items, result) {
  return withUpdateMeta({
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "PubMed Affiliation / Web of Science manual review",
      evidenceLevel: "团队论文索引",
      reviewStatus: result.ok ? "PubMed 自动更新，WoS 待人工复核" : "沿用旧数据",
      reviewNote: "PubMed 通过作者署名单位检索 Huashan Hospital / Department of Neurology 与 myasthenia gravis 相关论文；Web of Science 通常需要机构订阅或 API，当前保留为人工复核来源。"
    }),
    updatePolicy: updatePolicy("daily", "PubMed 检索失败时保留上一版华山团队论文列表；Web of Science 结果需人工导入或后续 API 接入。"),
    scopeNote: "自动检索作者署名单位包含 Huashan Hospital / Department of Neurology 且主题为 myasthenia gravis 的 PubMed 论文，按发表日期倒序展示。Web of Science 结果需机构权限复核后补充。",
    query: '("myasthenia gravis"[Title/Abstract] OR "Myasthenia Gravis"[MeSH Terms]) AND ("Huashan Hospital"[Affiliation] OR "Hua Shan Hospital"[Affiliation] OR "Huashan Hosp"[Affiliation]) AND (Neurology[Affiliation] OR "Department of Neurology"[Affiliation])',
    webOfScience: {
      status: "manual-review-required",
      note: "Web of Science 检索和导出通常需要机构订阅权限；可导出题录后导入本文件，或后续接入 Clarivate API。"
    },
    items
  }, result);
}

function buildTrialData(items, result) {
  const mergedItems = mergeManualTrials(items);
  return withUpdateMeta({
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "ClinicalTrials.gov",
      evidenceLevel: "试验登记",
      reviewStatus: result.ok ? "自动更新" : "沿用旧数据",
      reviewNote: "登记状态、入组地区和完成日期可能变化；疗效结论需等待结果披露或论文发表。"
    }),
    updatePolicy: updatePolicy("daily", "ClinicalTrials.gov API 失败时保留上一版试验雷达。"),
    scopeNote: "自动检索 ClinicalTrials.gov 中 Myasthenia Gravis 相关研究，并保留 ChiCTR 中国注册入口/人工复核条目；用于全球和中国本土研发情报跟踪。",
    items: mergedItems
  }, result);
}

function withUpdateMeta(data, ...results) {
  const failed = results.filter((result) => result && !result.ok).map((result) => result.record.name);
  return {
    ...data,
    updateRun: {
      runStartedAt,
      runFinishedAt: new Date().toISOString(),
      scope: updateScope,
      status: failed.length ? "partial" : "success",
      failedSources: failed
    }
  };
}

function updatePolicy(frequency, fallbackPolicy) {
  return {
    frequency,
    fallbackPolicy,
    manualReview: "监管批准、商业化、医保和指南类静态数据不由本脚本自动改写，需人工复核后更新。"
  };
}

function sourceStatus(...results) {
  return results.every((result) => result?.ok) ? "自动更新" : "部分沿用旧数据";
}

function previousFeedItems(feed, source) {
  const manualIds = new Set(MANUAL_ITEMS.map((item) => item.id));
  return (feed.items || []).filter((item) => item.source === source && !manualIds.has(item.id));
}

async function writeUpdateStatus(writes) {
  const status = {
    updatedAt: new Date().toISOString(),
    runStartedAt,
    runFinishedAt: new Date().toISOString(),
    scope: updateScope,
    status: sourceRuns.some((item) => item.status === "failed") ? "partial" : "success",
    sources: sourceRuns,
    outputs: writes.map(([file, data]) => ({
      file,
      count: countItems(data),
      status: data.updateRun?.status || "success"
    })),
    nextReviewHint: "自动数据每日更新；监管批准、医保准入、销售额和安全性结论建议至少每月人工复核一次。"
  };
  await writeJsonAtomic("data/update-status.json", status);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJsonAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, file);
}

function validateDataShape(file, data) {
  if (!data || typeof data !== "object") throw new Error(`${file}: data must be an object`);
  if (!data.updatedAt) throw new Error(`${file}: missing updatedAt`);
  if (!data.provenance) throw new Error(`${file}: missing provenance`);
  if (file.endsWith("items.json") && !Array.isArray(data.items)) throw new Error(`${file}: items must be an array`);
  if (file.endsWith("latest-research.json") && !Array.isArray(data.items)) throw new Error(`${file}: items must be an array`);
  if (file.endsWith("china-research.json") && !Array.isArray(data.items)) throw new Error(`${file}: items must be an array`);
  if (file.endsWith("huashan-team.json") && !Array.isArray(data.items)) throw new Error(`${file}: items must be an array`);
  if (file.endsWith("trial-radar.json") && !Array.isArray(data.items)) throw new Error(`${file}: items must be an array`);
}

function countItems(data) {
  return Array.isArray(data.items) ? data.items.length : 0;
}

function mergeManualTrials(items) {
  const manualIds = new Set(MANUAL_TRIAL_ITEMS.map((item) => item.id));
  const automaticItems = items.filter((item) => !manualIds.has(item.id));
  return dedupe([...MANUAL_TRIAL_ITEMS, ...automaticItems]);
}

function shouldUpdate(target) {
  const groups = {
    all: ["feed", "latest", "china", "huashan", "trials"],
    literature: ["feed", "latest", "china", "huashan"],
    feed: ["feed"],
    latest: ["latest"],
    china: ["china"],
    huashan: ["huashan"],
    trials: ["trials"]
  };
  return (groups[updateScope] || groups.all).includes(target);
}

function parseUpdateScope() {
  const cliScope = process.argv.find((arg) => arg.startsWith("--scope="))?.split("=")[1];
  const scope = cliScope || process.env.UPDATE_SCOPE || "all";
  const allowed = new Set(["all", "literature", "feed", "latest", "china", "huashan", "trials"]);
  return allowed.has(scope) ? scope : "all";
}

async function fetchPubMed() {
  const term = encodeURIComponent('"myasthenia gravis" OR "ocular myasthenia" OR "generalized myasthenia gravis"');
  const ids = await searchPubMed(term, 16);
  return summarizePubMed(ids, "文献");
}

async function fetchLatestResearch() {
  const term = encodeURIComponent('"myasthenia gravis" OR "ocular myasthenia" OR "generalized myasthenia gravis"');
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub+date&retmax=40&datetype=edat&reldate=7&term=${term}`;
  await sleep(350);
  const search = await getJson(searchUrl);
  const ids = search?.esearchresult?.idlist || [];
  if (!ids.length) return [];

  await sleep(350);
  const xml = await getText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`);
  const articles = parsePubMedArticles(xml);
  const translated = [];
  for (const article of articles) {
    translated.push(await enrichLatestArticle(article));
    await sleep(250);
  }
  return translated;
}

async function fetchChinaResearch() {
  const term = encodeURIComponent(
    '("myasthenia gravis"[Title/Abstract] OR "generalized myasthenia gravis"[Title/Abstract] OR "ocular myasthenia"[Title/Abstract]) AND (China[Affiliation] OR Chinese[Affiliation] OR "Hong Kong"[Affiliation] OR Taiwan[Affiliation] OR Macau[Affiliation])'
  );
  const [recentIds, broadIds] = await Promise.all([
    searchPubMed(term, 50, { datetype: "edat", reldate: 7 }),
    searchPubMed(term, 100)
  ]);
  const ids = uniqueIds([...chinaCarryoverIds(), ...recentIds, ...broadIds]);
  if (!ids.length) return [];

  await sleep(350);
  const xml = await getText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`);
  return parsePubMedArticles(xml)
    .map((article) => ({
      ...article,
      affiliations: extractAffiliations(xml, article.pmid)
    }))
    .filter(hasChinaAffiliation)
    .map(mapChinaArticle)
    .sort(sortByDateDesc)
    .slice(0, 100);
}

async function fetchHuashanTeam() {
  const term = encodeURIComponent(
    '("myasthenia gravis"[Title/Abstract] OR "Myasthenia Gravis"[MeSH Terms]) AND ("Huashan Hospital"[Affiliation] OR "Hua Shan Hospital"[Affiliation] OR "Huashan Hosp"[Affiliation]) AND (Neurology[Affiliation] OR "Department of Neurology"[Affiliation])'
  );
  const [recentIds, broadIds] = await Promise.all([
    searchPubMed(term, 50, { datetype: "edat", reldate: 7 }),
    searchPubMed(term, 120)
  ]);
  const ids = uniqueIds([...recentIds, ...broadIds]);
  if (!ids.length) return [];

  await sleep(350);
  const xml = await getText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`);
  const articles = parsePubMedArticles(xml).map((article) => ({
    ...article,
    affiliations: extractAffiliations(xml, article.pmid)
  }));
  const enriched = [];
  for (const article of articles) {
    enriched.push(await enrichHuashanArticle(article));
    await sleep(220);
  }
  return enriched;
}

function hasChinaAffiliation(article) {
  return Boolean(findChinaAffiliation(article.affiliations));
}

function chinaCarryoverIds() {
  const latest = previousData.latest?.items || [];
  const huashan = previousData.huashan?.items || [];
  return uniqueIds([...latest, ...huashan]
    .filter((item) => item.pmid && matchesChinaText([
      item.title,
      item.abstract,
      item.summary,
      item.institutionHint,
      item.sourceAffiliation,
      item.authors
    ].filter(Boolean).join(" ")))
    .map((item) => item.pmid));
}

function findChinaAffiliation(affiliations = []) {
  return affiliations.find((affiliation) => matchesChinaText(affiliation)) || "";
}

function matchesChinaText(value = "") {
  return /\bChina\b|Chinese|Hong Kong|Taiwan|Macau|Shanghai|Beijing|Guangzhou|Nanjing|Hangzhou|Wuhan|Chengdu|Xi'an|Fudan|Peking|Tsinghua|Zhejiang|Sun Yat-sen|Huashan|Hua Shan/i.test(value);
}

function mapChinaArticle(article) {
  const previous = previousData.china?.items?.find((item) => item.pmid === article.pmid);
  const sourceAffiliation = findChinaAffiliation(article.affiliations);
  const topic = classifyResearchTopic(article.title);
  return {
    id: `pubmed-${article.pmid}`,
    pmid: article.pmid,
    category: "中国研究",
    source: "PubMed China-affiliated",
    language: "en",
    date: article.date,
    indexedAt: article.indexedAt || article.date,
    title: article.title,
    authors: article.authors,
    journal: article.journal,
    abstract: article.abstract,
    summary: previous?.summary || firstSentence(article.abstract) || [article.authors, article.journal].filter(Boolean).join(" | "),
    url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
    trust: trustMeta({
      sourceType: "PubMed Affiliation",
      evidenceLevel: "文献索引",
      reviewStatus: "自动更新",
      reviewNote: "中国研究者/机构由 PubMed 机构字段近似识别，需打开原文记录人工确认。"
    }),
    tags: ["中国研究", "PubMed", topic],
    topic,
    institutionHint: sourceAffiliation || "中国相关机构命中来自 PubMed Affiliation 字段；具体单位请查看原文记录。"
  };
}

async function enrichHuashanArticle(article) {
  const previous = previousData.huashan?.items?.find((item) => item.pmid === article.pmid);
  const sourceAffiliation = (article.affiliations || []).find((affiliation) =>
    /huashan|hua shan/i.test(affiliation) && /neurology/i.test(affiliation)
  ) || (article.affiliations || []).find((affiliation) => /huashan|hua shan/i.test(affiliation)) || "";
  const base = {
    id: `huashan-${article.pmid}`,
    pmid: article.pmid,
    title: article.title,
    journal: article.journal,
    date: article.date,
    indexedAt: article.indexedAt || article.date,
    authors: article.authors,
    abstract: article.abstract,
    zhSummary: "",
    translationStatus: "pending",
    sourceAffiliation,
    url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
    source: "PubMed",
    webOfScienceStatus: "待人工复核",
    trust: trustMeta({
      sourceType: "PubMed Affiliation",
      evidenceLevel: "团队论文索引",
      reviewStatus: "自动更新",
      reviewNote: "作者署名单位由 PubMed Affiliation 字段近似识别；团队归属和 Web of Science 收录状态需人工复核。"
    }),
    tags: ["华山 MG 团队", "PubMed", classifyResearchTopic(article.title)]
  };

  if (previous?.zhSummary && previous.translationStatus === "translated") {
    return {
      ...base,
      zhSummary: previous.zhSummary,
      translationStatus: "translated"
    };
  }

  if (!article.abstract) {
    return {
      ...base,
      zhSummary: "PubMed 记录暂未提供摘要；请打开 PubMed 页面或出版商页面查看全文信息。",
      translationStatus: "no-abstract"
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ...base,
      zhSummary: previous?.zhSummary || "已抓取英文摘要；尚未在当前运行环境配置 OPENAI_API_KEY，因此中文摘要待 GitHub Actions 自动生成。",
      translationStatus: previous?.translationStatus || "pending"
    };
  }

  try {
    return {
      ...base,
      zhSummary: await summarizeTeamArticleInChinese(article),
      translationStatus: "translated"
    };
  } catch {
    return {
      ...base,
      zhSummary: "中文摘要生成失败；已保留英文摘要和 PubMed 链接，建议人工复核。",
      translationStatus: "error"
    };
  }
}

async function fetchTrialRadar() {
  const url = "https://clinicaltrials.gov/api/v2/studies?query.cond=Myasthenia%20Gravis&pageSize=30&sort=LastUpdatePostDate:desc";
  const data = await getJson(url);
  const studies = Array.isArray(data.studies) ? data.studies : [];
  return studies.map(mapClinicalTrial).filter(Boolean);
}

function mapClinicalTrial(study) {
  const protocol = study.protocolSection || {};
  const identification = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const design = protocol.designModule || {};
  const conditions = protocol.conditionsModule || {};
  const arms = protocol.armsInterventionsModule || {};
  const sponsor = protocol.sponsorCollaboratorsModule || {};
  const contacts = protocol.contactsLocationsModule || {};
  const interventions = arms.interventions || [];
  const interventionNames = interventions.map((item) => item.name).filter(Boolean);
  const title = identification.briefTitle || identification.officialTitle || "";
  const leadSponsor = sponsor.leadSponsor?.name || "";
  const countries = [...new Set((contacts.locations || []).map((location) => location.country).filter(Boolean))];
  const mechanism = classifyTrialMechanism(`${title} ${interventionNames.join(" ")}`);
  return {
    id: identification.nctId,
    nctId: identification.nctId,
    registry: "ClinicalTrials.gov",
    title,
    status: status.overallStatus || "UNKNOWN",
    phase: (design.phases || []).join(", ") || "Not specified",
    mechanism,
    sponsor: leadSponsor,
    interventions: interventionNames.slice(0, 6),
    conditions: (conditions.conditions || []).slice(0, 6),
    countries: countries.slice(0, 8),
    startDate: status.startDateStruct?.date || "",
    completionDate: status.completionDateStruct?.date || "",
    lastUpdate: status.lastUpdatePostDateStruct?.date || "",
    trust: trustMeta({
      sourceType: "ClinicalTrials.gov",
      evidenceLevel: "试验登记",
      reviewStatus: "自动更新",
      reviewNote: "登记信息用于研发监测，不代表疗效或安全性已获证实。"
    }),
    url: `https://clinicaltrials.gov/study/${identification.nctId}`
  };
}

function classifyTrialMechanism(text = "") {
  const value = text.toLowerCase();
  if (/(efgartigimod|rozanolixizumab|nipocalimab|batoclimab|fgc|fcrn)/.test(value)) return "FcRn";
  if (/(eculizumab|ravulizumab|zilucoplan|pozelimab|cemdisiran|c5|c3|complement)/.test(value)) return "补体";
  if (/(inebilizumab|rituximab|cd19|cd20|b cell|b-cell|cart|car-t|caar)/.test(value)) return "B细胞/细胞治疗";
  if (/(telitacicept|ba\/apr|blys|april|belimumab)/.test(value)) return "BLyS/APRIL";
  if (/(ivig|immune globulin|plasma exchange|plasmapheresis)/.test(value)) return "救援/免疫调节";
  if (/(thymectomy|thymoma|surgery)/.test(value)) return "胸腺相关";
  if (/(pyridostigmine|mestinon|acetylcholinesterase)/.test(value)) return "对症治疗";
  return "其他/观察性";
}

async function enrichLatestArticle(article) {
  const base = {
    id: `latest-${article.pmid}`,
    pmid: article.pmid,
    title: article.title,
    journal: article.journal,
    authors: article.authors,
    date: article.date,
    indexedAt: article.indexedAt || article.date,
    abstract: article.abstract,
    zhSummary: "",
    keyPoints: [],
    intelligence: {
      studyType: "",
      population: "",
      keyFinding: "",
      clinicalImplication: "",
      reviewFocus: ""
    },
    translationStatus: "pending",
    url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
    trust: trustMeta({
      sourceType: "PubMed",
      evidenceLevel: "文献摘要",
      reviewStatus: "自动更新",
      reviewNote: "自动抓取 PubMed 记录；中文摘要或要点需结合英文摘要和全文复核。"
    }),
    tags: ["latest", "PubMed", classifyResearchTopic(article.title)]
  };

  if (!article.abstract) {
    return {
      ...base,
      zhSummary: "PubMed 记录暂未提供摘要。请打开原文查看全文或出版商页面。",
      intelligence: {
        ...base.intelligence,
        studyType: "PubMed 记录无摘要",
        reviewFocus: "打开 PubMed 原文或出版商页面，确认题目、文章类型和全文内容。"
      },
      translationStatus: "no-abstract"
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ...base,
      zhSummary: "已抓取英文摘要；尚未配置 OPENAI_API_KEY，因此中文摘要待自动生成。",
      keyPoints: fallbackKeyPoints(article.abstract),
      intelligence: fallbackIntelligence(article),
      translationStatus: "pending"
    };
  }

  try {
    const ai = await summarizeInChinese(article);
    return {
      ...base,
      zhSummary: ai.summary || base.zhSummary,
      keyPoints: Array.isArray(ai.keyPoints) ? ai.keyPoints.slice(0, 4) : [],
      intelligence: normalizeLatestIntelligence(ai, article),
      translationStatus: "translated"
    };
  } catch (error) {
    return {
      ...base,
      zhSummary: "中文摘要生成失败，已保留英文摘要。请检查 OpenAI API 配置或稍后重试。",
      keyPoints: fallbackKeyPoints(article.abstract),
      intelligence: fallbackIntelligence(article),
      translationStatus: "error"
    };
  }
}

async function summarizeInChinese(article) {
  const response = await fetchWithRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SUMMARY_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "你是重症肌无力领域的医学文献情报分析员。请用准确、克制的中文解读 PubMed 摘要，只基于摘要内容，不夸大因果、疗效、安全性或指南意义；不添加摘要之外的信息。"
        },
        {
          role: "user",
          content: `题目：${article.title}\n期刊：${article.journal}\n英文摘要：${article.abstract}\n\n请输出严格 JSON，不要 Markdown：{\n  \"summary\":\"120-180字中文摘要，说明研究问题、方法/数据来源、主要结果和限制；不能超过摘要证据\",\n  \"keyPoints\":[\"3-4条中文要点，每条不超过45字\"],\n  \"intelligence\":{\n    \"studyType\":\"研究类型，如系统综述/Meta分析、RCT、队列研究、病例报告、机制研究、综述、评论等；不确定则写不明确\",\n    \"population\":\"研究对象/疾病场景；不明确则写摘要未说明\",\n    \"keyFinding\":\"最重要发现，保留关键数字或方向性结果；不夸大\",\n    \"clinicalImplication\":\"对MG临床、药物研发、安全监测或准入情报的意义；若非MG核心研究，说明其间接相关性\",\n    \"reviewFocus\":\"人工复核重点，例如全文、研究设计、终点、亚组、MG定义、安全事件或适用人群\"\n  }\n}`
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  }, 3);
  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") || "{}";
  return JSON.parse(text);
}

async function summarizeTeamArticleInChinese(article) {
  const response = await fetchWithRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SUMMARY_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "你是重症肌无力领域的医学文献情报编辑。请只基于题目和英文摘要，写一段准确、克制的中文摘要，不添加摘要之外的信息。"
        },
        {
          role: "user",
          content: `题目：${article.title}\n期刊：${article.journal}\n英文摘要：${article.abstract}\n\n请输出 100-160 字中文摘要，说明研究问题、对象/方法、主要发现和需要复核的限制。不要使用 Markdown。`
        }
      ]
    })
  }, 3);
  const data = await response.json();
  return cleanAiField(data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") || "");
}

function normalizeLatestIntelligence(ai = {}, article = {}) {
  const source = ai.intelligence && typeof ai.intelligence === "object" ? ai.intelligence : {};
  return {
    studyType: cleanAiField(source.studyType) || "不明确",
    population: cleanAiField(source.population) || "摘要未说明",
    keyFinding: cleanAiField(source.keyFinding) || firstSentence(ai.summary) || firstSentence(article.abstract),
    clinicalImplication: cleanAiField(source.clinicalImplication) || "需结合全文判断对 MG 临床或研发情报的意义。",
    reviewFocus: cleanAiField(source.reviewFocus) || "复核全文、研究设计、终点定义、统计方法和适用人群。"
  };
}

function fallbackIntelligence(article = {}) {
  return {
    studyType: classifyFallbackStudyType(article.title, article.abstract),
    population: "摘要待中文结构化解读",
    keyFinding: firstSentence(article.abstract) || "英文摘要已抓取，等待中文情报解读。",
    clinicalImplication: "需配置或检查 OpenAI 摘要生成后判断其对 MG 临床、研发或安全监测的意义。",
    reviewFocus: "打开 PubMed 原文，复核全文、研究设计、终点和 MG 相关性。"
  };
}

function classifyFallbackStudyType(title = "", abstract = "") {
  const text = `${title} ${abstract}`.toLowerCase();
  if (/meta-analysis|systematic review/.test(text)) return "系统综述/Meta分析";
  if (/randomized|randomised|trial/.test(text)) return "临床试验";
  if (/cohort|registry|real-world|real world/.test(text)) return "队列/真实世界研究";
  if (/case report|case series/.test(text)) return "病例报告/病例系列";
  if (/review/.test(text)) return "综述";
  if (/comment|letter|regarding/.test(text)) return "评论/通信";
  return "不明确";
}

function cleanAiField(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstSentence(value = "") {
  return String(value || "").split(/(?<=[.!?。！？])\s+/).find((sentence) => sentence.trim().length > 12)?.trim() || "";
}

function parsePubMedArticles(xml) {
  return [...xml.matchAll(/<PubmedArticle\b[\s\S]*?<\/PubmedArticle>/g)].map((match) => parsePubMedArticle(match[0])).filter((article) => article.pmid);
}

function parsePubMedArticle(xml) {
  const pmid = stripXml(readTag(xml, "PMID"));
  const title = stripXml(readTag(xml, "ArticleTitle"));
  const journal = stripXml(readTag(xml, "Title"));
  const abstract = [...xml.matchAll(/<AbstractText\b[^>]*>([\s\S]*?)<\/AbstractText>/g)]
    .map((match) => stripXml(match[1]))
    .filter(Boolean)
    .join(" ");
  const authors = [...xml.matchAll(/<Author ValidYN="Y">([\s\S]*?)<\/Author>/g)]
    .slice(0, 6)
    .map((match) => {
      const lastName = stripXml(readTag(match[1], "LastName"));
      const foreName = stripXml(readTag(match[1], "ForeName"));
      return [foreName, lastName].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(", ");
  return {
    pmid,
    title,
    journal,
    abstract,
    authors,
    date: parsePubMedXmlDate(xml),
    indexedAt: parsePubMedHistoryDate(xml, "entrez") || parsePubMedHistoryDate(xml, "pubmed") || parsePubMedXmlDate(xml)
  };
}

function extractAffiliations(xml, pmid) {
  const article = [...xml.matchAll(/<PubmedArticle\b[\s\S]*?<\/PubmedArticle>/g)]
    .map((match) => match[0])
    .find((block) => stripXml(readTag(block, "PMID")) === pmid);
  if (!article) return [];
  return [...new Set([...article.matchAll(/<Affiliation>([\s\S]*?)<\/Affiliation>/g)]
    .map((match) => stripXml(match[1]))
    .filter(Boolean))];
}

function parsePubMedXmlDate(xml) {
  const pubDate = xml.match(/<PubDate>([\s\S]*?)<\/PubDate>/)?.[1] || "";
  const year = stripXml(readTag(pubDate, "Year")) || new Date().getUTCFullYear();
  const month = stripXml(readTag(pubDate, "Month"));
  const day = stripXml(readTag(pubDate, "Day")) || "01";
  return `${year}-${month ? monthNumber(month.slice(0, 3)) : "01"}-${String(day).padStart(2, "0")}`;
}

function parsePubMedHistoryDate(xml, status) {
  const entry = [...xml.matchAll(/<PubMedPubDate\b([^>]*)>([\s\S]*?)<\/PubMedPubDate>/g)]
    .find((match) => new RegExp(`PubStatus=["']${status}["']`, "i").test(match[1]));
  if (!entry) return "";
  const block = entry[2];
  const year = stripXml(readTag(block, "Year"));
  if (!year) return "";
  const month = stripXml(readTag(block, "Month")) || "01";
  const day = stripXml(readTag(block, "Day")) || "01";
  return `${year}-${monthNumber(month.slice(0, 3))}-${String(day).padStart(2, "0")}`;
}

function fallbackKeyPoints(abstract = "") {
  return abstract
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 40)
    .slice(0, 3);
}

async function searchPubMed(term, retmax, options = {}) {
  await sleep(350);
  let queryTerm = term;
  try {
    queryTerm = decodeURIComponent(term);
  } catch {
    queryTerm = term;
  }
  const params = new URLSearchParams({
    db: "pubmed",
    retmode: "json",
    sort: options.sort || "pub date",
    retmax: String(retmax),
    term: queryTerm
  });
  if (options.datetype) params.set("datetype", options.datetype);
  if (options.reldate) params.set("reldate", String(options.reldate));
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`;
  const search = await getJson(searchUrl);
  return search?.esearchresult?.idlist || [];
}

async function summarizePubMed(ids, category) {
  if (!ids.length) return [];
  await sleep(350);
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
  const summary = await getJson(summaryUrl);
  return ids
    .map((id) => summary?.result?.[id])
    .filter(Boolean)
    .map((article) => ({
      id: `pubmed-${article.uid}`,
      category,
      source: "PubMed",
      language: "en",
      date: normalizePubMedDate(article.pubdate || article.sortpubdate),
      title: article.title,
      authors: formatAuthors(article.authors),
      journal: article.fulljournalname || "",
      summary: summarizeAuthors(article.authors, article.fulljournalname),
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
      trust: trustMeta({
        sourceType: "PubMed",
        evidenceLevel: "文献索引",
        reviewStatus: "自动更新",
        reviewNote: "自动抓取 PubMed 索引信息，研究设计和结论需打开原文确认。"
      }),
      tags: ["PubMed", "literature", article.fulljournalname].filter(Boolean)
    }));
}

async function fetchRssSources() {
  const groups = await Promise.allSettled(RSS_SOURCES.map(fetchRss));
  return groups.flatMap((group) => (group.status === "fulfilled" ? group.value : []));
}

async function fetchRss(source) {
  const xml = await getText(source.url);
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return items
    .map((item) => {
      const title = stripXml(readTag(item, "title"));
      const summary = stripXml(readTag(item, "description"));
      const url = stripXml(readTag(item, "link"));
      const date = normalizeDate(stripXml(readTag(item, "pubDate"))) || today();
      return {
        id: `${source.source.toLowerCase()}-${hash(url || title)}`,
        category: source.category,
        source: source.source,
        language: source.language,
        date,
        title,
        summary,
        url,
        trust: trustMeta({
          sourceType: `${source.source} RSS`,
          evidenceLevel: "监管动态",
          reviewStatus: "自动更新",
          reviewNote: "RSS 摘要为自动筛选结果，需打开原始监管页面核对完整信息。"
        }),
        tags: ["FDA", "regulatory", "RSS"]
      };
    })
    .filter((item) => item.title && item.url)
    .filter(matchesKeyword)
    .slice(0, 12);
}

function matchesKeyword(item) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  return KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function classifyResearchTopic(title = "") {
  const text = title.toLowerCase();
  if (/(efgartigimod|eculizumab|ravulizumab|zilucoplan|rozanolixizumab|nipocalimab|inebilizumab|treatment|therapy|real-world|real world)/.test(text)) {
    return "治疗与真实世界";
  }
  if (/(antibody|achr|musk|lrp4|immun|b cell|t cell|complement|pathogenesis|mechanism)/.test(text)) {
    return "免疫机制";
  }
  if (/(diagnos|electrophysiolog|imaging|biomarker|score|scale)/.test(text)) {
    return "诊断与评估";
  }
  if (/(thymoma|thymectomy|surgery|胸腺)/.test(text)) {
    return "胸腺相关";
  }
  if (/(cohort|epidemiolog|registry|risk|prognos|mortality|quality of life)/.test(text)) {
    return "队列与预后";
  }
  return "综合研究";
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueIds(ids) {
  return [...new Set(ids.filter(Boolean))];
}

function sortByDateDesc(a, b) {
  return new Date(b.indexedAt || b.date || 0) - new Date(a.indexedAt || a.date || 0);
}

async function getJson(url) {
  const response = await fetchWithRetry(url, { headers: { "User-Agent": "MG Intelligence Hub/0.1" } });
  return response.json();
}

async function getText(url) {
  const response = await fetchWithRetry(url, { headers: { "User-Agent": "MG Intelligence Hub/0.1" } });
  return response.text();
}

async function fetchWithRetry(url, options, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) {
        throw new Error(`${response.status} ${url}`);
      }
    } catch (error) {
      if (attempt === attempts) throw error;
    }
    await sleep(750 * attempt);
  }
  throw new Error(`Request failed ${url}`);
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function stripXml(value) {
  return decodeEntities(String(value).replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'");
}

function summarizeAuthors(authors = [], journal = "") {
  const names = formatAuthors(authors, 3);
  const suffix = authors.length > 3 ? " et al." : "";
  return [names ? `${names}${suffix}` : "", journal].filter(Boolean).join(" | ");
}

function formatAuthors(authors = [], max = 8) {
  return authors
    .slice(0, max)
    .map((author) => author.name)
    .filter(Boolean)
    .join(", ");
}

function normalizePubMedDate(value) {
  if (!value) return today();
  const cleaned = String(value).replace(/\s+/g, " ");
  const match = cleaned.match(/^(\d{4})(?:\s+([A-Za-z]{3}))?(?:\s+(\d{1,2}))?/);
  if (!match) return normalizeDate(cleaned) || today();
  const month = match[2] ? monthNumber(match[2]) : "01";
  const day = match[3] ? match[3].padStart(2, "0") : "01";
  return `${match[1]}-${month}-${day}`;
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function monthNumber(month) {
  if (/^\d{1,2}$/.test(month)) return String(Math.min(Math.max(Number(month), 1), 12)).padStart(2, "0");
  const index = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(month.toLowerCase());
  return String(Math.max(index + 1, 1)).padStart(2, "0");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function trustMeta({ sourceType, evidenceLevel, reviewStatus, reviewNote = "" }) {
  return {
    sourceType,
    evidenceLevel,
    reviewStatus,
    lastChecked: today(),
    reviewNote
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hash(value) {
  let output = 0;
  for (let index = 0; index < value.length; index += 1) {
    output = (output << 5) - output + value.charCodeAt(index);
    output |= 0;
  }
  return Math.abs(output).toString(36);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
