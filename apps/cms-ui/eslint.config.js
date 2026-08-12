import { config as reactInternal } from '@repo/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactInternal,
  {
    rules: {
      // additional project specific rules here
    },
  },
];
