# How to Contribute

We are thrilled that you are interested in contributing to Agentic Headless CMS\! Your contributions are invaluable in making this project better for everyone. This guide will walk you through the entire process, from setting up your environment to submitting a high-quality pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Finding Something to Work On](#finding-something-to-work-on)
- [Contribution Workflow](#contribution-workflow)
  - [1. Setup Your Environment](#1-setup-your-environment)
  - [2. Create a Branch](#2-create-a-branch)
  - [3. Write Unit Tests](#6-write-unit-tests)
  - [4. Commit and Push Your Changes](#7-commit-and-push-your-changes)
  - [5. Create a Pull Request](#8-create-a-pull-request)
- [Code Review Process](#code-review-process)
- [Licensing](#licensing)

---

## Code of Conduct

We are committed to fostering a welcoming and inclusive community. Before contributing, please take a moment to review our [Code of Conduct](https://www.google.com/search?q=./CODE_OF_CONDUCT.md).

---

## Finding Something to Work On

1.  **Explore the Issues:** Head over to our [issue tracker](https://github.com/mindfiredigital/agentic-headless-cms/issues). This is the best place to find tasks.
2.  **Good First Issues:** Look for issues tagged with `good first issue` or `help wanted`. These are specifically prepared for new contributors.
3.  **Propose a New Feature:** If you have an idea for a new component or feature, please **open an issue first**. This allows us to discuss the feature and make sure it aligns with the project's goals before you start working on it.

---

## Contribution Workflow

### 1. Setup Your Environment

First, get the project running on your local machine.

- **Check prerequisites:** Node.js >= 20.9.0, pnpm, and **Redis >= 5.0.0** (required by the backend's BullMQ job queue — older versions lack the Redis Streams support BullMQ depends on, and will crash the backend on startup). Use the `redis` service in the root `docker-compose.yml` (`redis:7-alpine`) if you don't already have a compatible local instance — on Windows, Docker Desktop, WSL2, or Memurai are the recommended ways to run a modern Redis.
- **Fork the repository:** Click the "Fork" button at the top-right of the [Agentic Headless CMS repository](https://github.com/mindfiredigital/agentic-headless-cms).
- **Clone your forked repository:**
  ```bash
  git clone https://github.com/mindfiredigital/agentic-headless-cms
  cd agentic-headless-cms
  ```
- **Install dependencies:** This project uses `pnpm` as its package manager.
  ```bash
  pnpm install
  ```

### 2. Create a Branch

Create a new branch for your changes. A descriptive name helps us understand what you're working on.

- For new features: `feature/short-feature-description`
- For bug fixes: `fix/short-bug-description`

<!-- end list -->

```bash
# Example for a new feature
git checkout -b feature/add-reader-component

# Example for a bug fix
git checkout -b fix/button-alignment-issue
```

### 6. Write Unit Tests

We require tests for all new features to maintain code quality.

- Add test cases for your component in a file located alongside the component source code.
- Ensure all tests pass before submitting your changes.
  ```bash
  pnpm vitest
  ```

### 7. Commit and Push Your Changes

- **Stage and Commit:** Add your changes and write a clear, descriptive commit message that follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification and the project scopes defined in `commitlint.config.cjs` (e.g. `cms-ui`, `backend`, `frontend`, `shared-ui`, `types`, `db`, `root`).

  ```bash
  git add .
  git commit -m "feat(cms-ui): add dynamic post management page"
  ```

- **Signed Commits (Required by Branch Protection):**
  We enforce signed commits on protected branches (`main`, `development`) to verify author authenticity.
  1. Generate a GPG or SSH signing key:
     ```bash
     # For SSH signing:
     git config --global gpg.format ssh
     git config --global user.signingkey ~/.ssh/id_ed25519.pub
     git config --global commit.gpgsign true
     ```
  2. Or sign individual commits using the `-S` flag:
     ```bash
     git commit -S -m "feat(cms-ui): add dynamic post management page"
     ```

- **Push to Your Fork:**
  ```bash
  git push origin feature/my-feature-name
  ```

### 8. Create a Pull Request

- Go to your forked repository on GitHub and click "Compare & pull request".
- Set the base branch to `development` (or `main` for hotfixes).
- Fill out the Pull Request (PR) template with all the required DevSecOps, accessibility, and testing information.
- Click "Create pull request" to submit it for review.

---

## Branch Protection & Required Status Checks

To ensure stability and security, direct pushes to `main` and `development` are disabled. All merges require:

1. **Pull Request with Review**: At least 1 approving review from code owners/maintainers.
2. **Passing CI Pipeline**:
   - `Commit & PR Title Lint` (commitlint validates conventional format and valid monorepo scopes)
   - `Security & Secret Scan` (Gitleaks secret scanner & Trivy vulnerability scanner)
   - `Build & Test` (Turbo build, type checking, ESLint, and Vitest test suite)
   - `E2E Tests` (Playwright end-to-end tests against real database)
3. **Signed Commits**: All commits in the PR must be cryptographically signed (`Verified` badge on GitHub).
4. **Up-to-date Branch**: Branches must be rebased or merged with latest `development` before merging.

---

## Pull Request Scope Guidelines

To keep reviews fast, focused, and fair for everyone, we enforce **small and scoped pull requests**.

Please follow these rules strictly:

- **One feature/component per PR**
  - A PR must introduce or modify **only one feature or component**.
  - Do not bundle multiple components into a single PR.

- **One fix per PR**
  - Bug-fix PRs must address **only one bug or issue**.
  - Even if fixes are related, they must be split into separate PRs.

- **Minimal file changes**
  - Avoid touching unrelated files (formatting, refactors, renames, or cleanups).
  - If a change is not required for your component or fix, it does not belong in the PR.

PRs that modify multiple components, bundle multiple fixes, or include unrelated changes **will be requested to split or may be closed without review**.

---

## Code Review Process

- Once your PR is submitted, one or more maintainers will review it.
- If changes are requested, simply make the updates on your branch and push them. Your PR will update automatically.
- Once the PR is approved and all CI checks pass, a maintainer will merge it. Congratulations! 🎉

---

## Licensing

By contributing to Agentic Headless CMS, you agree that your contributions will be licensed under the project's MIT License.
