---
id: access-control
title: Access Control and RBAC Guide
sidebar_label: Access Control & RBAC
---

# Access Control and RBAC Guide

CMS UI implements enterprise-grade identity management, Role-Based Access Control (RBAC), and Multi-Factor Authentication (MFA) to protect content and administrative operations.

---

## Authentication and Sessions

CMS UI uses secure, cookie-based session management managed by the backend API:

- **HTTP-Only Cookies**: Authentication tokens are stored in secure, SameSite HTTP-only cookies, preventing token theft via client-side JavaScript (XSS attacks).
- **Session Hydration**: On application load, the `AuthHydrator` component executes a session verification request (`GET /api/v1/auth/me`).
- **Reactive State**: The client session state transitions seamlessly (`idle`, `loading`, `authenticated`, `unauthenticated`, `mfa_challenge_required`) without layout flashing.

---

## Roles and Capabilities

The platform uses a capability-based authorization model:

| Role       | Default Capabilities                              | Description                                                                             |
| ---------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Admin**  | Superadmin bypass (all capabilities)              | Full system administration, schema configuration, user management, and audit inspection |
| **Editor** | `manage_content`, `publish_content`, `view_audit` | Can create, edit, rollback, and publish entries across all collections                  |
| **Author** | `create_content`, `edit_own_content`              | Can draft and edit their own assigned entries; cannot publish directly                  |

### Route Guard Architecture

CMS UI enforces access control at the router level via React guard components:

- **`AuthGuard`**: Redirects unauthenticated users to the `/login` screen while preserving the intended destination URL.
- **`RoleGuard`**: Validates whether the active user possesses the required capability for the route (such as schema management). Unauthorized users are redirected to an Access Denied view.
- **`AdminOrSupportGuard`**: Restricts sensitive administrative workflows (such as MFA reset requests and system configuration).

---

## Multi-Factor Authentication (MFA)

All administrative and editorial accounts can be protected with Time-based One-Time Passwords (TOTP):

1. **Enrollment**: Users can enable MFA from the **Security Settings** page by scanning a generated QR code into any standard authenticator app (Google Authenticator, Authy, or 1Password).
2. **Challenge Verification**: On login, users with MFA enabled are prompted for a 6-digit TOTP verification code before being granted a session.
3. **MFA Reset Requests**: If an administrator or editor loses their authenticator device, they can submit an MFA reset request. Privileged administrators can review and approve or reject reset requests under **Settings → MFA Requests**.

---

## User Management and Invitations

Administrators can invite new team members directly from **Settings → Users**:

1. Click **Invite User**.
2. Enter the recipient's email address and assign an initial role (`Editor` or `Author`).
3. An invitation token is generated, allowing the user to set their password and complete their profile upon first visit.
4. User status (`Active`, `Invited`, `Suspended`) can be modified at any time.

---

## Next Steps

- [Audit Logs and Governance](/cms-ui/docs/guides/audit-logs)
- [Collections and Schemas Guide](/cms-ui/docs/guides/collections-and-schemas)
- [Installation and Setup](/cms-ui/docs/getting-started/installation)
