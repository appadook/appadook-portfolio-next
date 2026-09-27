# Portfolio editor workspace

Open `/admin` and sign in with the existing approved GitHub account. Owner authorization is enforced by the server and Convex; the redesign does not change the authentication flow.

## Content workflow

- Projects, Experience, About, Skills, and Certifications contain all existing CMS collections. About categories, programming languages/technologies, and certification providers are available in their parent section's tabs.
- The last visited section is remembered on this browser. Collection search and filters stay in place while opening and closing an editor.
- Click a title or Edit to open the editor. Long forms are grouped by purpose. On small screens the editor fills the screen.
- Save draft, or press Command/Ctrl + Enter. Saving keeps the editor open. Unsaved individual editor drafts can be recovered in the same tab after a refresh. Ordering and bulk changes require an explicit save.
- Reorder projects or arrange the experience timeline in the dedicated ordering mode. Drag handles support keyboard sorting; move-up/down buttons are also available. Technologies retain their separate bulk editor.

## Publishing

Saving a record does not update the public site. Preview opens the saved draft version of the portfolio. Review changes lists added, updated, and deleted records compared with the live snapshot, including affected fields and dependent deletions. Publish changes publishes **all saved drafts together**. It does not include unsaved form, ordering, or bulk edits. The live site refreshes within 60 seconds.

Edits and publishing retain optimistic concurrency checks. If another tab changes the same content, preserve your input and reload the saved version before retrying; do not bypass the conflict.

## Media and inbox

Media supports uploading, inspecting, and reusing registered images and PDFs. The library displays filenames for new uploads, size/type, and usage in saved and published content. Existing external/legacy images remain in their content editors; they are not silently imported into managed storage. Library search and filters apply to the loaded page set; load more to expand it.

Files referenced by saved or published content cannot be removed. Recent uploads have a 24-hour protection window. An eligible unused file must be inspected before permanent removal; the server rechecks its references at deletion time.

Inbox provides paginated messages, delivery filters, a reading pane, and reply-by-email links. Retry email delivery queues the existing notification again; it does not send a reply to the visitor.

## Implementation boundaries

`features/admin/components/admin-workspace.css` scopes the visual system to `.admin-workspace`, including dialog portals. Public styles, renderers, animations, and the private portfolio preview are unchanged by this redesign. Existing SSR authentication/bootstrap and Convex subscriptions are retained.

The backend additions are `publishing.review`, `publishing.assets`, `publishing.removeAsset`, and `contact.messages`, plus optional asset filenames and the contact delivery-status index. Development functions were deployed to `chatty-puma-118`; production still needs its normal deployment.

## Verification

- `bun run --cwd packages/backend test` covers authorization, publishing isolation/conflicts, publication diffs, pagination, and protected media removal.
- `bun run --cwd apps/web test:e2e` covers desktop/mobile admin editing and recovery, repeated saves, publication review, structured fields, navigation, technology versions, public regressions, and authorization failures.
- `bun run --cwd apps/web lint`, `bun run --cwd apps/web typecheck`, and `bun run --cwd apps/web build` verify the application.

Admin browser tests use a test harness; they do not alter real portfolio content. A manual check in the owner's authenticated browser remains separate from those tests.
