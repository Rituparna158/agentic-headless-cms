export default {
  'apps/cms-ui/**/*.{js,jsx,ts,tsx}': (filenames) => [
    'pnpm --filter cms-ui lint',
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  'apps/backend/**/*.{js,ts}': (filenames) => [
    'pnpm --filter backend lint',
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  'apps/frontend/**/*.{js,jsx,ts,tsx}': (filenames) => [
    'pnpm --filter frontend lint',
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  'packages/**/*.{js,jsx,ts,tsx}': (filenames) => [
    'turbo run lint',
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  '**/*.{json,md}': (filenames) => [
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
};
