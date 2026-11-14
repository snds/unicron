// Agent Prompt in the needs-you look (Figma 15:517's field), the safe answer solid and focused
// (cross-app decisions §2). View: ?view=agent-prompt
import { useState, type ReactNode } from "react"
import { AgentPrompt, AGENT_PROMPT_REPLY, Button } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-162 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

const TASK_OPTIONS = [
  { id: "deny", label: "Deny", safe: true },
  { id: "once", label: "Allow once" },
  { id: "always", label: "Always for Lockdown", key: "3" },
]

export default function AgentPromptView() {
  const [expiresAt] = useState(() => Date.now() + (28 * 60 + 14) * 1000)
  const [soon] = useState(() => Date.now() + 45 * 1000)
  const [round, setRound] = useState(0)
  const [answer, setAnswer] = useState<string | undefined>()

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Live // keys by meaning (Y allows once, N denies, 3 always); the safe answer takes focus">
        <AgentPrompt
          key={round}
          kind="permission"
          overline="Question"
          expiresAt={expiresAt}
          safeAnswer="deny"
          onExpire={() => {}}
          options={TASK_OPTIONS}
          answer={answer}
          onAnswer={(id) => setAnswer(id)}
        >
          Run pnpm install in the cloud sandbox for SEA-51?
        </AgentPrompt>
        <div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setAnswer(undefined)
              setRound((n) => n + 1)
            }}
          >
            Ask again
          </Button>
        </div>
      </Specimen>

      <Specimen label="Permission // more wait after this one">
        <AgentPrompt kind="permission" overline="Ask first // GitHub" more={1} listen={false} autoFocus={false} onAnswer={() => {}}>
          create_pull_request on GitHub, as sean-work, the identity your rules chose.
        </AgentPrompt>
      </Specimen>

      <Specimen label="Countdown under a minute // NN S">
        <AgentPrompt kind="permission" overline="Ask first // Figma" expiresAt={soon} safeAnswer="deny" onExpire={() => {}} listen={false} autoFocus={false} onAnswer={() => {}}>
          get_design_context on Figma, as sean, the identity your rules chose.
        </AgentPrompt>
      </Specimen>

      <Specimen label="An open question // Reply stays solid; Deny is the text way out">
        <AgentPrompt
          kind="reply"
          overline="Question"
          sendLabel="Reply"
          options={[{ id: "deny", label: "Deny", safe: true }]}
          listen={false}
          autoFocus={false}
          onAnswer={() => {}}
        >
          Which branch should the fix land on: main, or the open release branch release/1.6?
        </AgentPrompt>
      </Specimen>

      <Specimen label="Choice // long options become numbered rows; the safe one is solid">
        <AgentPrompt
          kind="choice"
          overline="Choose // SEA-48"
          listen={false}
          autoFocus={false}
          onAnswer={() => {}}
          options={[
            { id: "skip", label: "Skip the drift check this run", detail: "The baseline stays as it is; the next run checks again.", safe: true },
            { id: "patch", label: "Patch the baseline", detail: "Update the three snapshots that moved, and commit them to the branch." },
            { id: "rewrite", label: "Rewrite the check", detail: "Replace pixel snapshots with a token diff. Slower to land." },
          ]}
        >
          The baseline drift check found 3 changed snapshots. What should happen?
        </AgentPrompt>
      </Specimen>

      <Specimen label="Sending // the chosen answer spins; nothing else can be picked">
        <AgentPrompt kind="permission" overline="Question" answer="once" pending options={TASK_OPTIONS} listen={false} autoFocus={false} onAnswer={() => {}}>
          Run pnpm install in the cloud sandbox for SEA-51?
        </AgentPrompt>
      </Specimen>

      <Specimen label="Failed // the line says why, and it can be answered again">
        <AgentPrompt
          kind="permission"
          overline="Ask first // GitHub"
          error="That call is no longer waiting."
          listen={false}
          autoFocus={false}
          onAnswer={() => {}}
        >
          create_pull_request on GitHub, as sean-work.
        </AgentPrompt>
      </Specimen>

      <Specimen label="Answered // quiet: the raised surface, the answer marked">
        <AgentPrompt kind="permission" overline="Question" answer="deny" options={TASK_OPTIONS} onAnswer={() => {}}>
          Run pnpm install in the cloud sandbox for SEA-51?
        </AgentPrompt>
        <AgentPrompt kind="reply" overline="Question" answer={AGENT_PROMPT_REPLY} sendLabel="Reply" onAnswer={() => {}}>
          Which branch should the fix land on?
        </AgentPrompt>
      </Specimen>
    </div>
  )
}
