# Manual Test Plan and Report: Non-Tech-First Headless CMS

A human tester follows this file from top to bottom. For every case, do the **Steps**, compare with **Expected**, then tick the box and fill in **Result**.

- Result values: `PASS`, `FAIL`, `BLOCKED` (could not run) or `N/A`.
- On a `FAIL`, write the bug in section 22 (Bug Log) and note its ID in the Notes column.
- Edge cases are marked **(EDGE)**. Security cases are marked **(SEC)**. Do not skip them.

---

## 0. Test run details

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Tester                 |                                                   |
| Date                   |                                                   |
| Git branch / commit    |                                                   |
| Browser(s) and version |                                                   |
| OS                     |                                                   |
| Backend URL            | http://localhost:3000                             |
| CMS UI URL             | http://localhost:3003                             |
| Public site URL        | http://localhost:3003/live/`<site-slug>`          |
| Preview URL            | http://localhost:3003/sites/`<site-slug>`/preview |

## 1. Setup and test data

1. Start Postgres and Redis, then the backend (`:3000`) and the CMS UI (`:3003`).
2. If `packages/repository` was changed, rebuild it (`dist` must exist).
3. Have a mailbox or a way to read invite emails/links.
4. Create these accounts, with a different browser profile or incognito window for each, so sessions do not mix:

| Alias    | Role                             | Scope        |
| -------- | -------------------------------- | ------------ |
| ADMIN    | Administrator (`*`)              | all websites |
| WRITER   | Manage Content only              | site A       |
| EDITOR   | Manage Content + Publish Content | site A       |
| DESIGNER | Manage Appearance only           | site A       |
| MEDIA    | Manage Media only                | site A       |
| SETTINGS | Manage Settings only             | site A       |
| OTHER    | Manage Content + Publish Content | site B only  |
| NOROLE   | Account with no role             | none         |

5. Create two websites: **Site A** (slug `site-a`) and **Site B** (slug `site-b`).
6. Prepare files: a small PNG (< 1 MB), a large image (> 10 MB), a PDF, an `.exe` or `.svg` with a script, a 0-byte file, a file with a very long or non-ASCII name (`résumé 日本語 (1).png`), and a `.md` file for import.

Setup result: **\_\_** Notes: **\_\_**

---

## 2. Authentication and session

| ID      | Case                             | Steps                                                          | Expected                                                                            | Done | Result | Notes |
| ------- | -------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- | ------ | ----- |
| AUTH-01 | Login OK                         | Open the UI, log in as ADMIN.                                  | Lands on the dashboard. A `token_cms_ui` cookie is set (HttpOnly).                  | ☐    |        |       |
| AUTH-02 | Wrong password                   | Log in with a wrong password.                                  | Clear error message. No token set. The error does not say whether the email exists. | ☐    |        |       |
| AUTH-03 | Unknown email                    | Log in with an unregistered email.                             | Same message as AUTH-02.                                                            | ☐    |        |       |
| AUTH-04 | Empty fields (EDGE)              | Submit the form blank.                                         | Field validation shown, no request sent or a 400 shown nicely.                      | ☐    |        |       |
| AUTH-05 | Very long input (EDGE)           | Enter 1000 characters in the email and password.               | No crash. Clean error.                                                              | ☐    |        |       |
| AUTH-06 | SQL / HTML in fields (SEC)       | Email `' OR 1=1 --`, then `<script>alert(1)</script>`.         | Rejected. No script runs.                                                           | ☐    |        |       |
| AUTH-07 | Brute force (SEC)                | Try 10+ wrong passwords quickly.                               | Throttled or locked, with a readable message.                                       | ☐    |        |       |
| AUTH-08 | Protected route, logged out      | Log out, then open `/sites/site-a/posts` directly.             | Redirected to login, then back to the page after login (or to the dashboard).       | ☐    |        |       |
| AUTH-09 | Logout                           | Click Logout.                                                  | Cookie cleared. Back button does not show private pages.                            | ☐    |        |       |
| AUTH-10 | Session expiry (EDGE)            | Delete the cookie in dev tools, then click any action.         | Sent to login, no endless spinner or blank page.                                    | ☐    |        |       |
| AUTH-11 | Two tabs (EDGE)                  | Log out in tab 1, then act in tab 2.                           | Tab 2 handles the 401 cleanly.                                                      | ☐    |        |       |
| AUTH-12 | Invite flow                      | As ADMIN invite a new email with a role. Open the invite link. | Set password works. The user gets only the role's permissions.                      | ☐    |        |       |
| AUTH-13 | Used / expired invite (EDGE)     | Reuse the link, then try an old one.                           | Clear "invalid or expired" message.                                                 | ☐    |        |       |
| AUTH-14 | Password reset                   | Use "forgot password" if present.                              | Reset works. Old password stops working.                                            | ☐    |        |       |
| AUTH-15 | MFA (if enabled)                 | Enable MFA, log out, log in.                                   | Code requested. Wrong code rejected. Request page lists requests.                   | ☐    |        |       |
| AUTH-16 | Request without `x-app-id` (SEC) | `curl` an API endpoint without the header.                     | Rejected, not a 500.                                                                | ☐    |        |       |

## 3. Dashboard and websites

