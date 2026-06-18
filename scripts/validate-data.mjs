import { readFile, readdir } from "node:fs/promises";

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
  "data/journal-metrics.json",
  "data/manual-review-log.json",
  "data/terminology.json"
];

const arrayKeys = {
  "data/items.json": "items",
  "data/latest-research.json": "items",
  "data/china-research.json": "items",
  "data/huashan-team.json": "items",
  "data/trial-radar.json": "items",
  "data/treatments.json": "treatments",
  "data/evidence-matrix.json": "items",
  "data/global-market.json": "products",
  "data/guidance-pathways.json": "pathways",
  "data/journal-metrics.json": "records",
  "data/manual-review-log.json": "items",
  "data/terminology.json": "terms"
};

async function main() {
  const files = await readdir("data");
  for (const file of requiredFiles) {
    if (!files.includes(file.replace("data/", ""))) {
      throw new Error(`${file} is missing`);
    }
    const data = JSON.parse(await readFile(file, "utf8"));
    validateFile(file, data);
    console.log(`ok ${file}: ${countRecords(file, data)} records`);
  }
}

function validateFile(file, data) {
  if (!data || typeof data !== "object") throw new Error(`${file}: expected JSON object`);
  if (!data.updatedAt) throw new Error(`${file}: missing updatedAt`);
  if (!data.provenance) throw new Error(`${file}: missing provenance`);
  const key = arrayKeys[file];
  if (!Array.isArray(data[key])) throw new Error(`${file}: ${key} must be an array`);
  if (file === "data/journal-metrics.json") validateJournalMetrics(file, data);
  if (file === "data/manual-review-log.json") validateManualReviewLog(file, data);
  if (file === "data/terminology.json") validateTerminology(file, data);
}

function countRecords(file, data) {
  return data[arrayKeys[file]].length;
}

function validateManualReviewLog(file, data) {
  if (data.schemaVersion !== 1) throw new Error(`${file}: schemaVersion must be 1`);
  if (!Array.isArray(data.modules) || !data.modules.length) {
    throw new Error(`${file}: modules must be a non-empty array`);
  }
  if (!Array.isArray(data.decisionTypes) || !data.decisionTypes.length) {
    throw new Error(`${file}: decisionTypes must be a non-empty array`);
  }
  if (!Array.isArray(data.riskLevels) || !data.riskLevels.length) {
    throw new Error(`${file}: riskLevels must be a non-empty array`);
  }
  if (!data.itemTemplate || typeof data.itemTemplate !== "object") {
    throw new Error(`${file}: missing itemTemplate`);
  }

  const decisions = new Set(data.decisionTypes);
  const risks = new Set(data.riskLevels);
  const modules = new Set(data.modules);
  for (const item of data.items) {
    if (!item.id) throw new Error(`${file}: review item missing id`);
    if (!decisions.has(item.decision)) throw new Error(`${file}: ${item.id} has unknown decision ${item.decision}`);
    if (!risks.has(item.riskLevel)) throw new Error(`${file}: ${item.id} has unknown riskLevel ${item.riskLevel}`);
    if (item.module && !modules.has(item.module)) throw new Error(`${file}: ${item.id} has unknown module ${item.module}`);
    if (!Array.isArray(item.sourceUrls)) throw new Error(`${file}: ${item.id} sourceUrls must be an array`);
  }
}

function validateJournalMetrics(file, data) {
  if (!data.records.length) throw new Error(`${file}: records must not be empty`);
  const sample = data.records.find((record) => record.journalName && record.impactFactor);
  if (!sample) throw new Error(`${file}: expected at least one record with journalName and impactFactor`);
}

function validateTerminology(file, data) {
  if (data.schemaVersion !== 1) throw new Error(`${file}: schemaVersion must be 1`);
  if (!data.terms.length) throw new Error(`${file}: terms must not be empty`);
  for (const term of data.terms) {
    if (!term.key) throw new Error(`${file}: term missing key`);
    if (!term.zh) throw new Error(`${file}: ${term.key} missing zh`);
    if (!term.en) throw new Error(`${file}: ${term.key} missing en`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
