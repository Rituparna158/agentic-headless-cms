import { execSync } from 'child_process';
import fs from 'fs';

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

// 2. Official Public SDK Package Mapping (exclusive to @mindfiredigital SDKs)
const SDK_PACKAGE_MAP = {
  'sdk-codegen': '@mindfiredigital/sdk-codegen',
  'sdk-core': '@mindfiredigital/sdk-core',
  'sdk-nextjs': '@mindfiredigital/sdk-nextjs',
  'sdk-node': '@mindfiredigital/sdk-node',
  'sdk-react': '@mindfiredigital/sdk-react',

  // Common aliases used in commit scopes
  codegen: '@mindfiredigital/sdk-codegen',
  core: '@mindfiredigital/sdk-core',
  nextjs: '@mindfiredigital/sdk-nextjs',
  next: '@mindfiredigital/sdk-nextjs',
  node: '@mindfiredigital/sdk-node',
  react: '@mindfiredigital/sdk-react',
};

const ALL_PUBLIC_SDKS = [
  '@mindfiredigital/sdk-core',
  '@mindfiredigital/sdk-node',
  '@mindfiredigital/sdk-react',
  '@mindfiredigital/sdk-nextjs',
  '@mindfiredigital/sdk-codegen',
];

// 3. Read latest commit message (Subject + Body)
let commitMessage = '';
try {
  commitMessage = execSync('git log -1 --pretty=format:%B').toString().trim();
} catch (error) {
  console.error('Failed to retrieve git commit message:', error.message);
  process.exit(1);
}

console.log(`Processing commit log:\n${commitMessage}\n`);

// 4. Parse Conventional Commits strictly by scope
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

    // Support comma-separated and slash-separated scopes:
    // e.g., feat(sdk-node,sdk-nextjs): ... or feat(node/nextjs): ...
    const scopes = rawScope
      .split(/[,/]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    for (const scope of scopes) {
      const mappedPkg = SDK_PACKAGE_MAP[scope];
      if (mappedPkg) {
        recordChange(mappedPkg, bumpType, rawDesc.trim());
      } else if (scope === 'sdk') {
        // Explicit umbrella scope -> bumps all 5 public SDK packages together
        for (const sdkPkg of ALL_PUBLIC_SDKS) {
          recordChange(sdkPkg, bumpType, rawDesc.trim());
        }
      }
    }
  }
}

// 5. Write Changeset files strictly for identified scopes
if (packageChanges.size === 0) {
  console.log(
    'No SDK package scopes detected in commit. Skipping changeset creation.',
  );
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
