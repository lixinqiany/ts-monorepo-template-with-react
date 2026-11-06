import { isBuiltin } from 'node:module';
import { basename, isAbsolute, resolve } from 'node:path';
import { getRuntimeDependencies } from '../../scripts/build/dependencies.ts';
import type { Configuration } from '@rspack/core';

const { importer, bundledPackages } = await getRuntimeDependencies(
  import.meta.dirname,
);
const external = new Set(Object.keys(importer.specifiers));

export default function configure(options: Configuration): Configuration {
  if (typeof options.entry !== 'string') {
    throw new Error('Expected Nest to provide a single entry file.');
  }
  const development = basename(options.entry) === 'dev.ts';
  return {
    ...options,
    entry: resolve(import.meta.dirname, development ? 'dev.ts' : 'src/main.ts'),
    output: {
      ...options.output,
      path: resolve(import.meta.dirname, development ? '.dev' : 'dist'),
      filename: development ? 'dev.js' : 'main.js',
      chunkFilename: '[name].[contenthash].js',
    },
    module: {
      ...options.module,
      // Node resolves runtime files relative to the emitted module, not the source checkout.
      parser: { javascript: { importMeta: false, url: false } },
    },
    // Keep Nest's SWC decorator metadata and ESM defaults. Only workspace code is bundled.
    externals: [
      ({ request }, callback) => {
        if (!request || request.startsWith('.') || isAbsolute(request))
          return callback();
        const name = request
          .split('/')
          .slice(0, request.startsWith('@') ? 2 : 1)
          .join('/');
        if (bundledPackages.includes(name)) return callback();
        if (isBuiltin(request) || external.has(name))
          return callback(null, `module ${request}`);
        return callback(new Error(`Undeclared runtime dependency: ${request}`));
      },
    ],
  };
}