| ID      | Case                            | Steps                                           | Expected                                                                    | Done | Result | Notes |
| ------- | ------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- | ---- | ------ | ----- |
| DASH-01 | Website list (ADMIN)            | Open the dashboard.                             | Sees Site A and Site B.                                                     | ☐    |        |       |
| DASH-02 | Website list (scoped)           | Log in as WRITER, then OTHER.                   | WRITER sees only Site A. OTHER sees only Site B. (SEC)                      | ☐    |        |       |
| DASH-03 | Open a site                     | Click Open workspace.                           | Lands on the first allowed section (see section 17).                        | ☐    |        |       |
| DASH-04 | Create site                     | ADMIN creates "My Test Site".                   | Slug auto-generated. It appears in the list. Default Pages and Menus exist. | ☐    |        |       |
| DASH-05 | Duplicate site name/slug (EDGE) | Create another with the same name.              | Either a unique slug is made or a clear error. No crash.                    | ☐    |        |       |
| DASH-06 | Special-character name (EDGE)   | Name it `Café & <b>Bar</b> 日本`.               | Safe slug. Name shown as text, not HTML.                                    | ☐    |        |       |
| DASH-07 | Direct URL to other site (SEC)  | As WRITER open `/sites/site-b/posts`.           | 403 / access denied. No data shown.                                         | ☐    |        |       |
| DASH-08 | Nonexistent site (EDGE)         | Open `/sites/nope/posts`.                       | Friendly not-found.                                                         | ☐    |        |       |
| DASH-09 | Page count column               | Compare the "Pages" number with the real count. | **Known issue:** it counts all entries. Record what you see.                | ☐    |        |       |
| DASH-10 | NOROLE user                     | Log in as NOROLE.                               | Empty state or access-denied, no data.                                      | ☐    |        |       |

## 4. Pages and Sitemap

| ID    | Case                               | Steps                                                | Expected                                                                      | Done | Result | Notes |
| ----- | ---------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- | ---- | ------ | ----- |
| PG-01 | List pages                         | Open Pages.                                          | Only real pages. No menus, posts, tags, sections, redirects or form messages. | ☐    |        |       |
| PG-02 | Tab counts                         | Compare the tab counts with the list.                | Numbers match.                                                                | ☐    |        |       |
| PG-03 | Sidebar badges                     | Compare the Pages and Posts badges with real counts. | Match.                                                                        | ☐    |        |       |
| PG-04 | Create page                        | Add a page "About".                                  | Appears as draft. Slug `/about`.                                              | ☐    |        |       |
| PG-05 | Duplicate slug (EDGE)              | Create another page with slug `/about`.              | Clear 409-style error. Not saved.                                             | ☐    |        |       |
| PG-06 | Slug case/space (EDGE)             | Slug `About Us`, `/ABOUT`, `//a//b`.                 | Normalised or rejected, never saved broken.                                   | ☐    |        |       |
| PG-07 | Empty title (EDGE)                 | Save with a blank title.                             | Validation error.                                                             | ☐    |        |       |
| PG-08 | Very long title (EDGE)             | 500 characters.                                      | Handled (limit message or truncated). Layout not broken.                      | ☐    |        |       |
| PG-09 | Emoji / RTL title (EDGE)           | `🚀 مرحبا`.                                          | Stored and shown correctly.                                                   | ☐    |        |       |
| PG-10 | Parent / child                     | Make a page a child of another.                      | Sitemap tree shows it. Public path is nested.                                 | ☐    |        |       |
| PG-11 | Circular parent (EDGE)             | Set A under B, then B under A.                       | Blocked.                                                                      | ☐    |        |       |
| PG-12 | Delete parent with children (EDGE) | Delete a parent.                                     | Clear behaviour (blocked or children handled). No orphan crash.               | ☐    |        |       |
| PG-13 | 100+ entries (EDGE)                | Create or import over 100 pages.                     | All appear (paging works). None hidden.                                       | ☐    |        |       |
| PG-14 | Search / filter                    | Use search and status filters if present.            | Correct results.                                                              | ☐    |        |       |
| PG-15 | Delete draft                       | Delete a draft page.                                 | Gone from the list.                                                           | ☐    |        |       |
| PG-16 | Delete live page, EDITOR           | EDITOR deletes a published page.                     | Allowed. Page leaves the public site.                                         | ☐    |        |       |
| PG-17 | Delete live page, WRITER (SEC)     | WRITER deletes a published page.                     | Blocked (403) with a message.                                                 | ☐    |        |       |
| PG-18 | Delete own draft, WRITER           | WRITER deletes a draft.                              | Allowed.                                                                      | ☐    |        |       |

## 5. Page content editors

| ID    | Case                          | Steps                                                | Expected                                                      | Done | Result | Notes |
| ----- | ----------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- | ---- | ------ | ----- |
| ED-01 | Open the editor               | Open a page's content editor.                        | Loads without a blank screen.                                 | ☐    |        |       |
| ED-02 | Fill schema fields            | Fill text, number, boolean, date and select fields.  | Values save and reload identically.                           | ☐    |        |       |
| ED-03 | Required field empty (EDGE)   | Clear a required field and save.                     | Error shows on that field.                                    | ☐    |        |       |
| ED-04 | Unique field duplicate (EDGE) | Save a value already used by another entry.          | Error naming the conflict. Not saved.                         | ☐    |        |       |
| ED-05 | Edit own unique value         | Re-save an entry without changing its unique value.  | Saves fine.                                                   | ☐    |        |       |
| ED-06 | Rich text                     | Add bold, links, lists, headings.                    | Saved and rendered correctly.                                 | ☐    |        |       |
| ED-07 | Rich text XSS (SEC)           | Paste `<img src=x onerror=alert(1)>` and `<script>`. | No alert on editor, preview or live site.                     | ☐    |        |       |
| ED-08 | Media field                   | Pick an image from the library.                      | Thumbnail shows. Persists after reload.                       | ☐    |        |       |
| ED-09 | Save then reload              | Save, press F5.                                      | Data intact.                                                  | ☐    |        |       |
| ED-10 | Unsaved changes (EDGE)        | Edit, then navigate away without saving.             | Warning, or no silent data loss that surprises.               | ☐    |        |       |
| ED-11 | Save error message            | Cause a server error (e.g. duplicate slug).          | The toast shows the server's message, not a generic one.      | ☐    |        |       |
| ED-12 | Publish                       | Click Publish Updates as EDITOR.                     | Status becomes Live. Public site shows it.                    | ☐    |        |       |
| ED-13 | Publish button, WRITER (SEC)  | Open as WRITER.                                      | Publish button **not visible**. Direct API publish gives 403. | ☐    |        |       |
| ED-14 | Edit after publish            | Edit live content and save without publishing.       | Public site still shows the old version until publish.        | ☐    |        |       |
| ED-15 | Unpublish                     | Unpublish a live page.                               | Public URL gives "Page not found".                            | ☐    |        |       |
| ED-16 | Revisions                     | Open versions / history if present.                  | Versions listed. Restore works.                               | ☐    |        |       |
| ED-17 | Concurrent edit (EDGE)        | Open the same entry in two tabs, save both.          | No crash. Behaviour is understandable.                        | ☐    |        |       |
| ED-18 | Toast position                | Trigger a toast.                                     | Appears bottom-right and does not cover Publish.              | ☐    |        |       |

