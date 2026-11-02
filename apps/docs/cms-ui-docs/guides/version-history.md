---
id: version-history
title: Version History and Rollback Guide
sidebar_label: Version History
---

# Version History and Rollback Guide

CMS UI includes automated versioning and rollback capabilities. Every time an entry or page layout is saved or published, a point-in-time snapshot is recorded in PostgreSQL, ensuring that content teams can audit changes, compare revisions, and recover from accidental deletions or regressions.

---

## Snapshot Lifecycle

Snapshots are triggered automatically by the system under several conditions:

- **Manual Save**: Clicking **Save Draft** writes an immutable revision record.
- **Publish Action**: Publishing an entry creates a tagged release snapshot.
- **Autosave Recovery**: Local draft states are tagged before promoting back into the database.

Each snapshot stores:

- Sequential version number (such as `v22`, `v21`)
- Timestamp of creation
- Actor email and user ID who made the modification
- Publication status at the time of the snapshot
- Full serialized state (including structured schema field data and GrapesJS canvas layout trees)

---

## Viewing Past Revisions

1. Open any page or collection entry in the editor.
2. In the top bar or side drawer, click the **Version History** icon.
3. The version timeline opens, displaying a chronological list of all recorded snapshots.
4. Clicking any previous revision loads a read-only preview of that historical state without affecting the live published content.

---

## Performing a Rollback

If an editor needs to revert changes:

1. Select the desired historical version from the timeline.
2. Review the state in the preview window.
3. Click **Restore Version**.
4. The system updates the active draft with the selected historical snapshot, immediately ready for review or re-publication.
5. A new audit log event is recorded documenting the rollback action.

---

## Next Steps

- [Audit Logs and Governance](/cms-ui/docs/guides/audit-logs)
- [Access Control and RBAC](/cms-ui/docs/guides/access-control)
- [Visual Page Builder Guide](/cms-ui/docs/guides/page-builder)
