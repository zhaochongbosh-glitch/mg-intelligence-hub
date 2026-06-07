import { writeFile } from "node:fs/promises";

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

async function main() {
  const pubmedItems = await fetchPubMed();
  await sleep(400);
  const latestResearch = await fetchLatestResearch();
  await sleep(400);
  const chinaResearch = await fetchChinaResearch();
  const trialRadar = await fetchTrialRadar();
  const rssItems = await fetchRssSources();

  const feedData = {
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "PubMed/FDA RSS/官方入口",
      evidenceLevel: "信息线索",
      reviewStatus: "自动更新",
      reviewNote: "聚合条目帮助快速发现信息，任何临床、监管或市场判断都应回到原始链接复核。"
    }),
    items: dedupe([...pubmedItems, ...rssItems, ...MANUAL_ITEMS]).sort(sortByDateDesc)
  };

  const chinaData = {
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "PubMed Affiliation",
      evidenceLevel: "文献索引",
      reviewStatus: "自动更新",
      reviewNote: "中国研究者/机构通过 PubMed 机构字段近似识别，仍需人工查看原文记录确认。"
    }),
    scopeNote: "自动检索 PubMed 中 MG 主题且作者机构字段命中 China、Chinese、Hong Kong、Taiwan 或 Macau 的论文；用于透明地近似识别中国研究者/中国机构相关研究。",
    query: '("myasthenia gravis"[Title/Abstract] OR "generalized myasthenia gravis"[Title/Abstract] OR "ocular myasthenia"[Title/Abstract]) AND (China[Affiliation] OR Chinese[Affiliation] OR "Hong Kong"[Affiliation] OR Taiwan[Affiliation] OR Macau[Affiliation])',
    items: dedupe(chinaResearch).sort(sortByDateDesc)
  };

  const latestData = {
    updatedAt: new Date().toISOString(),
    windowHours: 24,
    translationStatus: process.env.OPENAI_API_KEY ? "translated" : "pending",
    provenance: trustMeta({
      sourceType: "PubMed",
      evidenceLevel: "文献摘要",
      reviewStatus: "自动更新",
      reviewNote: "中文摘要为阅读辅助，不能替代英文摘要、全文和同行评议结论。"
    }),
    scopeNote: "展示 PubMed 过去 24 小时内新上线或更新的重症肌无力研究。配置 OPENAI_API_KEY 后，自动生成中文摘要。",
    items: latestResearch.sort(sortByDateDesc)
  };

  const trialData = {
    updatedAt: new Date().toISOString(),
    provenance: trustMeta({
      sourceType: "ClinicalTrials.gov",
      evidenceLevel: "试验登记",
      reviewStatus: "自动更新",
      reviewNote: "登记状态、入组地区和完成日期可能变化；疗效结论需等待结果披露或论文发表。"
    }),
    scopeNote: "自动检索 ClinicalTrials.gov 中 Myasthenia Gravis 相关研究，按机制和状态组织；用于研发情报和入组动态跟踪。",
    items: trialRadar
  };

  await Promise.all([
    writeFile("data/items.json", `${JSON.stringify(feedData, null, 2)}\n`, "utf8"),
    writeFile("data/china-research.json", `${JSON.stringify(chinaData, null, 2)}\n`, "utf8"),
    writeFile("data/latest-research.json", `${JSON.stringify(latestData, null, 2)}\n`, "utf8"),
    writeFile("data/trial-radar.json", `${JSON.stringify(trialData, null, 2)}\n`, "utf8")
  ]);

  console.log(`Wrote ${feedData.items.length} feed items to data/items.json`);
  console.log(`Wrote ${chinaData.items.length} China research items to data/china-research.json`);
  console.log(`Wrote ${latestData.items.length} latest research items to data/latest-research.json`);
  console.log(`Wrote ${trialData.items.length} clinical trial items to data/trial-radar.json`);
}

async function fetchPubMed() {
  const term = encodeURIComponent('"myasthenia gravis" OR "ocular myasthenia" OR "generalized myasthenia gravis"');
  const ids = await searchPubMed(term, 16);
  return summarizePubMed(ids, "文献");
}

async function fetchLatestResearch() {
  const term = encodeURIComponent('"myasthenia gravis" OR "ocular myasthenia" OR "generalized myasthenia gravis"');
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub+date&retmax=12&datetype=edat&reldate=1&term=${term}`;
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
  const ids = await searchPubMed(term, 18);
  const summaries = await summarizePubMed(ids, "中国研究");
  return summaries.map((item) => ({
    ...item,
    source: "PubMed China-affiliated",
    topic: classifyResearchTopic(item.title),
    institutionHint: "中国相关机构命中来自 PubMed Affiliation 字段；具体单位请查看原文记录。",
    summary: item.summary,
    trust: trustMeta({
      sourceType: "PubMed Affiliation",
      evidenceLevel: "文献索引",
      reviewStatus: "自动更新",
      reviewNote: "中国研究者/机构由 PubMed 机构字段近似识别，需打开原文记录人工确认。"
    }),
    tags: ["中国研究", "PubMed", classifyResearchTopic(item.title)]
  }));
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
    abstract: article.abstract,
    zhSummary: "",
    keyPoints: [],
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
      translationStatus: "no-abstract"
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ...base,
      zhSummary: "已抓取英文摘要；尚未配置 OPENAI_API_KEY，因此中文摘要待自动生成。",
      keyPoints: fallbackKeyPoints(article.abstract),
      translationStatus: "pending"
    };
  }

  try {
    const ai = await summarizeInChinese(article);
    return {
      ...base,
      zhSummary: ai.summary || base.zhSummary,
      keyPoints: Array.isArray(ai.keyPoints) ? ai.keyPoints.slice(0, 4) : [],
      translationStatus: "translated"
    };
  } catch (error) {
    return {
      ...base,
      zhSummary: "中文摘要生成失败，已保留英文摘要。请检查 OpenAI API 配置或稍后重试。",
      keyPoints: fallbackKeyPoints(article.abstract),
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
          content: "你是医学文献情报分析员。请用准确、克制的中文总结 PubMed 研究摘要，不夸大结论，不添加摘要之外的信息。"
        },
        {
          role: "user",
          content: `题目：${article.title}\n期刊：${article.journal}\n英文摘要：${article.abstract}\n\n请输出 JSON：{\"summary\":\"120-180字中文摘要\",\"keyPoints\":[\"要点1\",\"要点2\",\"要点3\"]}`
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
    date: parsePubMedXmlDate(xml)
  };
}

function parsePubMedXmlDate(xml) {
  const pubDate = xml.match(/<PubDate>([\s\S]*?)<\/PubDate>/)?.[1] || "";
  const year = stripXml(readTag(pubDate, "Year")) || new Date().getUTCFullYear();
  const month = stripXml(readTag(pubDate, "Month"));
  const day = stripXml(readTag(pubDate, "Day")) || "01";
  return `${year}-${month ? monthNumber(month.slice(0, 3)) : "01"}-${String(day).padStart(2, "0")}`;
}

function fallbackKeyPoints(abstract = "") {
  return abstract
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 40)
    .slice(0, 3);
}

async function searchPubMed(term, retmax) {
  await sleep(350);
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub+date&retmax=${retmax}&term=${term}`;
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

function sortByDateDesc(a, b) {
  return new Date(b.date || 0) - new Date(a.date || 0);
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
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) {
      throw new Error(`${response.status} ${url}`);
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
