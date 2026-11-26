export default {
  'apps/backend/**/*.{js,ts}': (filenames) => [
    `eslint --fix ${filenames.map((f) => `"${f}"`).join(' ')}`,
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  'apps/frontend/**/*.{js,jsx,ts,tsx}': (filenames) => [
    `eslint --fix ${filenames.map((f) => `"${f}"`).join(' ')}`,
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  'packages/**/*.{js,jsx,ts,tsx}': (filenames) => [
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  '**/*.{json,md}': (filenames) => [
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
};
