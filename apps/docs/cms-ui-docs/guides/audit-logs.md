---
id: audit-logs
title: Audit Logs and Governance Guide
sidebar_label: Audit Logs
---

# Audit Logs and Governance Guide

Agentic Headless CMS provides a tamper-evident audit logging system accessible directly within CMS UI. Every administrative action, authentication attempt, content mutation, and schema alteration is recorded as an immutable audit record for compliance and accountability.

---

## Accessing Audit Logs

1. In the CMS UI sidebar, navigate to **Audit Logs**.
2. Privileged users (such as administrators and security auditors) can browse the event stream.
3. The dashboard displays the most recent activities with pagination and real-time refresh.

---

## Logged Event Types

The audit engine tracks all critical lifecycle operations across the platform:

| Category             | Action Types                                                                | Description                                                          |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Authentication**   | `auth.login`, `auth.logout`, `auth.mfa_challenge`, `auth.password_reset`    | User sign-ins, failed attempts, and MFA verifications                |
| **Content Mutation** | `entry.create`, `entry.update`, `entry.delete`, `entry.publish`             | Changes made to collection entries and marketing pages               |
| **Version Rollback** | `version.restore`, `version.snapshot_created`                               | Historical revisions created or restored                             |
| **Schema Changes**   | `schema.create`, `schema.update`, `schema.field_add`, `schema.field_remove` | Alterations to content models, data types, and field options         |
| **Access Control**   | `user.invite`, `user.role_change`, `mfa.reset_requested`                    | Role assignments, user permission updates, and administrative resets |

---

## Audit Record Details

Each entry in the audit trail contains forensic information:

- **Timestamp**: Precise ISO 8601 UTC timestamp.
- **Actor Attribution**: Email and unique user ID of the account that performed the action (or system tag for automated tasks).
- **Application Context**: Extracted from the `X-App-Id` header (such as `CMS_UI` or `MCP_AGENT`).
- **IP Address and User Agent**: Client network address and browser fingerprint.
- **Payload Delta**: Before-and-after JSON state comparison showing the exact fields that were added, modified, or removed.

---

## Filtering and Search

The Audit Log viewer provides multi-criteria filtering:

- **Action Filter**: Isolate specific operations (such as viewing only `entry.publish` or `auth.login` events).
- **Actor Filter**: Search for all events performed by a specific user email.
- **Date Range**: Filter events within specific time windows.

---

## Next Steps

- [Access Control and RBAC](/cms-ui/docs/guides/access-control)
- [Version History and Rollback](/cms-ui/docs/guides/version-history)
- [Introduction to CMS UI](/cms-ui/docs/getting-started/introduction)
