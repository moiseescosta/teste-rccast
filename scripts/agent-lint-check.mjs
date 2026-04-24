import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src"];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const FORBIDDEN_PATTERNS = [
  { name: "merge conflict marker", regex: /^<{7}|^={7}|^>{7}/m },
  { name: "debugger statement", regex: /\bdebugger\b/ },
];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
        continue;
      }
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (ALLOWED_EXTENSIONS.has(extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

async function main() {
  const targets = [];
  for (const dir of SCAN_DIRS) {
    targets.push(...(await collectFiles(join(ROOT, dir))));
  }

  const violations = [];
  for (const file of targets) {
    const content = await readFile(file, "utf8");
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.regex.test(content)) {
        violations.push(`${file}: found ${rule.name}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("agent-lint-check failed:");
    for (const v of violations) console.error(`- ${v}`);
    process.exit(1);
  }

  console.log(`agent-lint-check passed (${targets.length} files scanned).`);
}

main().catch((error) => {
  console.error("agent-lint-check crashed:", error);
  process.exit(1);
});
