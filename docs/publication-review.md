# Public content boundary

The public edition contains fictional technical examples. Internal project evidence is removed rather than merely relabeled. The allocation team and outbound team are generic teaching roles. Original notes remain local under the ignored `java mock resource/` directory.

## What is published

- The frontend and generated `public/data/*.json` are public. Answers, source references, legacy recall passages, and search titles must all be reviewed.
- `scripts/public_examples.py` sanitizes source records **before** consolidation or recall generation. Fictional product, customer/order, workshop, and outbox examples replace internal code and schemas.
- Content regeneration no longer automatically copies source images. The currently committed images have been visually inspected and contain generic technical diagrams, not internal architecture. Their redistribution rights still need confirmation; technical review is not a license grant.
- Library revision 3 discards active sessions from earlier revisions so cached question text cannot appear as a current session. Existing progress and bookmarks retain their stable IDs. User-created backups or previously saved copies may still contain older text.
- `npm test` scans every public text asset for known internal identifiers, private document URLs, and common secret formats. This is a regression guard, not a guarantee that arbitrary future confidential content will be detected.

## Before publishing

1. Run `npm run content` only when private local source notes are available; review generated changes before committing. Ordinary builds use committed JSON and do not need those notes.
2. Run `npm test` and `npm run build`. Inspect `dist/`, which is the actual Pages upload, including JSON and images rather than only visible pages.
3. Exclude credentials, employee/customer data, internal hostnames, private document links, real schema/code, production topology, and diagnostic dumps. Use fictional data and reserved example domains.
4. Review the staged changes, including removed source files. `.gitignore` does not remove files already tracked; source notes have been removed from the index while remaining on disk.
5. Review third-party source and image redistribution rights before publication.

## Previously published material

A normal cleanup commit does not erase previous Git commits, old workflow artifacts, clones, forks, downloaded backups, or external caches. Updating Pages replaces the current site only. If private material was already published, consider temporarily disabling Pages while cleaning up, and plan a coordinated history rewrite or a new clean repository. History rewriting changes commit IDs and may require force pushing; it is not performed by this cleanup. Previously exposed live credentials must be revoked/rotated rather than merely deleted. Repository privacy does not itself imply a private Pages site.
