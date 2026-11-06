import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type RuntimeMode = 'development' | 'production';

export function getDataDirectory(mode: RuntimeMode): string {
  if (process.env.DATA_DIR) return resolve(process.env.DATA_DIR);
  // Defaults are module-relative; independently deployed apps keep separate data.
  return fileURLToPath(
    mode === 'development'
      ? new URL('../../../.data/', import.meta.url)
      : new URL('./data/', import.meta.url),
  );
}

export async function prepareDataDirectory(mode: RuntimeMode): Promise<string> {
  const directory = getDataDirectory(mode);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  return directory;
}
