// Chat Message, as Figma draws it (32:103), and its states. View: ?view=chat-message
import type { ReactNode } from "react"
import { Button, IconButton, Popover, PopoverContent, PopoverTrigger } from "@unicron/ui"
import { ChatMessage, ChatMessageMetaButton, CopyButton, Prose } from "./_chat-ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-180 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  )
}

const REPLY = "Login now runs a two-message handshake. The SDK sends the first message before the password leaves the device, so the server never sees it."

export default function ChatMessageView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Role // user and agent, as Figma 32:96 and 32:100 (phone, Chat — conversation)">
        <ChatMessage role="user" meta="You // 14:02">
          Why did the OPAQUE migration touch the client SDK?
        </ChatMessage>
        <ChatMessage role="agent" meta="Claude Code // 14:03">
          {REPLY}
        </ChatMessage>
        <ChatMessage role="user" meta="You // 14:05">
          Does an old app version still log in?
        </ChatMessage>
        <ChatMessage role="agent" meta="Claude Code // 14:05">
          Yes, for 30 days. The server accepts both flows until Dec 12, then rejects the old one.
        </ChatMessage>
      </Specimen>

      <Specimen label="Bubble // hugs a short message, wraps at 300">
        <ChatMessage role="user" meta="You // 14:06">
          Ship it.
        </ChatMessage>
        <ChatMessage role="user" meta="You // 14:05">
          Draw the new login flow so I can share it with the team.
        </ChatMessage>
      </Specimen>

      <Specimen label="Streaming // waiting, thinking, writing, stopping; the orb and the phase join the meta">
        <ChatMessage role="agent" meta="General" phase="waiting" orb="queued" state="streaming" />
        <ChatMessage role="agent" meta="General" phase="thinking" orb="thinking" state="streaming" />
        <ChatMessage role="agent" meta="General" phase="writing" state="streaming">
          Yes, for 30 days. The server accepts both flows
        </ChatMessage>
        <ChatMessage role="agent" meta="General" phase="stopping // fallback" state="streaming">
          Yes, for 30 days.
        </ChatMessage>
      </Specimen>

      <Specimen label="Finished // meta as a button, end marks, actions (hover or focus with a pointer, always on touch)">
        <ChatMessage
          role="agent"
          meta={
            <>
              <Popover>
                <PopoverTrigger render={<ChatMessageMetaButton aria-label="Answered by General. Show details." />}>General</PopoverTrigger>
                <PopoverContent>
                  <p className="type-caption">Model qwen3.6:35b // Your desktop // 1,204 in, 380 out // $0.00</p>
                </PopoverContent>
              </Popover>
              {" // 14:03 // cloud"}
            </>
          }
          endMarks={["cut off"]}
          actions={<CopyButton text={REPLY} />}
        >
          {REPLY}
        </ChatMessage>
        <ChatMessage
          role="user"
          meta="You // 14:05"
          actions={
            <>
              <IconButton icon="edit" label="Edit" size="icon-sm" />
              <CopyButton text="Does an old app version still log in?" />
            </>
          }
        >
          Does an old app version still log in?
        </ChatMessage>
        <ChatMessage role="agent" meta="General // 14:07" endMarks={["stopped"]}>
          The server keeps both flows until
        </ChatMessage>
      </Specimen>

      <Specimen label="Error // the newest message got no reply: the server's words and Try again">
        <ChatMessage
          role="user"
          meta="You // 14:08"
          state="error"
          error="No reply came. The model took too long to answer."
          retry={
            <Button size="sm" variant="secondary">
              Try again
            </Button>
          }
        >
          Draft the release note for SEA-51.
        </ChatMessage>
        <ChatMessage
          role="agent"
          meta="General // 14:09"
          state="error"
          error="Spend is paused at the daily cap of $10.00."
          retry={
            <Button size="sm" variant="secondary">
              Try again
            </Button>
          }
        />
      </Specimen>

      <Specimen label="Rich body // the host renders Markdown with Prose">
        <ChatMessage role="agent" meta="Codex // 13:12">
          <Prose variant="response">
            <p>Two changes keep old clients working:</p>
            <ul>
              <li>
                The server accepts <code>loginStart</code> without a client proof until Dec 12.
              </li>
              <li>The SDK retries once with the old flow when it gets a 426.</li>
            </ul>
          </Prose>
        </ChatMessage>
      </Specimen>
    </div>
  )
}
