import { createConfig } from '@repo/eslint-config';
import { reactConfig } from '@repo/eslint-config/react';

export default createConfig(import.meta.dirname, reactConfig);
