// Diff Block: the diffs on Warpcore's Review diff and Synapse's harness review (contract 5.1a, 5.1b #43). View: ?view=diff-block
import type { ReactNode } from "react"
import { Badge, DiffBlock, type DiffLine, parseUnifiedDiff } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-224 min-w-0 flex-col gap-4">{children}</div>
    </section>
  )
}

// Warpcore, Review diff (SEA-51): the lines Figma draws for server/auth/login.ts.
const LOGIN: DiffLine[] = [
  { kind: "context", text: "export async function login(req: LoginRequest) {" },
  { kind: "removed", text: "  const hash = await argon2.hash(req.password)" },
  { kind: "removed", text: "  const user = await db.users.byHash(req.email, hash)" },
  { kind: "added", text: "  const msg1 = req.opaqueStart" },
  { kind: "added", text: "  const { msg2, state } = await opaque.serverStart(msg1, record)" },
  { kind: "added", text: "  await sessions.hold(state, { ttl: 60 })" },
  { kind: "added", text: "  return { msg2 }" },
  { kind: "context", text: "}" },
]

// Synapse, harness change H-09: the lines Figma draws for harness/visual-qa/config.ts.
const CONFIG = `-checks: [baselineGrid, neighborSpacing]
+checks: [baselineGrid, neighborSpacing, baselineDrift]
+baselineDrift: { maxPx: 2, on: 'save' }
`

// A real patch from this repository: commit 7566c00, "Version Packages" (nine files).
const VERSION_PACKAGES = "diff --git a/.changeset/agent-prompt-deadline-reply.md b/.changeset/agent-prompt-deadline-reply.md\ndeleted file mode 100644\nindex b430836..0000000\n--- a/.changeset/agent-prompt-deadline-reply.md\n+++ /dev/null\n@@ -1,5 +0,0 @@\n----\n-\"@unicron/ui\": minor\n----\n-\n-AgentPrompt: `kind=\"reply\"` takes words (Enter sends); `pending` and `error` cover sending and a failed send; `expiresAt` + `safeAnswer` count down and answer with the safe option when time runs out (`onExpire` to let the server do it). `onAnswer` gets the reply text as a second argument.\ndiff --git a/.changeset/indicator-on-controls.md b/.changeset/indicator-on-controls.md\ndeleted file mode 100644\nindex 2c80789..0000000\n--- a/.changeset/indicator-on-controls.md\n+++ /dev/null\n@@ -1,5 +0,0 @@\n----\n-\"@unicron/ui\": minor\n----\n-\n-`indicator` prop on Button, IconButton and ToggleGroupItem, as on AppFrameNavItem and Item: a dot in the top-right corner, and the words in the name (\"Tasks, 2 waiting for you\"). Apps can drop their own IndicatorMark placement rules.\ndiff --git a/.changeset/run-trace-lean-mask.md b/.changeset/run-trace-lean-mask.md\ndeleted file mode 100644\nindex 910cbd1..0000000\n--- a/.changeset/run-trace-lean-mask.md\n+++ /dev/null\n@@ -1,5 +0,0 @@\n----\n-\"@unicron/ui\": patch\n----\n-\n-RunTrace fades its reasoning with a plain mask-image instead of Tailwind's mask-t-* utilities, so no app ships their @property rules: 0.2 KB gzipped off every app's CSS. No visual change.\ndiff --git a/.changeset/run-trace-waiting-marks.md b/.changeset/run-trace-waiting-marks.md\ndeleted file mode 100644\nindex 177e7f3..0000000\n--- a/.changeset/run-trace-waiting-marks.md\n+++ /dev/null\n@@ -1,5 +0,0 @@\n----\n-\"@unicron/ui\": minor\n----\n-\n-RunTrace: a step can be `needs-you` (waiting on an answer), and the run's line shows it while live. New `marks` prop puts answers, stops and pauses between steps, one quiet line each. Stopped steps and runs use the new `stopped` orb.\ndiff --git a/.changeset/status-orb-queued-paused-stopped.md b/.changeset/status-orb-queued-paused-stopped.md\ndeleted file mode 100644\nindex 2c9d84a..0000000\n--- a/.changeset/status-orb-queued-paused-stopped.md\n+++ /dev/null\n@@ -1,6 +0,0 @@\n----\n-\"@unicron/ui\": minor\n-\"@unicron/tokens\": minor\n----\n-\n-StatusOrb: add `queued`, `paused` and `stopped`, each a still glyph (clock, pause, stop) on its own `--c-status-orb-*` token. A run someone stopped no longer has to borrow `idle`.\ndiff --git a/packages/tokens/CHANGELOG.md b/packages/tokens/CHANGELOG.md\nindex f903e5a..05661c6 100644\n--- a/packages/tokens/CHANGELOG.md\n+++ b/packages/tokens/CHANGELOG.md\n@@ -1,5 +1,11 @@\n # @unicron/tokens\n \n+## 0.16.0\n+\n+### Minor Changes\n+\n+- 7b3fc1c: StatusOrb: add `queued`, `paused` and `stopped`, each a still glyph (clock, pause, stop) on its own `--c-status-orb-*` token. A run someone stopped no longer has to borrow `idle`.\n+\n ## 0.15.0\n \n ### Minor Changes\ndiff --git a/packages/tokens/package.json b/packages/tokens/package.json\nindex 639cce5..b549904 100644\n--- a/packages/tokens/package.json\n+++ b/packages/tokens/package.json\n@@ -1,6 +1,6 @@\n {\n   \"name\": \"@unicron/tokens\",\n-  \"version\": \"0.15.0\",\n+  \"version\": \"0.16.0\",\n   \"description\": \"unicron design tokens: DTCG JSON source, three tiers (global \u2192 semantic \u2192 component), built to CSS custom properties and a Tailwind v4 theme map.\",\n   \"license\": \"Apache-2.0\",\n   \"author\": \"Sean Sands\",\ndiff --git a/packages/ui/CHANGELOG.md b/packages/ui/CHANGELOG.md\nindex 7801dca..24acd2d 100644\n--- a/packages/ui/CHANGELOG.md\n+++ b/packages/ui/CHANGELOG.md\n@@ -1,5 +1,20 @@\n # @unicron/ui\n \n+## 0.24.0\n+\n+### Minor Changes\n+\n+- 9e46ed1: AgentPrompt: `kind=\"reply\"` takes words (Enter sends); `pending` and `error` cover sending and a failed send; `expiresAt` + `safeAnswer` count down and answer with the safe option when time runs out (`onExpire` to let the server do it). `onAnswer` gets the reply text as a second argument.\n+- 3b2b83c: `indicator` prop on Button, IconButton and ToggleGroupItem, as on AppFrameNavItem and Item: a dot in the top-right corner, and the words in the name (\"Tasks, 2 waiting for you\"). Apps can drop their own IndicatorMark placement rules.\n+- f995814: RunTrace: a step can be `needs-you` (waiting on an answer), and the run's line shows it while live. New `marks` prop puts answers, stops and pauses between steps, one quiet line each. Stopped steps and runs use the new `stopped` orb.\n+- 7b3fc1c: StatusOrb: add `queued`, `paused` and `stopped`, each a still glyph (clock, pause, stop) on its own `--c-status-orb-*` token. A run someone stopped no longer has to borrow `idle`.\n+\n+### Patch Changes\n+\n+- 79a2d40: RunTrace fades its reasoning with a plain mask-image instead of Tailwind's mask-t-* utilities, so no app ships their @property rules: 0.2 KB gzipped off every app's CSS. No visual change.\n+- Updated dependencies [7b3fc1c]\n+  - @unicron/tokens@0.16.0\n+\n ## 0.23.0\n \n ### Minor Changes\ndiff --git a/packages/ui/package.json b/packages/ui/package.json\nindex 14f3260..726ea79 100644\n--- a/packages/ui/package.json\n+++ b/packages/ui/package.json\n@@ -1,6 +1,6 @@\n {\n   \"name\": \"@unicron/ui\",\n-  \"version\": \"0.23.0\",\n+  \"version\": \"0.24.0\",\n   \"description\": \"unicron React primitives: shadcn/ui (base-nova style) on Base UI, Material Symbols icons, styled with Tailwind v4 against @unicron/tokens.\",\n   \"license\": \"Apache-2.0\",\n   \"author\": \"Sean Sands\",\n"

