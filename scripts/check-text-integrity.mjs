import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const scanExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".xml"]);
const skipDirs = new Set([".git", "node_modules", ".codex", ".agents"]);
const skipFiles = new Set(["scripts/check-text-integrity.mjs"]);
const findings = [];

const suspiciousPatterns = [
  { name: "连续问号", regex: /\?{4,}/g },
  { name: "Unicode 替换字符", regex: /\uFFFD/g },
  { name: "锟斤拷乱码", regex: /锟斤拷/g },
  { name: "UTF-8/Latin-1 错读", regex: /(?:Ã.|Â.|â€.|â€™|â€œ|â€�|â€“|â€”)/g },
  { name: "中文 UTF-8 错读片段", regex: /(?:鐮|浜哄|鏂|鍏ュ|鍥㈤|鍗庡|绱㈠|閲嶇|乣|€\?)/g }
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
