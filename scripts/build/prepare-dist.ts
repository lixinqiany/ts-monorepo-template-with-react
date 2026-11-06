#!/usr/bin/env node
import { prepareDist } from './dist.ts';

const entry = process.argv[2];
if (!entry || process.argv.length !== 3) {
  throw new Error('Usage: node scripts/build/prepare-dist.ts <entry.js>');
}

await prepareDist(process.cwd(), entry);