## 6. Visual Builder (GrapesJS)

| ID    | Case                          | Steps                                                   | Expected                                | Done | Result | Notes |
| ----- | ----------------------------- | ------------------------------------------------------- | --------------------------------------- | ---- | ------ | ----- |
| VB-01 | Open builder                  | Open a page in the builder.                             | Canvas loads with blocks panel.         | ☐    |        |       |
| VB-02 | Old HTML-only page (EDGE)     | Open a page that has only HTML/CSS stored.              | Content shows, not a blank canvas.      | ☐    |        |       |
| VB-03 | Add blocks                    | Drag text, image, button, columns, form.                | Each is placed and editable.            | ☐    |        |       |
| VB-04 | Custom CMS blocks             | Add repeat, post list, tags, include, site-logo blocks. | Available. Settings panel works.        | ☐    |        |       |
| VB-05 | Save and reload               | Save, reload.                                           | Same design returns.                    | ☐    |        |       |
| VB-06 | Undo / redo                   | Use undo and redo.                                      | Works.                                  | ☐    |        |       |
| VB-07 | Responsive modes              | Switch desktop, tablet, mobile.                         | Layout adapts.                          | ☐    |        |       |
| VB-08 | Large page (EDGE)             | Add 200+ blocks.                                        | Still usable. Save works.               | ☐    |        |       |
| VB-09 | Script / handler pasted (SEC) | Import code with `<script>` and `onclick`.              | Stripped in preview and live.           | ☐    |        |       |
| VB-10 | Custom CSS                    | Add CSS.                                                | Applied. Does not leak onto the CMS UI. | ☐    |        |       |
| VB-11 | Image from library            | Use a library image.                                    | Displays in preview and live.           | ☐    |        |       |
| VB-12 | Designer access               | DESIGNER opens the builder.                             | Allowed. Can save the design.           | ☐    |        |       |
| VB-13 | Unsaved leave (EDGE)          | Change, then leave.                                     | No unexpected loss or a warning.        | ☐    |        |       |

## 7. Post Studio and Blog

| ID      | Case                         | Steps                                                             | Expected                                                                                      | Done | Result | Notes |
| ------- | ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---- | ------ | ----- |
| POST-01 | Blog setup                   | Open Posts on a fresh site.                                       | Setup panel offers to create a blog page.                                                     | ☐    |        |       |
| POST-02 | Create post                  | New post with title, body, excerpt, cover.                        | Saved as draft.                                                                               | ☐    |        |       |
| POST-03 | Auto slug                    | Type a title.                                                     | Slug generated. Editable.                                                                     | ☐    |        |       |
| POST-04 | Duplicate slug (EDGE)        | Two posts with the same slug.                                     | Second is rejected with the server message in the toast.                                      | ☐    |        |       |
| POST-05 | Empty title (EDGE)           | Save without a title.                                             | Validation.                                                                                   | ☐    |        |       |
| POST-06 | Cover URL                    | Paste a URL and click **Apply**.                                  | Cover shows. Without Apply, the user sees it is not yet applied.                              | ☐    |        |       |
| POST-07 | Bad cover URL (EDGE)         | Paste a broken or non-image URL.                                  | Handled without crash.                                                                        | ☐    |        |       |
| POST-08 | Long excerpt (EDGE)          | 2000 characters.                                                  | Saved. **Known:** shown in full on cards. Note appearance.                                    | ☐    |        |       |
| POST-09 | Tags                         | Add existing and new tags.                                        | Tag pages list the post.                                                                      | ☐    |        |       |
| POST-10 | Tag edge (EDGE)              | Duplicate tag, tag with spaces or `#`, 100-char tag.              | Normalised or rejected.                                                                       | ☐    |        |       |
| POST-11 | SEO panel                    | Set title, description, noindex.                                  | Saved. `noindex` appears in the live page head.                                               | ☐    |        |       |
| POST-12 | Schedule publish             | Set `publishAt` in the future and publish.                        | Hidden publicly until that time, visible after. **Known:** evaluated at read time, no worker. | ☐    |        |       |
| POST-13 | Past schedule (EDGE)         | Set a date in the past.                                           | Visible at once.                                                                              | ☐    |        |       |
| POST-14 | Publish                      | Publish a post.                                                   | Appears on the blog list and the post URL.                                                    | ☐    |        |       |
| POST-15 | Unpublish                    | Unpublish.                                                        | Gone publicly. Remains in Studio as draft.                                                    | ☐    |        |       |
| POST-16 | Delete rules                 | WRITER deletes own draft vs live post.                            | Draft allowed. Live blocked.                                                                  | ☐    |        |       |
| POST-17 | Reading time                 | Post with ~400 words.                                             | Shows about 2 min.                                                                            | ☐    |        |       |
| POST-18 | Next / previous              | Three posts with different dates.                                 | Navigation links go to the correct neighbours. Hidden when none.                              | ☐    |        |       |
| POST-19 | Related posts                | Posts sharing tags.                                               | Related list shows only posts with a shared tag.                                              | ☐    |        |       |
| POST-20 | Markdown import              | Import the `.md` file.                                            | Becomes a post. Headings and lists convert.                                                   | ☐    |        |       |
| POST-21 | Markdown with HTML (SEC)     | Import markdown containing `<script>`.                            | Sanitised.                                                                                    | ☐    |        |       |
| POST-22 | Empty / huge markdown (EDGE) | Import 0-byte and a 5 MB file.                                    | Clear error or success. No crash.                                                             | ☐    |        |       |
| POST-23 | Post counts                  | Compare the footer, sidebar badge and real count with 100+ posts. | All match.                                                                                    | ☐    |        |       |
| POST-24 | Posts hidden from Pages      | Check the Pages list.                                             | Posts do not appear there.                                                                    | ☐    |        |       |
| POST-25 | Publish button for WRITER    | Open Post Studio as WRITER.                                       | Publish not visible.                                                                          | ☐    |        |       |

