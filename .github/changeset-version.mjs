import { execSync } from 'child_process';

console.log('Running changeset version...');
try {
  execSync('pnpm changeset version', { stdio: 'inherit' });
  console.log(' Changeset version completed.');

  console.log('Updating pnpm-lock.yaml...');
  execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' });
  console.log('pnpm-lock.yaml updated successfully.');
} catch (error) {
  console.error(
    'Error during changeset versioning or lockfile update:',
    error.message
  );
  process.exit(1);
}
