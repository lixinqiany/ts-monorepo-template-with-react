import { parseArgs } from 'node:util';
import { prepareDataDirectory, type RuntimeMode } from '@repo/core';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap(options: { mode: RuntimeMode }) {
  // No runtime mode flag: unknown options (including --dev) fail before startup.
  parseArgs({ options: {}, allowPositionals: false });
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT 必须是 1–65535 之间的整数。');
  }
  const dataDirectory = await prepareDataDirectory(options.mode);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(port, '127.0.0.1');
  Logger.log(`http://127.0.0.1:${port}/api`, 'Bootstrap');
  Logger.log(`Data directory: ${dataDirectory}`, 'Bootstrap');
  return app;
}
