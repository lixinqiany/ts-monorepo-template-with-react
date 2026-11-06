#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

type Manifest = {
  name: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  exports?: Record<string, string>;
};

const root = fileURLToPath(new URL('../', import.meta.url));
const help =
  'Optional setup: node scripts/init.ts --no-web\nRun before installing dependencies. The default template needs no setup.';

async function removeWeb(): Promise<void> {
  const read = (name: string) => readFile(join(root, name), 'utf8');
  const manifest = async (name: string): Promise<Manifest> =>
    JSON.parse(await read(name)) as Manifest;
  const hasWeb = existsSync(join(root, 'apps/web'));
  const hasUi = existsSync(join(root, 'packages/ui'));
  if (!hasWeb && !hasUi) {
    console.log('Web and UI are already absent; no files changed.');
    return;
  }
  if (!hasWeb || !hasUi)
    throw new Error(
      'Expected both apps/web and packages/ui. Use a fresh template checkout.',
    );
  if (existsSync(join(root, 'node_modules')))
    throw new Error('Run --no-web in a fresh template before pnpm install.');

  // Read and validate every input before modifying this checkout.
  for (const [name, expected] of [
    ['apps/server/package.json', '@repo/server'],
    ['apps/web/package.json', '@repo/web'],
    ['packages/ui/package.json', '@repo/ui'],
  ] as const) {
    if ((await manifest(name)).name !== expected)
      throw new Error(
        `Expected ${expected} in ${name}. Use a fresh template checkout.`,
      );
  }
  const updates = new Map<string, string>();
  const saveJson = (name: string, value: unknown) => {
    updates.set(name, `${JSON.stringify(value, null, 2)}\n`);
  };
  const workspace = await manifest('package.json');
  for (const name of ['dev:web', 'build:web', 'start:web'])
    delete workspace.scripts?.[name];
  saveJson('package.json', workspace);

  const lint = await manifest('packages/eslint-config/package.json');
  for (const name of [
    '@eslint-react/eslint-plugin',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
  ])
    delete lint.dependencies?.[name];
  delete lint.exports?.['./react'];
  saveJson('packages/eslint-config/package.json', lint);
  const typescript = await manifest('packages/typescript-config/package.json');
  delete typescript.exports?.['./react.json'];
  saveJson('packages/typescript-config/package.json', typescript);
  updates.set(
    'eslint.config.mjs',
    "import { createConfig } from '@repo/eslint-config';\n\nexport default createConfig(import.meta.dirname);\n",
  );

  // Preserve the formatting of the existing task graph while removing this env key.
  updates.set(
    'turbo.json',
    (await read('turbo.json'))
      .replace(/^ +"WEB_PORT",?\r?\n/gm, '')
      .replace(/, "WEB_PORT"/g, ''),
  );
  for (const name of [
    'README.md',
    'apps/server/README.md',
    'packages/eslint-config/README.md',
    'packages/typescript-config/README.md',
  ]) {
    updates.set(
      name,
      (await read(name)).replace(
        /<!-- web:start -->[\s\S]*?<!-- web:end -->\n*/g,
        '',
      ),
    );
  }
  const workflow = '.github/workflows/ci.yml';
  if (existsSync(join(root, workflow)))
    updates.set(
      workflow,
      (await read(workflow)).replace(
        'variant: [fullstack, server]',
        'variant: [server]',
      ),
    );

  for (const [name, content] of updates)
    await writeFile(join(root, name), content);
  for (const name of [
    'apps/web',
    'packages/ui',
    'packages/eslint-config/react.js',
    'packages/typescript-config/react.json',
  ]) {
    await rm(join(root, name), { recursive: true, force: true });
  }
  console.log(
    'Removed Web/UI and their configuration. Run pnpm install --no-frozen-lockfile to update the existing lockfile.',
  );
}

try {
  const { values } = parseArgs({
    options: {
      'no-web': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
    strict: true,
  });
  if (values.help || !values['no-web']) console.log(help);
  else await removeWeb();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
