---
name: Promotion candidate
about: A consumer proposes a component or recipe from its app-extension layer for the core
title: "promote: <component name>"
labels: ["promotion"]
assignees: ["snds"]
---

<!-- docs/06-contributing.md → The loop. Fill this in before opening the PR, or instead of a PR when
     you want a steer first. Core answers with one of: pattern · variant of <parent> · declined (and why). -->

## Origin

- App and repo: <!-- e.g. snds/mailbird -->
- Where it lives today: <!-- path to the app-extension component -->
- DSA record id: <!-- from `pnpm ds:patterns` → .dsa/patterns.json, e.g. pattern-0007; "none" if hand-raised -->
- Repeats: <!-- N times across M hosts; across apps (strong) or within one app (hint) -->

## The job

<!-- One sentence: what a user does with it. -->

## Why it is not already covered

<!-- The nearest existing primitive or pattern, and why this is a different job and anatomy
     (uniqueness rule). If it shares a parent, propose it as a variant instead. -->

## One-page spec (draft)

- Anatomy:
- States:
- Keyboard and screen reader:
- Tokens used: <!-- semantic roles only; any new tier-3 knob named here -->

## Ratchet effect

<!-- Which overrides in your app this promotion would remove (your `dsa ratchet` count goes down). -->
