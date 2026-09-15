# Changesets

Hello and welcome! This directory stores changeset entries generated for packages in this repository.

A changeset is an intentional, atomic description of a change made to packages in the monorepo, its semantic impact (`major`, `minor`, `patch`), and the changelog entry.

## How it works in this repo

- When PRs with Conventional Commits (e.g. `feat(shared-ui): ...`, `fix(backend): ...`) are merged into `main`, GitHub Actions automatically generates a changeset.
- You can also run `pnpm changeset` locally to manually create a changeset entry before opening a PR.
- Release PRs are automatically created and updated by Changesets on `main`.
