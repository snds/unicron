// Task Row: one task or thread (Figma 143:633). View: ?view=task-row
import { TaskRow } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function TaskRowView() {
  return (
    <Page>
      <Specimen label="Task Row: default, selected, unread" column>
        <ul className="flex w-90 flex-col gap-1">
          <li>
            <TaskRow state="working" title="Back up before each deploy" time="now" line="Step 2 of 4: adding the backup" meta="Claude Code · server · 12 min" />
          </li>
          <li>
            <TaskRow state="needs-you" title="Rotate the sign-in token" time="4 min" line="Asks whether to keep the old file" meta="Codex · laptop · 31 min" selected />
          </li>
          <li>
            <TaskRow state="done" title="Write the release notes" time="1 h" line="Done: 6 sections, 2 links checked" meta="Claude Code · cloud · 8 min" unread />
          </li>
          <li>
            <TaskRow state="failed" title="Run the browser checks" time="2 h" line="3 of 662 checks failed" meta="Claude Code · server · 5 min" />
          </li>
          <li>
            <TaskRow state="queued" title="Pack the 2.0 package" time="2 h" />
          </li>
        </ul>
      </Specimen>
    </Page>
  )
}
