import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'nx-serverless-bff-contract-'));
const temporaryOutput = join(temporaryDirectory, 'generated.ts');
const committedOutput = resolve(root, 'libs/api-contract/src/generated.ts');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

try {
  const result = spawnSync(
    pnpm,
    [
      'exec',
      'openapi-typescript',
      'libs/api-contract/openapi/customer-offers-bff.openapi.yml',
      '--output',
      temporaryOutput,
    ],
    { cwd: root, stdio: 'inherit' },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (readFileSync(committedOutput, 'utf8') !== readFileSync(temporaryOutput, 'utf8')) {
    console.error('Generated contract types are stale. Run: pnpm contract:generate');
    process.exit(1);
  }
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
