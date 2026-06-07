import { readFile, readdir } from "node:fs/promises";

const requiredFiles = [
  "data/items.json",
  "data/latest-research.json",
  "data/china-research.json",
  "data/trial-radar.json",
  "data/treatments.json",
  "data/evidence-matrix.json",
  "data/global-market.json",
  "data/guidance-pathways.json"
];

const arrayKeys = {
  "data/items.json": "items",
  "data/latest-research.json": "items",
  "data/china-research.json": "items",
  "data/trial-radar.json": "items",
  "data/treatments.json": "treatments",
  "data/evidence-matrix.json": "items",
  "data/global-market.json": "products",
  "data/guidance-pathways.json": "pathways"
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
}

function countRecords(file, data) {
  return data[arrayKeys[file]].length;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
