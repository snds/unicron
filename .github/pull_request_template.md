<!--
unicron PR. Keep every section; write "n/a" rather than deleting one. This is the one-page spec
from docs/06-contributing.md → The loop → 3. Propose upstream. A PR that only touches docs or
tooling can fill in "What and why" and mark the rest n/a.
-->

## What and why

<!-- The job this solves, in plain words. Which consumer hit it. Why it is not an app-extension
     token or a variant of an existing primitive (the uniqueness rule). -->

## Anatomy

<!-- Slot tree: parts, what each is, which existing primitives it composes. -->

## States

<!-- default · hover · focus-visible · active · disabled · loading · error · empty · selected …
     and what changes in each (token, class, aria). -->

## Keyboard and screen reader

<!-- Tab order, keys handled, roles/names/states announced, focus management on open/close. -->

## Tokens used

<!-- Every token the component reads (tier 2 roles, tier 3 knobs). No raw values: `pnpm lint:tokens`
     must pass. New component knobs go in packages/tokens/tokens/component.json. -->

## DSA record id and origin app

<!-- `pnpm ds:patterns` record id (from .dsa/patterns.json) and the app it came from, e.g.
     "pattern-0007 · snds/mailbird #123". Write "none" for work that did not come from a candidate. -->

## Breaking? codemod link

<!-- No / Yes. If yes: what breaks for consumers, and a link to the codemod. A breaking change ships
     with a codemod or it does not ship (docs/06-contributing.md → 5. Release). -->

## Changeset added

- [ ] `pnpm changeset` run; `.changeset/*.md` is in this PR (patch · minor · major, and one line a
      consumer can act on). Not needed for docs-only or CI-only changes.
