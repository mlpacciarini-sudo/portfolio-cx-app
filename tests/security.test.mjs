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
      entry.name === "dist" ||
      entry.name === "playwright-report" ||
      entry.name === "test-results"
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
    /Authorization\s*:\s*["'`][^"'`]+["'`]/g,
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
          file: path.relative(ROOT, file),
          matches,
        });
      }
    }
  }

  assert.equal(
    findings.length,
    0,
    `Se encontraron posibles secretos hardcodeados:\n${JSON.stringify(
      findings,
      null,
      2
    )}`
  );
});

test("no hay archivos .env reales versionados", () => {
  const files = walk(ROOT);

  const envFiles = files.filter((file) => {
    const name = path.basename(file);

    return (
      name === ".env" ||
      (name.startsWith(".env.") && name !== ".env.example")
    );
  });

  assert.equal(
    envFiles.length,
    0,
    `Se encontraron archivos .env que no deberían estar versionados:\n${envFiles
      .map((file) => path.relative(ROOT, file))
      .join("\n")}`
  );
});

test(".env.example no contiene secretos reales", () => {
  const examplePath = path.join(ROOT, ".env.example");

  if (!fs.existsSync(examplePath)) {
    return;
  }

  const content = fs.readFileSync(examplePath, "utf8");

  const suspiciousPatterns = [
    /pk_[A-Za-z0-9_-]{10,}/g,
    /CLICKUP_API_TOKEN\s*=\s*(?!YOUR_|EXAMPLE_|PLACEHOLDER|$).+/g,
  ];

  const findings = [];

  for (const pattern of suspiciousPatterns) {
    const matches = content.match(pattern);

    if (matches) {
      findings.push(...matches);
    }
  }

  assert.equal(
    findings.length,
    0,
    `El archivo .env.example parece contener un secreto real:\n${findings.join(
      "\n"
    )}`
  );
});