## 8. Tags, Shared Sections, Redirects

| ID     | Case                             | Steps                                                                    | Expected                                                    | Done | Result | Notes |
| ------ | -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- | ---- | ------ | ----- |
| TAG-01 | Create / rename / delete tag     | Do each.                                                                 | Reflected on posts and archive pages.                       | ☐    |        |       |
| TAG-02 | Tag archive URL                  | Open `/live/<site>/blog/tag/<tag>`.                                      | Lists only posts with the tag. Heading shows the tag name.  | ☐    |        |       |
| TAG-03 | Unknown tag (EDGE)               | Open a tag URL that does not exist.                                      | Page not found.                                             | ☐    |        |       |
| SEC-01 | Shared section                   | Create a section (e.g. `cta`). Include it with `data-cms-include="cta"`. | Appears on pages that include it. Editing it updates all.   | ☐    |        |       |
| SEC-02 | Header / footer role             | Make a section the header.                                               | Shown on every page.                                        | ☐    |        |       |
| SEC-03 | Missing include (EDGE)           | Include a slug that does not exist.                                      | Renders nothing, no crash.                                  | ☐    |        |       |
| SEC-04 | Section includes itself (EDGE)   | Section A includes A.                                                    | No infinite loop.                                           | ☐    |        |       |
| RED-01 | Create redirect                  | `from: old`, `to: /about`.                                               | Visiting `/live/<site>/old` goes to `/about`.               | ☐    |        |       |
| RED-02 | External target                  | `to: https://example.com`.                                               | Browser goes there.                                         | ☐    |        |       |
| RED-03 | Loop (EDGE)                      | A to B and B to A.                                                       | No infinite loop. Stops with an error or a not-found page.  | ☐    |        |       |
| RED-04 | Redirect on existing page (EDGE) | `from` equals a live page path.                                          | Defined behaviour (page wins or redirect wins). Note which. | ☐    |        |       |
| RED-05 | `javascript:` target (SEC)       | `to: javascript:alert(1)`.                                               | Rejected or not executed.                                   | ☐    |        |       |
| RED-06 | Draft redirect                   | Leave unpublished.                                                       | Not active publicly.                                        | ☐    |        |       |

## 9. Navigation Menus

| ID      | Case                        | Steps                                                               | Expected                                                            | Done | Result | Notes |
| ------- | --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ---- | ------ | ----- |
| MENU-01 | Open menus                  | Open Menus.                                                         | A header menu exists.                                               | ☐    |        |       |
| MENU-02 | Page picker                 | Open the page picker.                                               | Lists only real pages. No `/__menus`, posts, drafts of other kinds. | ☐    |        |       |
| MENU-03 | Add / reorder / remove      | Do each, then Save Menu.                                            | Persists after reload.                                              | ☐    |        |       |
| MENU-04 | Unsaved auto items          | On a fresh site, open Menus and leave without saving.               | **Known:** menu is not saved until you click Save. Note it.         | ☐    |        |       |
| MENU-05 | Nested items                | Add a child item.                                                   | Rendered as dropdown or nested list.                                | ☐    |        |       |
| MENU-06 | External link               | Add `https://example.com`.                                          | Opens correctly.                                                    | ☐    |        |       |
| MENU-07 | Link to deleted page (EDGE) | Delete a linked page.                                               | Menu stays safe, no crash.                                          | ☐    |        |       |
| MENU-08 | Empty label (EDGE)          | Blank label.                                                        | Validation.                                                         | ☐    |        |       |
| MENU-09 | `javascript:` URL (SEC)     | Use as a link.                                                      | Rejected or neutralised on the live site.                           | ☐    |        |       |
| MENU-10 | Designer access             | DESIGNER edits menus.                                               | Allowed.                                                            | ☐    |        |       |
| MENU-11 | Writer access (SEC)         | WRITER opens Menus, or sends a PUT to the menus entry.              | Blocked.                                                            | ☐    |        |       |
| MENU-12 | Kind spoof (SEC)            | As DESIGNER, PUT `{kind:'menus', ...}` to a normal page's entry id. | 403. The page is unchanged.                                         | ☐    |        |       |
| MENU-13 | Live menu                   | Publish, open the live site.                                        | Menu shown and links work.                                          | ☐    |        |       |

## 10. Media library