export default function DiffBlockView() {
  const files = parseUnifiedDiff(VERSION_PACKAGES)
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="One file // as Warpcore draws it: + and − always show; added on the neutral wash">
        <DiffBlock path="server/auth/login.ts" state="modified" additions={34} deletions={41} lines={LOGIN} />
      </Specimen>

      <Specimen label="Wrap // Synapse H-09 at 360 wide: wrapped, then scrolling sideways">
        <div className="w-90">
          <DiffBlock path="harness/visual-qa/config.ts" state="modified" diff={CONFIG} defaultWrap />
        </div>
        <div className="w-90">
          <DiffBlock path="harness/visual-qa/config.ts" state="modified" diff={CONFIG} />
        </div>
      </Specimen>

      <Specimen label="File states // the four words">
        <div className="flex flex-wrap gap-3">
          <Badge>Added</Badge>
          <Badge>Modified</Badge>
          <Badge>Deleted</Badge>
          <Badge>Renamed</Badge>
        </div>
      </Specimen>

      <Specimen label="Many files // commit 7566c00 with line numbers: the first open, the rest folded; long files wait behind Show more">
        {files.map((file, i) => (
          <DiffBlock
            key={file.path}
            path={file.path}
            previousPath={file.previousPath}
            state={file.state}
            lines={file.lines}
            foldable
            lineNumbers
            defaultOpen={i === 0 || file.path === "packages/ui/CHANGELOG.md"}
            maxLines={8}
          />
        ))}
      </Specimen>
    </div>
  )
}
