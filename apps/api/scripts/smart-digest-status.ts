/**
 * v0.6.4 — read-only smart digest operator status (no secrets, no LLM calls).
 * Usage: pnpm smart-digest:status
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { buildSmartDigestStatus } from '../src/smart-digest/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.resolve(__dirname, '../../../evidence');

function mainHead(): string {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: path.resolve(__dirname, '../../..'),
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

async function main() {
  const status = await buildSmartDigestStatus();
  const payload = {
    generatedAt: new Date().toISOString(),
    mainHead: mainHead(),
    status,
    realExternalCallExecuted: false,
    productionApiKeyUsed: false,
    operatorApprovalUsed: status.operatorApproved,
  };

  await fs.mkdir(evidenceDir, { recursive: true });
  const outPath = path.join(evidenceDir, 'v0.6.4-smart-digest-status.json');
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(JSON.stringify(payload, null, 2));
  console.error(`wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
