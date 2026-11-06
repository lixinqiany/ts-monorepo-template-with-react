import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { readWantedLockfile, type ProjectSnapshot } from '@pnpm/lockfile.fs';
import type { PackageManifest, ProjectId } from '@pnpm/types';

type Manifest = PackageManifest & { packageManager?: string };

function findWorkspaceRoot(directory: string): string {
  let current = resolve(directory);
  while (!existsSync(join(current, 'pnpm-workspace.yaml'))) {
    const parent = dirname(current);
    if (parent === current)
      throw new Error(`No pnpm workspace found for ${directory}`);
    current = parent;
  }
  return current;
}

async function readManifest(directory: string): Promise<Manifest> {
  return JSON.parse(
    await readFile(join(directory, 'package.json'), 'utf8'),
  ) as Manifest;
}

/** Bundle workspace code; preserve the exact registry resolutions of its runtime dependencies. */
export async function getRuntimeDependencies(projectDirectory: string) {
  const root = findWorkspaceRoot(projectDirectory);
  const lockfile = await readWantedLockfile(root, {
    ignoreIncompatible: false,
  });
  if (!lockfile) throw new Error('Run pnpm install before building.');

  const manifest = await readManifest(projectDirectory);
  const bundledPackages = new Set<string>();
  const visited = new Set<string>();
  const importer: ProjectSnapshot = {
    specifiers: {},
    dependencies: {},
    optionalDependencies: {},
  };

  async function visit(directory: string, optional = false): Promise<void> {
    const visitKey = `${directory}:${String(optional)}`;
    if (visited.has(visitKey)) return;
    visited.add(visitKey);
    const source = await readManifest(directory);
    const id = (relative(root, directory).split(sep).join('/') ||
      '.') as ProjectId;
    const sourceImporter = lockfile?.importers[id];
    if (!sourceImporter) throw new Error(`Missing lockfile importer: ${id}`);

    for (const [name, specifier] of Object.entries({
      ...source.dependencies,
      ...source.optionalDependencies,
    })) {
      const ref =
        sourceImporter.optionalDependencies?.[name] ??
        sourceImporter.dependencies?.[name];
      if (!ref || sourceImporter.specifiers[name] !== specifier) {
        throw new Error(
          `Lockfile is outdated for ${source.name}: ${name}. Run pnpm install.`,
        );
      }
      const isOptional =
        optional || source.optionalDependencies?.[name] !== undefined;
      if (ref.startsWith('link:') && specifier.startsWith('workspace:')) {
        bundledPackages.add(name);
        await visit(resolve(directory, ref.slice(5)), isOptional);
        continue;
      }
      if (/^(?:workspace:|link:|file:|catalog:)/.test(specifier)) {
        throw new Error(
          `Use a registry dependency or workspace package for ${name}: ${specifier}`,
        );
      }
      const previous =
        importer.dependencies?.[name] ?? importer.optionalDependencies?.[name];
      if (previous && previous !== ref) {
        throw new Error(
          `Bundled workspaces require conflicting versions of ${name}. Align their dependencies first.`,
        );
      }
      // A required path wins when an optional dependency is also required elsewhere.
      if (!isOptional || importer.dependencies?.[name]) {
        importer.dependencies![name] = ref;
        delete importer.optionalDependencies![name];
      } else {
        importer.optionalDependencies![name] = ref;
      }
      importer.specifiers[name] ??= specifier;
    }
  }

  await visit(resolve(projectDirectory));
  return {
    root,
    manifest,
    rootManifest: await readManifest(root),
    lockfile,
    importer,
    bundledPackages: [...bundledPackages],
  };
}
