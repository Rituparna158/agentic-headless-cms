---
name: 'Bug Report'
about: Structural layout to report an error, defect, or broken requirement in code.
title: '[Bug]: '
labels: bug
assignees: ''
---

## Title

Provide a clear title using the format: [BUG - Area/Module]: Brief action error description

## Description

Give a brief, high-level summary of the unexpected behavior or crash in plain human language.

## Problem Statement

Detail the exact error logs, unexpected data outputs, or broken SRS requirement metrics.

## Proposed Solution

If known, suggest the technical fix, patch, or configuration adjustment needed to resolve the bug.

## Acceptance Criteria

What conditions must be satisfied to prove this bug is 100% resolved and fixed?

- [ ] The reported error no longer triggers under the original reproduction steps.
- [ ] System handles the edge-case inputs gracefully without crashing.
- [ ] No regression bugs are introduced into the affected module boundaries.

## Technical Notes

Provide exact steps to reproduce, code snippets, endpoint routes, or steps to trigger the bug.
**Steps to Reproduce:**

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior:**
A clear description of what you expected to happen.

**Actual Behavior / Error Logs:**
What actually happened instead.

## Screenshots

If applicable, add screenshots to help explain the problem.

## Dependencies

List any open PRs, database migrations, or related environment issues that might be causing this bug.

## Out of Scope

Define what this bug fix will NOT touch (e.g., this fixes the API endpoint crash, not the UI styling).

## References

Reference the exact SRS Requirement IDs (e.g., FR-CM-5).

## Checklist

Pre-flight tasks the developer must execute before submitting their bug fix Pull Request.

- [ ] Bug fix has been verified locally across all targeted database adapters (Postgres/MySQL/SQLite).
- [ ] Regression testing confirms zero breaks in adjacent NestJS module layers.
- [ ] New unit or integration test added via Vitest to prevent this specific bug from returning.
