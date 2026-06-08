import { readFile } from "node:fs/promises";

const requiredFiles = [
  "data/items.json",
  "data/latest-research.json",
  "data/china-research.json",
  "data/huashan-team.json",
  "data/trial-radar.json",
  "data/treatments.json",
  "data/evidence-matrix.json",
  "data/global-market.json",
  "data/guidance-pathways.json",
  "data/manual-review-log.json",
  "data/update-status.json"
];

const requiredMinimums = {
  "data/items.json": ["items", 1],
  "data/latest-research.json": ["items", 1],
  "data/china-research.json": ["items", 1],
  "data/huashan-team.json": ["items", 1],
  "data/trial-radar.json": ["items", 1],
  "data/treatments.json": ["treatments", 1],
  "data/evidence-matrix.json": ["items", 1],
  "data/global-market.json": ["products", 1],
  "data/guidance-pathways.json": ["pathways", 1]
};

const errors = [];
const warnings = [];
const summary = [];

async function main() {
  const data = {};
  for (const file of requiredFiles) {
    data[file] = await readJson(file);
  }

  checkMinimums(data);
  checkUpdateStatus(data["data/update-status.json"]);
  checkManualReviewLog(data["data/manual-review-log.json"]);
  checkLatestResearch(data["data/latest-research.json"]);
  checkHuashanTeam(data["data/huashan-team.json"]);
  checkClinicalTrials(data["data/trial-radar.json"]);

  for (const line of summary) console.log(line);
  for (const warning of warnings) console.warn(`warning: ${warning}`);

  if (errors.length) {
    for (const error of errors) console.error(`error: ${error}`);
    process.exit(1);
  }

  console.log("health-check: ok");
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(`${file}: cannot read or parse JSON (${error.message})`);
    return {};
  }
}

function checkMinimums(data) {
  for (const [file, [key, minimum]] of Object.entries(requiredMinimums)) {
    const records = data[file]?.[key];
    if (!Array.isArray(records)) {
      errors.push(`${file}: ${key} must be an array`);
      continue;
    }
    summary.push(`${file}: ${records.length} ${key}`);
    if (records.length < minimum) {
      errors.push(`${file}: expected at least ${minimum} ${key}, found ${records.length}`);
    }
  }
}

function checkUpdateStatus(status = {}) {
  if (status.status !== "success") {
    errors.push(`data/update-status.json: status is ${status.status || "missing"}, expected success`);
  }
  if (!Array.isArray(status.sources) || !status.sources.length) {
    errors.push("data/update-status.json: sources must be a non-empty array");
    return;
  }

  const failedSources = status.sources.filter((source) => source.status === "failed");
  if (failedSources.length) {
    errors.push(`data/update-status.json: failed sources: ${failedSources.map((source) => `${source.name}:${source.status}`).join(", ")}`);
  }

  const expectedSources = ["pubmed-feed", "latest-research", "china-research", "clinical-trials", "fda-rss"];
  const presentSources = new Set(status.sources.map((source) => source.name));
  for (const name of expectedSources) {
    if (!presentSources.has(name)) errors.push(`data/update-status.json: missing source ${name}`);
  }

  const finishedAt = new Date(status.runFinishedAt || status.updatedAt || "");
  if (Number.isNaN(finishedAt.getTime())) {
    errors.push("data/update-status.json: missing valid runFinishedAt/updatedAt");
  } else {
    const ageHours = (Date.now() - finishedAt.getTime()) / 36e5;
    summary.push(`update-status: last run ${ageHours.toFixed(1)} hours ago`);
    if (ageHours > 72) warnings.push(`last successful update is older than 72 hours (${ageHours.toFixed(1)}h)`);
  }

  if (!Array.isArray(status.outputs) || !status.outputs.length) {
    errors.push("data/update-status.json: outputs must be a non-empty array");
  }
}

function checkLatestResearch(latest = {}) {
  const items = latest.items || [];
  if (latest.windowDays !== 7 && latest.windowHours !== 168) {
    warnings.push("latest-research: expected a 7-day window (windowDays=7 or windowHours=168)");
  }

  const translated = items.filter((item) => item.translationStatus === "translated");
  const noAbstract = items.filter((item) => item.translationStatus === "no-abstract");
  const pending = items.filter((item) => item.translationStatus === "pending" || item.translationStatus === "error");
  summary.push(`latest-research: translated=${translated.length}, noAbstract=${noAbstract.length}, pendingOrError=${pending.length}`);

  if (items.some((item) => item.translationStatus === "translated" && !item.zhSummary)) {
    errors.push("latest-research: translated item missing zhSummary");
  }
  if (items.some((item) => item.translationStatus === "translated" && !item.intelligence)) {
    warnings.push("latest-research: translated item missing structured intelligence block");
  }
  if (pending.length && translated.length === 0) {
    warnings.push("latest-research: no translated summaries found; check OPENAI_API_KEY if this persists");
  }
}

function checkManualReviewLog(log = {}) {
  if (log.schemaVersion !== 1) {
    errors.push("manual-review-log: schemaVersion must be 1");
  }
  if (!Array.isArray(log.items)) {
    errors.push("manual-review-log: items must be an array");
    return;
  }
  if (!Array.isArray(log.modules) || !log.modules.length) {
    errors.push("manual-review-log: modules must be a non-empty array");
  }
  if (!Array.isArray(log.decisionTypes) || !log.decisionTypes.length) {
    errors.push("manual-review-log: decisionTypes must be a non-empty array");
  }
  if (!Array.isArray(log.riskLevels) || !log.riskLevels.length) {
    errors.push("manual-review-log: riskLevels must be a non-empty array");
  }

  summary.push(`manual-review-log: ${log.items.length} review records`);
  if (log.items.length === 0) {
    warnings.push("manual-review-log: no review records yet; add entries after the first formal manual review");
  }
}

function checkHuashanTeam(team = {}) {
  const items = team.items || [];
  const missingPmid = items.filter((item) => !item.pmid);
  const translated = items.filter((item) => item.translationStatus === "translated");
  summary.push(`huashan-team: records=${items.length}, translated=${translated.length}`);
  if (missingPmid.length) errors.push(`huashan-team: ${missingPmid.length} items missing PMID`);
  if (!team.webOfScience || team.webOfScience.status !== "manual-review-required") {
    warnings.push("huashan-team: Web of Science review status is not documented");
  }
}

function checkClinicalTrials(trials = {}) {
  const items = trials.items || [];
  const registries = new Set(items.map((item) => item.registry || item.source).filter(Boolean));
  if (!registries.has("ClinicalTrials.gov")) errors.push("trial-radar: missing ClinicalTrials.gov records");
  if (!registries.has("ChiCTR")) warnings.push("trial-radar: missing ChiCTR manual review entries");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