| ID     | Case                         | Steps                                                     | Expected                                                                            | Done | Result | Notes |
| ------ | ---------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- | ------ | ----- |
| MED-01 | Upload PNG                   | Upload the small PNG.                                     | Appears with a thumbnail.                                                           | ☐    |        |       |
| MED-02 | Upload PDF                   | Upload.                                                   | Listed with a file icon. Downloadable.                                              | ☐    |        |       |
| MED-03 | Large file (EDGE)            | Upload > 10 MB.                                           | Limit message or success. No hang.                                                  | ☐    |        |       |
| MED-04 | 0-byte file (EDGE)           | Upload.                                                   | Rejected clearly.                                                                   | ☐    |        |       |
| MED-05 | Dangerous type (SEC)         | Upload `.exe`, `.html`, SVG with a script.                | Rejected, or served so it cannot run in the app's origin.                           | ☐    |        |       |
| MED-06 | Odd name (EDGE)              | `résumé 日本語 (1).png`, a very long name, `../../x.png`. | Stored safely. No path traversal.                                                   | ☐    |        |       |
| MED-07 | Same file twice (EDGE)       | Upload the same file two times.                           | Both handled, no overwrite surprises.                                               | ☐    |        |       |
| MED-08 | Multi-upload                 | Select 5 files.                                           | All upload. Partial failure reports which.                                          | ☐    |        |       |
| MED-09 | Folders                      | Create, rename, move, delete a folder.                    | Works. Contents consistent.                                                         | ☐    |        |       |
| MED-10 | Delete used media (EDGE)     | Delete an image used by a live page.                      | Defined behaviour. Page does not crash.                                             | ☐    |        |       |
| MED-11 | Missing file                 | Open the URL of a record whose file is gone.              | **404**, not 500. **Known:** some old records point to deleted files.               | ☐    |        |       |
| MED-12 | Replace / rename             | Rename a file.                                            | Name updates. URL still works.                                                      | ☐    |        |       |
| MED-13 | Unauthenticated access (SEC) | Open a media URL logged out.                              | Matches the intended rule (public files only for published content or per setting). | ☐    |        |       |
| MED-14 | Media role                   | Log in as MEDIA.                                          | Sees Media only. Content pages are blocked.                                         | ☐    |        |       |
| MED-15 | Writer upload                | WRITER picks an image in an editor.                       | Allowed or blocked per role definition. Consistent in UI and API.                   | ☐    |        |       |
| MED-16 | Search / sort                | Search by name.                                           | Correct results.                                                                    | ☐    |        |       |

## 11. Site Settings and SEO

| ID     | Case                           | Steps                                       | Expected                                                                | Done | Result | Notes |
| ------ | ------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------- | ---- | ------ | ----- |
| SET-01 | Change site name / logo        | Edit and save.                              | Shown in live header and logo block.                                    | ☐    |        |       |
| SET-02 | Title template                 | `%page% - %site%`.                          | Page `<title>` follows it.                                              | ☐    |        |       |
| SET-03 | Default description            | Set.                                        | Used when a page has none.                                              | ☐    |        |       |
| SET-04 | Page SEO wins                  | Page title/description set.                 | Overrides defaults.                                                     | ☐    |        |       |
| SET-05 | noindex                        | Enable on a page.                           | `robots noindex` in the head.                                           | ☐    |        |       |
| SET-06 | Public toggle (SEC)            | Turn **public delivery OFF**.               | `/live/<site>` shows "Website not available". Delivery API returns 404. | ☐    |        |       |
| SET-07 | Public toggle ON               | Turn on.                                    | Only published content is visible.                                      | ☐    |        |       |
| SET-08 | Accept forms / comments toggle | Turn off, then submit a form.               | Submission rejected with a clear message.                               | ☐    |        |       |
| SET-09 | Domain / base URL              | Enter a domain with and without `https://`. | Normalised in canonical URLs.                                           | ☐    |        |       |
| SET-10 | Invalid inputs (EDGE)          | Bad URL, 10k-character text.                | Validation, no crash.                                                   | ☐    |        |       |
| SET-11 | Settings role                  | SETTINGS user edits settings.               | Allowed. Cannot reach content pages.                                    | ☐    |        |       |
| SET-12 | Other roles (SEC)              | WRITER opens Settings.                      | Blocked.                                                                | ☐    |        |       |

## 12. Preview

| ID     | Case                  | Steps                                                                                      | Expected                                                                                          | Done | Result | Notes |
| ------ | --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---- | ------ | ----- |
| PRV-01 | Open preview          | Open the preview URL.                                                                      | Shows drafts too (including unpublished).                                                         | ☐    |        |       |
| PRV-02 | Internal links        | Click menu and post links.                                                                 | Navigation stays inside preview.                                                                  | ☐    |        |       |
| PRV-03 | External links        | Click an external link.                                                                    | Leaves preview correctly.                                                                         | ☐    |        |       |
| PRV-04 | Draft not public      | Compare preview with the live site.                                                        | Drafts only in preview.                                                                           | ☐    |        |       |
| PRV-05 | Form in preview       | Submit the contact form.                                                                   | Works or shows a clear preview-mode note.                                                         | ☐    |        |       |
| PRV-06 | Sandbox (SEC)         | In the page add `<script>parent.document.cookie</script>` / `top.location`.                | Cannot read the CMS cookie or storage. Cannot navigate the parent except via the allowed message. | ☐    |        |       |
| PRV-07 | Spoofed message (SEC) | From the console of another window, `postMessage` a `CMS_PREVIEW_NAVIGATE` to the preview. | Ignored (source check).                                                                           | ☐    |        |       |
| PRV-08 | Permission            | NOROLE user opens preview.                                                                 | Blocked.                                                                                          | ☐    |        |       |

## 13. Public website (`/live/<site>`)

| ID     | Case                         | Steps                                              | Expected                                                                  | Done | Result | Notes |
| ------ | ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- | ---- | ------ | ----- |
| PUB-01 | Anonymous access             | Open in a private window with no login.            | Published pages load.                                                     | ☐    |        |       |
| PUB-02 | Draft hidden (SEC)           | Open a draft's URL.                                | "Page not found". Not leaked in HTML or API.                              | ☐    |        |       |
| PUB-03 | Unknown site                 | `/live/nope`.                                      | "Website not available".                                                  | ☐    |        |       |
| PUB-04 | Unknown path                 | `/live/<site>/zzz`.                                | "Page not found".                                                         | ☐    |        |       |
| PUB-05 | Trailing slash / case (EDGE) | `/about/`, `/ABOUT`.                               | Consistent behaviour.                                                     | ☐    |        |       |
| PUB-06 | Encoded paths (EDGE)         | `/%2e%2e/`, `/a%00b`, very long path.              | No crash.                                                                 | ☐    |        |       |
| PUB-07 | Home page                    | `/live/<site>`.                                    | Shows the home page.                                                      | ☐    |        |       |
| PUB-08 | Page not designed            | Published page with no design.                     | "This page is not designed yet".                                          | ☐    |        |       |
| PUB-09 | Blog list and post           | Open the blog and a post.                          | Correct content. Reading time and tags show.                              | ☐    |        |       |
| PUB-10 | Many pages                   | Site with 150+ published entries.                  | All loadable (paging loop).                                               | ☐    |        |       |
| PUB-11 | Mobile view                  | Phone-size window.                                 | Responsive. No horizontal scroll.                                         | ☐    |        |       |
| PUB-12 | API leak check (SEC)         | Open the delivery API response.                    | No draft data, no form messages, no commenter emails, no internal fields. | ☐    |        |       |
| PUB-13 | Cache after publish          | Publish a change.                                  | Live shows it within the cache window (about 60 s). Hard refresh works.   | ☐    |        |       |
| PUB-14 | Back / forward               | Navigate across pages and use the browser buttons. | Works.                                                                    | ☐    |        |       |

