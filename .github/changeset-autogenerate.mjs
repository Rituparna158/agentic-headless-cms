import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Skip if a manual changeset file already exists (ignoring README.md)
if (fs.existsSync('.changeset')) {
  const existing = fs
    .readdirSync('.changeset')
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');
  if (existing.length > 0) {
    console.log('Changeset already exists in .changeset/, skipping generation');
    process.exit(0);
  }
}

// 2. Comprehensive Scope to Package Mapping
const SCOPE_PACKAGE_MAP = {
  // Applications
  backend: 'backend',
  frontend: 'frontend',
  'cms-ui': 'cms-ui',
  worker: 'worker',

  // Shared packages
  'shared-ui': '@mindfiredigital/shared-ui',
  ui: '@mindfiredigital/shared-ui',
  types: '@mindfiredigital/types',
  utils: '@mindfiredigital/utils',
  'shared-db': '@mindfiredigital/shared-db',
  db: '@mindfiredigital/shared-db',
  validation: '@mindfiredigital/validation',
  constants: '@mindfiredigital/constants',
  logger: '@mindfiredigital/logger',
  middlewares: '@mindfiredigital/middlewares',
  context: '@mindfiredigital/context',
  events: '@mindfiredigital/events',
  repository: '@mindfiredigital/repository',
  storage: '@mindfiredigital/storage',
  config: '@mindfiredigital/config',
  'plugin-sdk': '@mindfiredigital/plugin-sdk',
  'sdk-codegen': '@mindfiredigital/sdk-codegen',
  'sdk-core': '@mindfiredigital/sdk-core',
  'sdk-nextjs': '@mindfiredigital/sdk-nextjs',
  'sdk-node': '@mindfiredigital/sdk-node',
  'sdk-react': '@mindfiredigital/sdk-react',
  'typescript-config': '@mindfiredigital/typescript-config',
  'eslint-config': '@mindfiredigital/eslint-config',
};

// Helper: map modified file path to workspace package name
function getPackageFromFilePath(filePath) {
  if (filePath.startsWith('apps/backend/')) return 'backend';
  if (filePath.startsWith('apps/frontend/')) return 'frontend';
  if (filePath.startsWith('apps/cms-ui/')) return 'cms-ui';
  if (filePath.startsWith('apps/worker/')) return 'worker';

  const pkgMatch = filePath.match(/^packages\/([^/]+)\//);
  if (pkgMatch) {
    const pkgFolder = pkgMatch[1];
    return SCOPE_PACKAGE_MAP[pkgFolder] || `@mindfiredigital/${pkgFolder}`;
  }
  return null;
}

// 3. Read latest commit message (Subject + Body)
let commitMessage = '';
try {
  commitMessage = execSync('git log -1 --pretty=format:%B').toString().trim();
} catch (error) {
  console.error(' Failed to retrieve git commit message:', error.message);
  process.exit(1);
}

console.log(`Processing commit log:\n${commitMessage}\n`);

// 4. Parse Conventional Commits
const lines = commitMessage
  .split('\n')
  .map((l) => l.trim().replace(/^[-*]\s+/, ''))
  .filter(Boolean);

const packageChanges = new Map(); // Map<packageName, { type: 'major'|'minor'|'patch', descriptions: Set<string> }>

function recordChange(packageName, type, desc) {
  if (!packageName) return;
  const current = packageChanges.get(packageName) || {
    type: 'patch',
    descriptions: new Set(),
  };

  // Bump hierarchy: major > minor > patch
  if (type === 'major') {
    current.type = 'major';
  } else if (type === 'minor' && current.type !== 'major') {
    current.type = 'minor';
  }

  if (desc) current.descriptions.add(desc);
  packageChanges.set(packageName, current);
}

const CONVENTIONAL_REGEX =
  /^(feat|fix|refactor|perf|docs|style|chore|db)\(([^)]+)\)(!?):\s*(.+)/i;
const GENERIC_CONVENTIONAL_REGEX =
  /^(feat|fix|refactor|perf|docs|style|chore|db)(!?):\s*(.+)/i;

const isGlobalBreaking =
  /!:/.test(commitMessage) || commitMessage.includes('BREAKING CHANGE');

for (const line of lines) {
  const match = line.match(CONVENTIONAL_REGEX);
  if (match) {
    const [, typeStr, rawScope, breakingMark, rawDesc] = match;
    const isBreaking = Boolean(breakingMark) || isGlobalBreaking;

    let bumpType = 'patch';
    if (isBreaking) {
      bumpType = 'major';
    } else if (typeStr.toLowerCase() === 'feat') {
      bumpType = 'minor';
    }

    // Support comma-separated scopes: feat(types,shared-ui): ...
    const scopes = rawScope
      .split(/[,/]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    for (const scope of scopes) {
      const mappedPkg = SCOPE_PACKAGE_MAP[scope];
      if (mappedPkg) {
        recordChange(mappedPkg, bumpType, rawDesc.trim());
      } else if (['all', 'root', 'deps', 'release', 'ci', 'sdk'].includes(scope)) {
        // Broad scope -> detect touched packages from git diff
        try {
          const diffFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD')
            .toString()
            .trim()
            .split('\n');
          for (const file of diffFiles) {
            const pkg = getPackageFromFilePath(file);
            if (pkg) recordChange(pkg, bumpType, rawDesc.trim());
          }
        } catch {
          // ignore diff failure
        }
      }
    }
  } else {
    // Check generic commit without scope: "feat: add something"
    const genericMatch = line.match(GENERIC_CONVENTIONAL_REGEX);
    if (genericMatch) {
      const [, typeStr, breakingMark, rawDesc] = genericMatch;
      const isBreaking = Boolean(breakingMark) || isGlobalBreaking;
      const bumpType = isBreaking
        ? 'major'
        : typeStr.toLowerCase() === 'feat'
        ? 'minor'
        : 'patch';

      try {
        const diffFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD')
          .toString()
          .trim()
          .split('\n');
        for (const file of diffFiles) {
          const pkg = getPackageFromFilePath(file);
          if (pkg) recordChange(pkg, bumpType, rawDesc.trim());
        }
      } catch {
        // ignore diff failure
      }
    }
  }
}

// 5. Fallback: If no conventional commit matched, check touched packages from git diff
if (packageChanges.size === 0) {
  console.log(
    'No explicit scoped conventional commits found. Inspecting git diff...'
  );
  try {
    const diffFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD')
      .toString()
      .trim()
      .split('\n');

    const firstLine = lines[0] || 'Updates and improvements';
    for (const file of diffFiles) {
      const pkg = getPackageFromFilePath(file);
      if (pkg) {
        recordChange(pkg, 'patch', firstLine);
      }
    }
  } catch (err) {
    console.warn(' Could not inspect git diff:', err.message);
  }
}

// 6. Write Changeset files
if (packageChanges.size === 0) {
  console.log(' No package changes detected for release. Skipping changeset creation.');
  process.exit(0);
}

if (!fs.existsSync('.changeset')) {
  fs.mkdirSync('.changeset', { recursive: true });
}

for (const [pkg, info] of packageChanges.entries()) {
  const safePkgName = pkg.replace(/[^a-zA-Z0-9_-]/g, '-');
  const filename = `.changeset/auto-${Date.now()}-${safePkgName}.md`;

  const description =
    Array.from(info.descriptions).join('\n- ') || 'Updates and improvements';

  const content = `---
'${pkg}': ${info.type}
---

${description.startsWith('- ') ? description : `- ${description}`}
`;

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`Generated changeset: ${filename} → ${pkg} (${info.type})`);
}
