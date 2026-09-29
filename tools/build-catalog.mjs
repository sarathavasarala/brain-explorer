// Generates src/content/catalog.json for server-side schema construction and prompt context.
// Run: npm run catalog (or node tools/build-catalog.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { structures, anchors, chemicals, glossary, ROLES, VIEWS } from '../src/content/index.js';

export function generateCatalog() {
  return {
    structures: structures.map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline || '',
    })),
    anchors: anchors.map((a) => ({
      id: a.id,
      name: a.name,
    })),
    chemicals: chemicals.map((c) => ({
      id: c.id,
      name: c.name,
      group: c.group,
      tagline: c.tagline || '',
    })),
    glossary: Object.keys(glossary),
    roles: ROLES,
    views: VIEWS,
  };
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  const catalog = generateCatalog();
  const target = path.resolve(path.dirname(__filename), '../src/content/catalog.json');
  fs.writeFileSync(target, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Wrote catalog with ${catalog.structures.length} structures, ${catalog.anchors.length} anchors, ${catalog.chemicals.length} chemicals, ${catalog.glossary.length} glossary terms to ${target}`);
}
