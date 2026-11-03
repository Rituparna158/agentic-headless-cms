## Description

Briefly describe the changes in this PR.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Refactor (clean-up or architectural improvement with no functional change)
- [ ] Security fix / Vulnerability remediation
- [ ] Documentation update
- [ ] Style / UI change
- [ ] Build / CI / Tooling change

## Related Issue

Closes #<!-- issue number -->

## Changes Made

-
-
-

## DevSecOps & Security Review

- [ ] **No Secrets Exposed**: Verified no API keys, credentials, or private tokens are introduced (checked against Gitleaks/Trivy).
- [ ] **Auth Invariants Preserved**: Role, capability, and session guards verified (`RoleGuard`, `AdminOrSupportGuard`, JWT/cookie handling).
- [ ] **Data Sanitization**: All user inputs sanitized and DOMPurify applied for dynamic HTML/CSS templates.
- [ ] **Security Review Signoff**: Required if modifying auth, roles, cryptography, or security middleware.

## Bundle Impact & Performance

- [ ] **Bundle Analysis**: Evaluated build impact (run `pnpm build:analyze` for UI package dependency changes).
- [ ] **No Regressions**: No large un-treeshaken libraries added to client bundles.

## Accessibility (a11y) Audit

- [ ] **Keyboard Navigation**: Interactive elements are keyboard navigable and display clear focus indicators.
- [ ] **Semantic Markup**: Proper semantic HTML hierarchy and ARIA roles/labels provided where appropriate.
- [ ] **Color Contrast**: Compliant with WCAG AA contrast standards across dark and light palettes.

## Screenshots / Screen Recordings (if applicable)

<!-- Add before/after screenshots or screen recordings for UI changes -->

## Checklist

- [ ] My code follows the project's coding guidelines and architecture standards
- [ ] I have tested my changes locally (`pnpm test`, `pnpm check-types`, `pnpm lint`)
- [ ] I have used [conventional commit](https://www.conventionalcommits.org/) messages (`type(scope): message`)
- [ ] All commits are signed (`git commit -S`) where required by branch policy
- [ ] Unit / Integration / E2E tests added or updated to cover the changes
- [ ] Documentation updated to reflect changes (if applicable)
- [ ] No new compiler warnings, lint errors, or unhandled exceptions introduced
