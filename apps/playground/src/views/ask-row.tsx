// Ask Row: one ask from a session, answered in one click (Figma 216:787). View: ?view=ask-row
import { useState } from "react"
import { AskRow } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

const CHOICES = [{ label: "Keep for a week", recommended: true }, { label: "Delete now" }, { label: "Keep it" }]

function Live() {
  const [answer, setAnswer] = useState<string | null>(null)
  return (
    <AskRow
      question="Keep the old token file for a week?"
      source="Windows sign-in helper · Codex · 4 min"
      choices={CHOICES}
      onChoose={setAnswer}
      answer={answer}
      onUndo={() => setAnswer(null)}
      openLabel="Open in Warpcore"
      onOpen={() => {}}
    />
  )
}

export default function AskRowView() {
  return (
    <Page>
      <Specimen label="Choices, open-ended, answered" column>
        <div className="flex w-95 flex-col gap-2">
          <Live />
          <AskRow question="What should the release notes lead with?" source="Release notes · Claude Code · 12 min" replyLabel="Reply in Warpcore" onReply={() => {}} openLabel="Open in Warpcore" onOpen={() => {}} />
          <AskRow question="Keep the old token file for a week?" source="Windows sign-in helper · Codex · 4 min" choices={CHOICES} answer="Keep for a week" onUndo={() => {}} openLabel="Open in Warpcore" onOpen={() => {}} />
        </div>
      </Specimen>
    </Page>
  )
}