## 14. Forms and Comments (public submission)

Rate limit: **5 submissions per minute per IP**. Space tests or expect HTTP 429.

| ID     | Case                          | Steps                                              | Expected                                                            | Done | Result | Notes |
| ------ | ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- | ---- | ------ | ----- |
| FRM-01 | Contact form                  | Fill name, email, message. Send.                   | "Thank you! Your message was sent." Appears in Inbox, Messages tab. | ☐    |        |       |
| FRM-02 | Field named `name`            | Use `name="name"`.                                 | Field value saved (not stripped).                                   | ☐    |        |       |
| FRM-03 | Empty submit (EDGE)           | Send blank.                                        | Rejected with a message.                                            | ☐    |        |       |
| FRM-04 | Invalid email (EDGE)          | `abc`.                                             | Rejected.                                                           | ☐    |        |       |
| FRM-05 | Huge message (EDGE)           | 100k characters.                                   | Rejected or truncated. No 500.                                      | ☐    |        |       |
| FRM-06 | Many fields (EDGE)            | 100 fields.                                        | Rejected or limited.                                                | ☐    |        |       |
| FRM-07 | HTML in message (SEC)         | `<script>alert(1)</script><b>x</b>`.               | Inbox shows it as text. No script runs anywhere.                    | ☐    |        |       |
| FRM-08 | Unicode / emoji               | `こんにちは 🎉`.                                   | Stored and shown correctly.                                         | ☐    |        |       |
| FRM-09 | Honeypot (SEC)                | Fill hidden `website`, `_hp` or `hp`.              | Silently dropped or rejected. Nothing in Inbox.                     | ☐    |        |       |
| FRM-10 | Rate limit (SEC)              | Send 6 within a minute.                            | 6th gives 429 with a readable message.                              | ☐    |        |       |
| FRM-11 | Rejected counts               | Send 5 invalid, then 1 valid.                      | **Known:** rejected requests count toward the limit. Note.          | ☐    |        |       |
| FRM-12 | Double click (EDGE)           | Double-click Send.                                 | One entry, not two.                                                 | ☐    |        |       |
| FRM-13 | Messages not public (SEC)     | Check the delivery API and live site.              | Form messages never appear.                                         | ☐    |        |       |
| FRM-14 | Comment                       | On a post, add a comment.                          | "will appear once approved". In Inbox, Comments, status Waiting.    | ☐    |        |       |
| FRM-15 | Comment unapproved hidden     | View the post as a visitor.                        | Comment not shown.                                                  | ☐    |        |       |
| FRM-16 | Approve                       | EDITOR approves.                                   | Comment appears on the post. Email is not shown publicly.           | ☐    |        |       |
| FRM-17 | Hide approved                 | Click Hide.                                        | Comment disappears from the post. Status returns to Waiting.        | ☐    |        |       |
| FRM-18 | Comment HTML (SEC)            | `<b>x</b>` in a comment.                           | Shown as literal text.                                              | ☐    |        |       |
| FRM-19 | Comment on unknown post (SEC) | API with a made-up `postSlug`.                     | Rejected.                                                           | ☐    |        |       |
| FRM-20 | Comment on draft post (SEC)   | `postSlug` of a draft.                             | Rejected.                                                           | ☐    |        |       |
| FRM-21 | Submissions disabled          | Setting off, then submit.                          | Rejected with a message.                                            | ☐    |        |       |
| FRM-22 | Delete submission             | Delete from Inbox.                                 | Removed.                                                            | ☐    |        |       |
| FRM-23 | Delete without permission     | WRITER deletes a comment.                          | **Known:** a generic error is shown if blocked. Record.             | ☐    |        |       |
| FRM-24 | Approve button visibility     | WRITER opens the Inbox.                            | Approve / Hide **not** shown.                                       | ☐    |        |       |
| FRM-25 | Wrong payload (SEC)           | POST invalid JSON, wrong `type`, missing `fields`. | 400, never 500.                                                     | ☐    |        |       |
| FRM-26 | Cross-site (SEC)              | Submit to Site A, check Site B's inbox.            | Not present in B.                                                   | ☐    |        |       |
| FRM-27 | Spoofed form message (SEC)    | Post `CMS_FORM_SUBMIT` from another window.        | Ignored (source check).                                             | ☐    |        |       |

## 15. Inbox

| ID     | Case                  | Steps                       | Expected                               | Done | Result | Notes |
| ------ | --------------------- | --------------------------- | -------------------------------------- | ---- | ------ | ----- |
| INB-01 | Tabs                  | Switch Comments / Messages. | Correct lists.                         | ☐    |        |       |
| INB-02 | Pending badge         | Create 3 pending comments.  | Badge shows 3, decreases on approval.  | ☐    |        |       |
| INB-03 | Sorting               | Several items.              | Newest first.                          | ☐    |        |       |
| INB-04 | Empty states          | Fresh site.                 | "No comments yet" / "No messages yet". | ☐    |        |       |
| INB-05 | Long text (EDGE)      | A 5000-character message.   | Wraps. Layout intact.                  | ☐    |        |       |
| INB-06 | 100+ items (EDGE)     | Create more than 100.       | All shown.                             | ☐    |        |       |
| INB-07 | Confirm before delete | Click the trash.            | Confirmation dialog first.             | ☐    |        |       |

## 16. Capability-based roles and permissions

