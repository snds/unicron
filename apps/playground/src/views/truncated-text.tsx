// TruncatedText: one line with an ellipsis, a clamp at two lines, a cut in the middle for paths
// and hosts; the full text in a tooltip on hover and focus, and only when cut. View: ?view=truncated-text
import { useEffect, useRef, type ReactNode } from "react"
import { TruncatedText } from "@unicron/ui"

import { Specimen } from "./_stage"

function Box({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div className="rule-box flex flex-col gap-1 p-3" style={{ width, maxWidth: "100%" }}>
      {children}
    </div>
  )
}

export default function TruncatedTextView() {
  const focused = useRef<HTMLDivElement>(null)
  // Focus the first cut text, so the picture shows its tooltip: what a keyboard user sees.
  useEffect(() => {
    // It is cut once it has measured itself; then focus it.
    const id = window.setInterval(() => {
      const cut = focused.current?.querySelector<HTMLElement>("[data-truncated]")
      if (!cut) return
      cut.focus()
      window.clearInterval(id)
    }, 50)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-10 p-6 pt-20 max-sm:p-4 max-sm:pt-20">
      <div className="flex flex-wrap gap-10">
        <Specimen label="End // a row title, cut; focused, the full text opens from the element, from the start of the line">
          <div ref={focused}>
            <Box width={240}>
              <span className="type-subtitle">
                <TruncatedText side="top">Your November statement is ready to download</TruncatedText>
              </span>
              <span className="type-meta">Ledger Bank // 08:02</span>
            </Box>
          </div>
        </Specimen>

        <Specimen label="Fits // plain text: no tab stop, no tooltip">
          <Box width={240}>
            <span className="type-subtitle">
              <TruncatedText>Steam</TruncatedText>
            </span>
            <span className="type-meta">store.steampowered.com</span>
          </Box>
        </Specimen>

        <Specimen label="Lines // row titles clamp at two (Synapse Y-03)">
          <Box width={280}>
            <span className="type-ui-emphasis">
              <TruncatedText lines={2}>Every persona has one id, and two personas in this workspace share the id reviewer</TruncatedText>
            </span>
          </Box>
        </Specimen>
      </div>

      <div className="flex flex-wrap gap-10">
        <Specimen label="Middle // paths keep their file name (Warpcore U-09)">
          <Box width={240}>
            <span className="type-code-inline">
              <TruncatedText cut="middle">~/code/synapse/apps/desktop/src/features/graph/stage.tsx</TruncatedText>
            </span>
          </Box>
        </Specimen>

        <Specimen label="Middle // hosts keep their domain (Lockdown X6)">
          <Box width={200}>
            <span className="type-meta">
              <TruncatedText cut="middle">login.microsoftonline.com.accounts.example.org</TruncatedText>
            </span>
          </Box>
        </Specimen>

        <Specimen label="Middle, fits // drawn once">
          <Box width={200}>
            <span className="type-meta">
              <TruncatedText cut="middle">spotify.com</TruncatedText>
            </span>
          </Box>
        </Specimen>
      </div>

      <Specimen label="Pointer // hover anywhere along a cut line: the full text opens at that spot and stays there while the pointer moves; it wraps between 192 and 352 (Synapse f-hovercard, SNA3)">
        <div data-pointer-specimen="" className="flex flex-col gap-1">
          <Box width={360}>
            <span className="type-ui-emphasis">
              <TruncatedText>identity.unique failed on 3 personas: reviewer, reviewer-2 and the imported Legion reviewer share one id</TruncatedText>
            </span>
            <span className="type-meta">
              <TruncatedText cut="middle">knowledge/decisions/2026-11-07-persona-ids-are-unique-across-workspaces.md</TruncatedText>
            </span>
          </Box>
        </div>
      </Specimen>
    </div>
  )
}
