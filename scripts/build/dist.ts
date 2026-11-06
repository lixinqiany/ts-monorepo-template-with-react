import { existsSync } from 'node:fs';
import { chmod, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { writeWantedLockfile, type LockfileObject } from '@pnpm/lockfile.fs';
import { pruneSharedLockfile } from '@pnpm/lockfile.pruner';
import type { ProjectId } from '@pnpm/types';
import { parse, stringify } from 'yaml';
import { getRuntimeDependencies } from './dependencies.ts';

/** Called after compilation. No installs or fresh dependency resolution happen during builds. */
export async function prepareDist(
  projectDirectory: string,
  entry: string,
): Promise<void> {
  if (
    isAbsolute(entry) ||
    entry.split(/[\\/]/).includes('..') ||
    !entry.endsWith('.js')
  ) {
    throw new Error('The entry must be a JavaScript file inside dist.');
  }
  const output = join(projectDirectory, 'dist');
  if (!existsSync(join(output, entry)))
    throw new Error(`Build the entry before preparing dist: ${entry}`);

  const { root, manifest, rootManifest, lockfile, importer } =
    await getRuntimeDependencies(projectDirectory);
  const settings = parse(
    await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8'),
  ) as Record<string, unknown>;
  if (lockfile.patchedDependencies || lockfile.pnpmfileChecksum) {
    throw new Error(
      'Distribution packaging must be extended to carry patches or pnpmfile hooks before using them.',
    );
  }

  const dependencies = (refs: Record<string, string> | undefined) =>
    Object.fromEntries(
      Object.keys(refs ?? {})
        .sort()
        .map((name) => [name, importer.specifiers[name]]),
    );

  const runtimeManifest = {
    name: manifest.name,
    version: manifest.version,
    private: true,
    type: 'module',
    description: manifest.description,
    license: manifest.license ?? rootManifest.license,
    engines: manifest.engines ?? rootManifest.engines,
    packageManager: rootManifest.packageManager,
    main: `./${entry}`,
    ...(manifest.bin
      ? {
          bin: Object.fromEntries(
            Object.keys(manifest.bin).map((name) => [name, `./${entry}`]),
          ),
        }
      : {}),
    scripts: { start: `node --enable-source-maps ${entry}` },
    dependencies: dependencies(importer.dependencies),
    optionalDependencies: dependencies(importer.optionalDependencies),
  };

  const dedicatedLockfile: LockfileObject = pruneSharedLockfile(
    {
      ...structuredClone(lockfile),
      importers: { ['.' as ProjectId]: importer },
    },
    {
      warn(message) {
        throw new Error(message);
      },
    },
  );
  // Catalogs belong to the source workspace; dist contains concrete dependency specifiers.
  delete dedicatedLockfile.catalogs;

  // This marker prevents pnpm from discovering the source workspace when installing in-place.
  const installSettings = {
    packages: [],
    autoInstallPeers: lockfile.settings?.autoInstallPeers ?? true,
    excludeLinksFromLockfile:
      lockfile.settings?.excludeLinksFromLockfile ?? false,
    ...Object.fromEntries(
      [
        'allowBuilds',
        'supportedArchitectures',
        'minimumReleaseAge',
        'minimumReleaseAgeExclude',
        'minimumReleaseAgeStrict',
        'overrides',
      ]
        .filter((key) => settings[key] !== undefined)
        .map((key) => [key, settings[key]]),
    ),
  };

  await writeFile(
    join(output, 'package.json'),
    `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  );
  await writeWantedLockfile(output, dedicatedLockfile);
  await writeFile(
    join(output, 'pnpm-workspace.yaml'),
    stringify(installSettings),
  );
  const assets = join(projectDirectory, 'assets');
  if (existsSync(assets))
    await cp(assets, join(output, 'assets'), { recursive: true });
  if (existsSync(join(root, 'LICENSE')))
    await copyFile(join(root, 'LICENSE'), join(output, 'LICENSE'));
  if (manifest.bin) await chmod(join(output, entry), 0o755);
}
