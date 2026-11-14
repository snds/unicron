// Prose: rendered Markdown in the body role (a note) and the response role (a reply). Not drawn
// in Figma; styled from the type roles alone. View: ?view=prose
import type { ReactNode } from "react"
import { CodeBlock, Prose } from "./_chat-ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-180 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

export default function ProseView() {
  return (
    <div className="flex flex-col gap-12 p-6">
      <Specimen label='Variant "response" // a reply in Warpcore'>
        <Prose variant="response">
          <p>
            Done. The diff is ready, and the tests are running in the cloud sandbox. Here is what changed and how to undo it.
          </p>
          <h2>What changes</h2>
          <p>
            Login now runs a <strong>two-message handshake</strong>. The SDK sends the first message before the password leaves the device, so the
            server never sees it.
          </p>
          <ol>
            <li>
              <code>loginStart(msg1)</code> goes from the SDK to the auth service.
            </li>
            <li>The auth service answers with its own message and a session key.</li>
            <li>
              <code>loginFinish(msg3)</code> proves the client knows the password.
            </li>
          </ol>
          <h3>Old clients</h3>
          <p>
            The server accepts both flows until Dec 12, then rejects the old one. See the <a href="?view=prose">rollback runbook</a>.
          </p>
          <blockquote>
            <p>Password never leaves the SDK.</p>
          </blockquote>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Added</th>
                <th>Removed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>sdk/src/login.ts</td>
                <td>+84</td>
                <td>−31</td>
              </tr>
              <tr>
                <td>server/auth/opaque.rs</td>
                <td>+128</td>
                <td>−17</td>
              </tr>
            </tbody>
          </table>
          <h4>Rollback</h4>
          <p>Revert the two commits and redeploy the auth service. Old clients keep working either way.</p>
        </Prose>
      </Specimen>

      <Specimen label='Variant "response" // a code block from the host is a CodeBlock'>
        <Prose variant="response">
          <p>Run the migration down, then the suite:</p>
        </Prose>
        <CodeBlock language="shell" code={"pnpm --filter auth migrate:down\npnpm --filter @unicron/ui test"} />
      </Specimen>

      <Specimen label='Variant "body" // a note in Lockdown'>
        <Prose>
          <h1>Router admin</h1>
          <p>
            The admin page is only reachable from the home network. Sign in with the <strong>admin</strong> account, not the guest one.
          </p>
          <ul>
            <li>Address: 192.168.1.1</li>
            <li>Firmware checks itself every Sunday at 03:00.</li>
          </ul>
          <hr />
          <p>
            Reset steps are on the <a href="?view=prose">vendor page</a>. Hold the reset pin for 10 seconds.
          </p>
        </Prose>
      </Specimen>
    </div>
  )
}
