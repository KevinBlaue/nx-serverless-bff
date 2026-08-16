import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '../../..');
const output = resolve(root, 'dist/apps/customer-offers-bff');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function run(args) {
  const result = spawnSync(pnpm, args, { cwd: root, stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(['exec', 'tsc', '-p', 'apps/customer-offers-bff/tsconfig.app.json', '--noEmit']);

rmSync(output, { force: true, recursive: true });
mkdirSync(output, { recursive: true });

await build({
  bundle: true,
  entryPoints: [resolve(root, 'apps/customer-offers-bff/src/functions/get-offers/handler.ts')],
  format: 'cjs',
  minify: true,
  outfile: resolve(output, 'get-offers.cjs'),
  platform: 'node',
  sourcemap: false,
  target: 'node24',
  tsconfig: resolve(root, 'tsconfig.base.json'),
});
