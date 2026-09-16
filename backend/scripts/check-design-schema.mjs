import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const designTs = readFileSync(join(root, "../src/constants/design.ts"), "utf8");
assert.match(designTs, /DESIGN_SCHEMA_VERSION\s*=\s*10/);
console.log("backend design schema version contract: 10");
