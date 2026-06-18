import { readFile } from "node:fs/promises";

const errors = [];
const warnings = [];
const summary = [];

const checks = [
  {
    file: "data/treatments.json",
    key: "treatments",
    fields: [
      "class",
      "target",
      "mechanism",
      "approvedUse",
      "biomarker",
      "route",
      "pivotalEvidence",
      "realWorldEvidence",
      "postMarketing",
      "evidenceGrade"
    ],
    lists: ["safetySignals"]
  },
  {
    file: "data/evidence-matrix.json",
    key: "items",
    fields: [
      "mechanism",
      "population",
      "pivotalTrial",
      "longTermEvidence",
      "realWorldEvidence",
      "safetyFocus",
      "chinaAccess",
      "evidenceLevel"
    ]
  },
  {
    file: "data/global-market.json",
    key: "products",
    fields: ["brand", "generic", "company", "class"],
    nested: [
      ["sales", "value"],
      ["sales", "scope"],
      ["sales", "trend"]
    ],
    arrays: [
      {
        key: "approvals",
        fields: ["countryOrRegion", "agency", "indication"]
      }
    ]
  },
  {
    file: "data/manual-review-log.json",
    key: "items",
    fields: ["topic", "summary", "notes"],
    lists: ["changesMade"]
  }
];

const requiredTerminology = [
  "MG",
  "gMG",
  "AChR",
  "MuSK",
  "FcRn",
  "C5 inhibitor",
  "post-marketing safety",
  "real-world evidence",
  "China access"
];

async function main() {
  for (const check of checks) {
    const data = await readJson(check.file);
    runCollectionCheck(data, check);
  }
  await checkLiteratureEnglish();
  await checkTerminology();

  for (const line of summary) console.log(line);
  for (const warning of warnings) console.warn(`warning: ${warning}`);

  if (errors.length) {
    for (const error of errors) console.error(`error: ${error}`);
    process.exit(1);
  }

  console.log("i18n-check: ok");
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(`${file}: cannot read or parse JSON (${error.message})`);
    return {};
  }
}

function runCollectionCheck(data, check) {
  const items = data[check.key] || [];
  if (!Array.isArray(items)) {
    errors.push(`${check.file}: ${check.key} must be an array`);
    return;
  }

  let complete = 0;
  for (const item of items) {
    const id = item.id || item.itemId || item.pmid || "unknown";
    const missing = missingEnglishFields(item, check);
    if (missing.length) {
      errors.push(`${check.file}: ${id} missing English fields: ${missing.join(", ")}`);
    } else {
      complete += 1;
    }
  }

  summary.push(`${check.file}: English coverage ${complete}/${items.length}`);
}

function missingEnglishFields(item, check) {
  const missing = [];
  for (const field of check.fields || []) {
    if (!hasEnglishValue(item, field)) missing.push(`en.${field}`);
  }
  for (const field of check.lists || []) {
    if (!Array.isArray(item.en?.[field]) || item.en[field].length === 0) missing.push(`en.${field}`);
  }
  for (const [parent, field] of check.nested || []) {
    const nested = item[parent];
    if (!nested?.en?.[field]) missing.push(`${parent}.en.${field}`);
  }
  for (const arrayCheck of check.arrays || []) {
    const rows = item[arrayCheck.key] || [];
    if (!Array.isArray(rows)) {
      missing.push(arrayCheck.key);
      continue;
    }
    rows.forEach((row, index) => {
      for (const field of arrayCheck.fields) {
        if (!row.en?.[field]) missing.push(`${arrayCheck.key}[${index}].en.${field}`);
      }
    });
  }
  return missing;
}

function hasEnglishValue(item, field) {
  const value = item.en?.[field];
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

async function checkLiteratureEnglish() {
  const files = ["data/latest-research.json", "data/china-research.json", "data/huashan-team.json"];
  for (const file of files) {
    const data = await readJson(file);
    const items = data.items || [];
    const withEnglishTitle = items.filter((item) => item.title && !looksMostlyChinese(item.title));
    const withEnglishAbstract = items.filter((item) => item.abstract && !looksMostlyChinese(item.abstract));
    summary.push(`${file}: English title ${withEnglishTitle.length}/${items.length}, abstract ${withEnglishAbstract.length}/${items.length}`);
    if (items.length && withEnglishTitle.length / items.length < 0.9) {
      warnings.push(`${file}: fewer than 90% of records have English titles`);
    }
    if (items.length && withEnglishAbstract.length / items.length < 0.6) {
      warnings.push(`${file}: fewer than 60% of records have English abstracts`);
    }
  }
}

async function checkTerminology() {
  const data = await readJson("data/terminology.json");
  const terms = data.terms || [];
  if (!Array.isArray(terms) || terms.length === 0) {
    errors.push("data/terminology.json: terms must be a non-empty array");
    return;
  }

  const keys = new Set();
  for (const term of terms) {
    if (!term.key) errors.push("data/terminology.json: term missing key");
    if (!term.zh) errors.push(`data/terminology.json: ${term.key || "unknown"} missing zh`);
    if (!term.en) errors.push(`data/terminology.json: ${term.key || "unknown"} missing en`);
    if (!term.category) warnings.push(`data/terminology.json: ${term.key || "unknown"} missing category`);
    if (term.key) keys.add(term.key);
  }

  for (const key of requiredTerminology) {
    if (!keys.has(key)) errors.push(`data/terminology.json: missing required term ${key}`);
  }
  summary.push(`data/terminology.json: ${terms.length} terms`);
}

function looksMostlyChinese(value = "") {
  const text = String(value);
  const chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
  return chinese > Math.max(8, text.length * 0.25);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
