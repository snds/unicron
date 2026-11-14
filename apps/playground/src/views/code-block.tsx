// Code Block and the copy button: code or output to read and copy. Not drawn in Figma.
// View: ?view=code-block
import type { ReactNode } from "react"
import { CodeBlock, CopyButton } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-180 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

const ARGS = JSON.stringify({ repo: "snds/lockdown", branch: "claude/opaque-login", base: "main", draft: true }, null, 2)
const LOG = "14:06 test-suite  PASS  sdk/src/login.test.ts (128 tests, 41.2s) — loginStart, loginFinish, retryWithLegacyFlow, rejectAfterCutoff"

export default function CodeBlockView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Label and copy // a tool call's arguments in Synapse">
        <CodeBlock label="What the agent wrote // not checked" code={ARGS} />
      </Specimen>

      <Specimen label="Language as the label // a command to copy">
        <CodeBlock language="shell" code="pnpm --filter @unicron/ui test" />
      </Specimen>

      <Specimen label="A long line // scrolls sideways inside; or wraps">
        <CodeBlock label="Output // stdout" code={LOG} />
        <CodeBlock label="Output // stdout, wrapped" code={LOG} wrap />
      </Specimen>

      <Specimen label="No header // copy off, no label">
        <CodeBlock code={"exit 1\nerror: 1 test failed in sdk/src/login.test.ts"} copy={false} />
      </Specimen>

      <Specimen label="Copy button // alone: Copied for two seconds, no toast">
        <div className="flex items-center gap-3">
          <CopyButton text="claude/opaque-login" label="Copy branch name" />
          <span className="type-code-inline">claude/opaque-login</span>
        </div>
      </Specimen>
    </div>
  )
}
