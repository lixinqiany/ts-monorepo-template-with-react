import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));
const hasFrontend = existsSync(join(source, 'apps/web'));
const excluded = new Set([
  '.git',
  'node_modules',
  'dist',
  '.dev',
  '.turbo',
  '.data',
  'coverage',
]);

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'ts-template-init-'));
  t.after(async () => {
    await rm(directory, { recursive: true, force: true });
  });
  const root = join(directory, 'project');
  await cp(source, root, {
    recursive: true,
    filter: (path) => !excluded.has(basename(path)),
  });
  return {
    root,
    read: (name: string) => readFile(join(root, name), 'utf8'),
    // Deliberately run outside the project: the script must target its own checkout.
    run: (...args: string[]) =>
      spawnSync(process.execPath, [join(root, 'scripts/init.ts'), ...args], {
        cwd: directory,
        encoding: 'utf8',
      }),
  };
}

await test('default setup and help leave the template unchanged', async (t) => {
  const project = await fixture(t);
  const before = await project.read('package.json');
  for (const args of [[], ['--help']]) {
    const result = project.run(...args);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await project.read('package.json'), before);
    assert.equal(existsSync(join(project.root, 'apps/web')), hasFrontend);
  }
});

await test('unknown options fail without changing the template', async (t) => {
  const project = await fixture(t);
  const before = await project.read('package.json');
  const result = project.run('--no-web', '--typo');
  assert.notEqual(result.status, 0);
  assert.equal(await project.read('package.json'), before);
  assert.equal(existsSync(join(project.root, 'apps/web')), hasFrontend);
});

await test(
  'no-web preserves the backend and portable build while removing frontend references',
  { skip: !hasFrontend },
  async (t) => {
    const project = await fixture(t);
    const preserved = [
      'apps/server/package.json',
      'apps/server/rspack.config.ts',
      'packages/core/package.json',
      'packages/core/src/index.ts',
      'scripts/build/dependencies.ts',
      'scripts/build/dist.ts',
      'pnpm-lock.yaml',
    ];
    const before = await Promise.all(
      preserved.map((name) => project.read(name)),
    );
    await writeFile(join(project.root, 'keep-me.txt'), 'unrelated content');
    const result = project.run('--no-web');
    assert.equal(result.status, 0, result.stderr);
    for (const name of [
      'apps/web',
      'packages/ui',
      'packages/eslint-config/react.js',
      'packages/typescript-config/react.json',
    ])
      assert.equal(existsSync(join(project.root, name)), false, name);
    for (const name of [
      'package.json',
      'packages/eslint-config/package.json',
      'packages/typescript-config/package.json',
      'eslint.config.mjs',
      'turbo.json',
    ]) {
      assert.doesNotMatch(
        await project.read(name),
        /@repo\/(?:web|ui)|(?:dev|build|start):web|eslint-plugin-react|@eslint-react|react\.json|\.\/react|WEB_PORT/,
        name,
      );
    }
    for (const name of ['README.md', 'apps/server/README.md'])
      assert.doesNotMatch(
        await project.read(name),
        /pnpm (?:dev|build|start):web|apps\/web|packages\/ui/,
      );
    assert.deepEqual(
      await Promise.all(preserved.map((name) => project.read(name))),
      before,
    );
    assert.equal(await project.read('keep-me.txt'), 'unrelated content');
  },
);

await test('no-web is idempotent', async (t) => {
  const project = await fixture(t);
  const first = project.run('--no-web');
  assert.equal(first.status, 0, first.stderr);
  const before = await project.read('package.json');
  const second = project.run('--no-web');
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already absent/);
  assert.equal(await project.read('package.json'), before);
});

await test(
  'installed projects are rejected before files are removed',
  { skip: !hasFrontend },
  async (t) => {
    const project = await fixture(t);
    await mkdir(join(project.root, 'node_modules'));
    const before = await project.read('package.json');
    const result = project.run('--no-web');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /before pnpm install/);
    assert.equal(existsSync(join(project.root, 'apps/web')), true);
    assert.equal(await project.read('package.json'), before);
  },
);

await test(
  'incomplete templates fail before changing configuration',
  { skip: !hasFrontend },
  async (t) => {
    const project = await fixture(t);
    const before = await project.read('package.json');
    await rm(join(project.root, 'packages/ui'), { recursive: true });
    const result = project.run('--no-web');
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(join(project.root, 'apps/web')), true);
    assert.equal(await project.read('package.json'), before);
  },
);
