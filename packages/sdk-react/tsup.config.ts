import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
  },
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'es2022',
  external: ['react', '@tanstack/react-query', '@mindfiredigital/sdk-core'],
  noExternal: ['@repo/types'],
});
