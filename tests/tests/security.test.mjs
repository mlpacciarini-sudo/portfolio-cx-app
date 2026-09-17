import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist"
    ) {
      return [];
    }

    if (entry.isDirectory()) {
      return walk(full);
    }

    return [full];
  });
}

test("no hay secretos hardcodeados en el repositorio", () => {
  const files = walk(ROOT);

  const forbiddenPatterns = [
    /pk_[A-Za-z0-9_-]{10,}/g,
    /CLICKUP_API_TOKEN\s*=\s*.+/g,
    /Authorization\s*:\s*["'`].+["'`]/g,
  ];

  const findings = [];

  for (const file of files) {
    const ext = path.extname(file);

    if (
      ![
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".ts",
        ".tsx",
        ".json",
        ".yml",
        ".yaml",
        ".env",
      ].includes(ext)
    ) {
      continue;
    }

    const content = fs.readFileSync(file, "utf8");

    for (const pattern of forbiddenPatterns) {
      const matches = content.match(pattern);

      if (matches) {
        findings.push({
          file,
          matches,
        });
      }
    }
  }

  assert.equal(
    findings.length,
    0,
    `Se encontraron posibles secretos:\n${JSON.stringify(findings, null, 2)}`
  );
});

test("no hay archivos .env versionados", () => {
  const files = walk(ROOT);

  const envFiles = files.filter((file) => {
    const name = path.basename(file);
    return name === ".env" || name.startsWith(".env.");
  });

  assert.equal(
    envFiles.length,
    0,
    `Se encontraron archivos .env en el repo:\n${envFiles.join("\n")}`
  );
});
