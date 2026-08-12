import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config';
import rootConfig from '../../vitest.config';

export default mergeConfig(
  viteConfig,
  mergeConfig(
    rootConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
        css: true,
      },
    }),
  ),
);
