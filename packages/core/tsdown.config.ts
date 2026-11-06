import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  target: 'node24',
  format: 'esm',
  fixedExtension: false,
  dts: { compilerOptions: { isolatedDeclarations: true } },
  sourcemap: true,
  deps: { onlyBundle: [], onlyImport: [] },
});
