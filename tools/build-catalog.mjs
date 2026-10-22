// Generates src/content/catalog.json and src/content/ai-contract.json.
// Run: npm run catalog (or node tools/build-catalog.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { structures, anchors, chemicals, glossary, ROLES, VIEWS } from '../src/content/index.js';
import { buildAiContract } from '../src/content/ai-contract.js';

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

export function generateAiContract() {
  return buildAiContract();
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  const catalog = generateCatalog();
  const contract = generateAiContract();
  const base = path.resolve(path.dirname(__filename), '../src/content');
  const catalogTarget = path.join(base, 'catalog.json');
  const contractTarget = path.join(base, 'ai-contract.json');
  fs.writeFileSync(catalogTarget, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(contractTarget, JSON.stringify(contract, null, 2) + '\n');
  console.log(`Wrote catalog with ${catalog.structures.length} structures, ${catalog.anchors.length} anchors, ${catalog.chemicals.length} chemicals, ${catalog.glossary.length} glossary terms to ${catalogTarget}`);
  console.log(`Wrote AI contract to ${contractTarget}`);
}