Check each row both in the **UI** (menu, buttons) and the **API** (direct request). The UI hiding something is not enough.

| ID      | Case                           | Steps                                                             | Expected                                                                  | Done | Result | Notes |
| ------- | ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- | ------ | ----- |
| RBAC-01 | Create role                    | Create "Blogger" with Manage Content.                             | Saved. Descriptions read in plain words.                                  | ☐    |        |       |
| RBAC-02 | Role scope per site            | Give a role to Site A only.                                       | No access to Site B.                                                      | ☐    |        |       |
| RBAC-03 | WRITER                         | Create / edit pages and posts.                                    | Allowed. Publish, delete-live, menus, settings, media management blocked. | ☐    |        |       |
| RBAC-04 | EDITOR                         | Create, edit, publish, delete live.                               | Allowed. Menus, settings blocked.                                         | ☐    |        |       |
| RBAC-05 | DESIGNER                       | Menus, sections, redirects, builder.                              | Allowed. Normal page content, settings blocked.                           | ☐    |        |       |
| RBAC-06 | MEDIA                          | Media only.                                                       | Posts, pages, settings blocked.                                           | ☐    |        |       |
| RBAC-07 | SETTINGS                       | Settings only.                                                    | Content blocked.                                                          | ☐    |        |       |
| RBAC-08 | OTHER user                     | Cross-site access.                                                | Cannot see or read Site A in any listing. (SEC)                           | ☐    |        |       |
| RBAC-09 | Deny wins                      | Add an explicit deny to a role that also allows.                  | Deny wins.                                                                | ☐    |        |       |
| RBAC-10 | Change role live               | Remove a capability while the user is logged in.                  | Takes effect on the next request (no stale token).                        | ☐    |        |       |
| RBAC-11 | Remove user                    | Delete / disable a user.                                          | Cannot log in. Existing session stops.                                    | ☐    |        |       |
| RBAC-12 | Last admin (EDGE)              | Try to remove or downgrade the last admin.                        | Blocked, or a clear warning.                                              | ☐    |        |       |
| RBAC-13 | Self-escalation (SEC)          | WRITER tries to edit own role or invite users via API.            | 403.                                                                      | ☐    |        |       |
| RBAC-14 | Schema list leak (SEC)         | WRITER calls the websites list API and the slug lookup of Site B. | Site B absent from the list, 403 on lookup.                               | ☐    |        |       |
| RBAC-15 | Delete rule                    | WRITER deletes live entry via API.                                | 403. EDITOR gets 204.                                                     | ☐    |        |       |
| RBAC-16 | Content via `kind` spoof (SEC) | DESIGNER sends `kind:'menus'` to edit a page.                     | 403.                                                                      | ☐    |        |       |
| RBAC-17 | Audit log                      | Open the Audit Log after actions.                                 | Entries show who, what, when. Filters work.                               | ☐    |        |       |
| RBAC-18 | MFA requests page              | Open as ADMIN and as non-admin.                                   | Admin only.                                                               | ☐    |        |       |

## 17. Sidebar and landing guards

| ID     | Case              | Steps                                 | Expected                                             | Done | Result | Notes |
| ------ | ----------------- | ------------------------------------- | ---------------------------------------------------- | ---- | ------ | ----- |
| NAV-01 | Admin sidebar     | Open a site as ADMIN.                 | Content Studio and Site Setup groups with all links. | ☐    |        |       |
| NAV-02 | Writer sidebar    | Open as WRITER.                       | Content Studio only. No empty "Site Setup" heading.  | ☐    |        |       |
| NAV-03 | Designer landing  | DESIGNER opens a site.                | Goes to Menus, not bounced to `/`.                   | ☐    |        |       |
| NAV-04 | Media landing     | MEDIA opens a site.                   | Goes to Media.                                       | ☐    |        |       |
| NAV-05 | Settings landing  | SETTINGS opens a site.                | Goes to Settings.                                    | ☐    |        |       |
| NAV-06 | No-access landing | A user with only a plugin capability. | `/access-denied`, readable.                          | ☐    |        |       |
| NAV-07 | Direct URL guard  | Open a forbidden section by URL.      | Access-denied page, no data flash.                   | ☐    |        |       |
| NAV-08 | Active link       | Navigate.                             | Current section highlighted.                         | ☐    |        |       |
| NAV-09 | Counts            | Pages and Posts badges.               | Match real counts.                                   | ☐    |        |       |
| NAV-10 | Collapse / mobile | Narrow the window.                    | Sidebar usable.                                      | ☐    |        |       |

## 18. Static export, schemas and other admin

| ID     | Case                                    | Steps                                                        | Expected                                    | Done | Result | Notes |
| ------ | --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------- | ---- | ------ | ----- |
| EXP-01 | Static export                           | Run export if available.                                     | Files generated for published content only. | ☐    |        |       |
| EXP-02 | Export excludes drafts / messages (SEC) | Inspect output.                                              | No drafts, no form messages, no emails.     | ☐    |        |       |
| SCH-01 | Content types (schemas)                 | Create a schema with fields: text, number, unique, required. | Editor forms follow it.                     | ☐    |        |       |
| SCH-02 | Change schema with data (EDGE)          | Remove or retype a field used by entries.                    | Existing entries do not crash the editor.   | ☐    |        |       |
| SCH-03 | Duplicate schema slug (EDGE)            | Create twice.                                                | Rejected or unique slug.                    | ☐    |        |       |
| SCH-04 | Plugins / security pages                | Open them.                                                   | Load without console errors.                | ☐    |        |       |

## 19. Cross-cutting checks

