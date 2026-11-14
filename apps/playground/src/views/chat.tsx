// The chat parts together, as Warpcore's conversation column draws them (Chat workspace 01,
// Figma 45:2087; on a phone, Mobile 01, 37:45): messages 20 apart, artifact cards in the stream,
// the chips 20 above the composer. The page head, the inline task row and the chips themselves are
// other areas' parts; plain stand-ins hold their places. View: ?view=chat
import { ArtifactCard, Badge, ChatMessage, Composer, CopyButton } from "@unicron/ui"

export default function ChatView() {
  return (
    <div className="flex min-h-svh justify-center px-4 py-6 md:px-6">
      <div className="flex w-full max-w-180 flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="type-overline">Chat // SEA-51 // Claude Code</p>
          <h1 className="type-subtitle">OPAQUE login</h1>
        </header>
        <div className="flex flex-1 flex-col gap-5">
          <ChatMessage role="user" meta="You // 14:02">
            Split the OPAQUE migration into a diff I can review, and run the full test suite in the background.
          </ChatMessage>
          <ChatMessage role="agent" meta="Claude Code // 14:03" actions={<CopyButton text="Done. The diff is ready, and the tests are running in the cloud sandbox. I'll post here when they finish." />}>
            Done. The diff is ready, and the tests are running in the cloud sandbox. I'll post here when they finish.
          </ChatMessage>
          <ArtifactCard title="OPAQUE migration diff" meta="Diff // 6 files // +212 −48 // v2" />
          <ChatMessage role="user" meta="You // 14:05">
            Draw the new login flow so I can share it with the team.
          </ChatMessage>
          <ChatMessage role="agent" meta="Claude Code // 14:06">
            Here's the handshake as a sequence. Two messages, and the password never leaves the device.
          </ChatMessage>
          <ArtifactCard icon="flow" title="Login flow" meta="Diagram // 2 messages // v1" selected />
          <ChatMessage role="agent" meta="Claude Code" phase="writing" state="streaming">
            The suite is at 41 of 128. So far
          </ChatMessage>
        </div>
        <Composer
          placeholder="Ask about SEA-51, or @ a file"
          streaming
          chips={
            <>
              <Badge>snds/lockdown</Badge>
              <Badge>claude/opaque-login</Badge>
              <Badge>Cloud sandbox</Badge>
            </>
          }
        />
      </div>
    </div>
  )
}
