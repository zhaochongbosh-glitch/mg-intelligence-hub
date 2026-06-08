import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const scanExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".xml"]);
const skipDirs = new Set([".git", "node_modules", ".codex", ".agents"]);
const skipFiles = new Set(["scripts/check-text-integrity.mjs"]);
const findings = [];

const suspiciousPatterns = [
  { name: "repeated question marks", regex: /\?{4,}/g },
  { name: "unicode replacement character", regex: /\uFFFD/g },
  { name: "common mojibake marker", regex: /\u951f\u65a4\u62f7/g },
  { name: "latin1-decoded utf8", regex: /(?:\u00c3.|\u00c2.|\u00e2\u20ac.|\u00e2\u20ac\u2122|\u00e2\u20ac\u0153|\u00e2\u20ac\ufffd|\u00e2\u20ac\u201c|\u00e2\u20ac\u201d)/g },
  { name: "gbk-decoded utf8 fragments", regex: /(?:\u9431|\u6d5c|\u6d93|\u95b2|\u9365|\u7ef1|\u95c2|\u4e68|\u20ac\?)/g },
  { name: "site-specific mojibake fragments", regex: /(?:\u942e|\u95c7|\u95c1|\u6d94|\u9350|\u7f01|\u93b4|\u9418|\u6957|\u8e47|\u8f70)/g }
];

await scan(root);

if (findings.length) {
  console.error("text-integrity: found suspicious mojibake or placeholder text");
  for (const item of findings) {
    console.error(`${item.file}:${item.line}: ${item.name}: ${item.sample}`);
  }
  process.exit(1);
}

console.log("text-integrity: ok");

async function scan(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) await scan(join(dir, entry.name));
      continue;
    }

    if (!scanExtensions.has(extname(entry.name))) continue;
    const file = join(dir, entry.name);
    const text = await readFile(file, "utf8");
    checkFile(file, text);
  }
}

function checkFile(file, text) {
  const relativeFile = file.replace(`${root}\\`, "").replaceAll("\\", "/");
  if (skipFiles.has(relativeFile)) return;
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const pattern of suspiciousPatterns) {
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(line);
      if (!match) continue;
      findings.push({
        file: relativeFile,
        line: index + 1,
        name: pattern.name,
        sample: line.trim().slice(0, 160)
      });
    }
  }
}