| ID   | Case                     | Steps                                                     | Expected                                                          | Done | Result | Notes |
| ---- | ------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- | ---- | ------ | ----- |
| X-01 | Console errors           | Keep dev tools open on every page above.                  | No red errors or failed requests (except intended 4xx).           | ☐    |        |       |
| X-02 | Network 5xx              | Watch the Network tab.                                    | No 500 responses anywhere.                                        | ☐    |        |       |
| X-03 | Loading states           | Throttle to "Slow 3G".                                    | Spinners / skeletons, no blank screens.                           | ☐    |        |       |
| X-04 | Offline (EDGE)           | Go offline, then click Save.                              | Clear error. Data in form not lost.                               | ☐    |        |       |
| X-05 | Browsers                 | Repeat key flows on Chrome, Firefox, Safari/WebKit.       | Same behaviour.                                                   | ☐    |        |       |
| X-06 | Dark mode                | Toggle if available.                                      | Text readable, buttons visible (secondary buttons not faint).     | ☐    |        |       |
| X-07 | Window sizes             | 1920, 1366, 768, 375 px wide.                             | No overlap or clipped controls.                                   | ☐    |        |       |
| X-08 | Keyboard                 | Tab through forms and dialogs.                            | Focus order good. Esc closes dialogs. Enter submits.              | ☐    |        |       |
| X-09 | Accessibility            | Check labels, alt text, contrast.                         | Basic issues noted.                                               | ☐    |        |       |
| X-10 | Double-submit            | Double-click every Save / Create.                         | No duplicate records.                                             | ☐    |        |       |
| X-11 | Refresh mid-flow         | F5 during multi-step actions.                             | State recovers.                                                   | ☐    |        |       |
| X-12 | Data after restart       | Restart backend.                                          | All data present. Sessions still valid or relogin is clean.       | ☐    |        |       |
| X-13 | Time zones (EDGE)        | Schedule a post in a different browser time zone.         | Publishes at the correct instant.                                 | ☐    |        |       |
| X-14 | Security headers (SEC)   | Check response headers.                                   | Sensible CSP / X-Content-Type-Options, no stack traces in errors. | ☐    |        |       |
| X-15 | Error format             | Trigger 400, 403, 404, 409.                               | JSON `{error:{message}}`, user-friendly text in the UI.           | ☐    |        |       |
| X-16 | API key in browser (SEC) | Search the page source, storage and network for API keys. | None present.                                                     | ☐    |        |       |

## 20. Known limitations (do not log as new bugs unless behaviour is worse than described)

1. The dashboard "Pages" column counts every entry (including posts, menus, messages).
2. Menu items auto-filled for a fresh site are not saved until **Save Menu** is clicked.
3. Some old media records point to deleted files, so those images are broken.
4. Rejected submissions count toward the 5-per-minute limit.
5. The Inbox delete shows a generic error if the user lacks permission.
6. Scheduled publishing is evaluated when content is read. There is no background worker.
7. Long post excerpts display in full on cards.
8. Webhooks, custom domains and the search-engine plugin are not part of this test (separate work / deferred).

## 21. Summary report (fill in at the end)

| Area                        | Total   | Pass | Fail | Blocked | N/A |
| --------------------------- | ------- | ---- | ---- | ------- | --- |
| 2 Auth                      | 16      |      |      |         |     |
| 3 Dashboard                 | 10      |      |      |         |     |
| 4 Pages                     | 18      |      |      |         |     |
| 5 Page editors              | 18      |      |      |         |     |
| 6 Visual Builder            | 13      |      |      |         |     |
| 7 Posts                     | 25      |      |      |         |     |
| 8 Tags, Sections, Redirects | 13      |      |      |         |     |
| 9 Menus                     | 13      |      |      |         |     |
| 10 Media                    | 16      |      |      |         |     |
| 11 Settings and SEO         | 12      |      |      |         |     |
| 12 Preview                  | 8       |      |      |         |     |
| 13 Public site              | 14      |      |      |         |     |
| 14 Forms and Comments       | 27      |      |      |         |     |
| 15 Inbox                    | 7       |      |      |         |     |
| 16 Roles                    | 18      |      |      |         |     |
| 17 Navigation               | 10      |      |      |         |     |
| 18 Export and admin         | 6       |      |      |         |     |
| 19 Cross-cutting            | 16      |      |      |         |     |
| **Total**                   | **260** |      |      |         |     |

Overall verdict (circle): **Ready / Ready with fixes / Not ready**

Blocking issues: **\_\_**

Tester signature / date: **\_\_**

## 22. Bug log

| Bug ID  | Test ID | Severity (Blocker / High / Medium / Low) | Summary | Steps to reproduce | Expected | Actual | Screenshot / URL | Status |
| ------- | ------- | ---------------------------------------- | ------- | ------------------ | -------- | ------ | ---------------- | ------ |
| BUG-001 |         |                                          |         |                    |          |        |                  |        |
| BUG-002 |         |                                          |         |                    |          |        |                  |        |
| BUG-003 |         |                                          |         |                    |          |        |                  |        |
| BUG-004 |         |                                          |         |                    |          |        |                  |        |
| BUG-005 |         |                                          |         |                    |          |        |                  |        |

### Handy API checks (replace `<...>`)

```bash
# Log in and keep the cookie
curl -i -c jar.txt -H 'x-app-id: CMS_UI' -H 'content-type: application/json' \
  -d '{"email":"<email>","password":"<pw>"}' http://localhost:3000/api/v1/auth/login

# Public delivery (no login). Must return only published content
curl -s http://localhost:3000/api/v1/delivery/CMS_UI/<site-slug>?pageSize=100

# Anonymous content access must be blocked (expect 401)
curl -i -H 'x-app-id: CMS_UI' http://localhost:3000/api/v1/content/<schema>/entries

# Public form submission (rate limited: 5/min/IP)
curl -i -H 'content-type: application/json' \
  -d '{"type":"form","form":"contact","fields":{"name":"Ann","email":"a@b.co","message":"hi"}}' \
  http://localhost:3000/api/v1/delivery/CMS_UI/<site-slug>/submissions

# Comment (needs a published post slug)
curl -i -H 'content-type: application/json' \
  -d '{"type":"comment","postSlug":"<post-slug>","fields":{"name":"Ann","message":"Nice"}}' \
  http://localhost:3000/api/v1/delivery/CMS_UI/<site-slug>/submissions
```
