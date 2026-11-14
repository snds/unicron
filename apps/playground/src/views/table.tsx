// Table: Synapse's lists and Warpcore's tables in replies (contract 5.1b #31). View: ?view=table
import { useState, type ReactNode } from "react"
import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-200 min-w-0 flex-col gap-4">{children}</div>
    </section>
  )
}

const AREAS = [
  { area: "Skills", count: "145", change: "+3 this week" },
  { area: "Knowledge", count: "1,204", change: "+12 today" },
  { area: "Harnesses", count: "9", change: "2 proposed" },
  { area: "Personas", count: "3", change: "11 accounts" },
]

const CHECKS = [
  { id: "K-14", check: "A knowledge note links to a missing file", where: "knowledge/legion", state: "Since 13:40" },
  { id: "S-03", check: "Skill has no trigger words", where: "skills/ux-copy", state: "Failing" },
  { id: "H-07", check: "Harness points at a renamed folder", where: "harness/visual-qa", state: "Failing" },
]

export default function TableView() {
  const [chosen, setChosen] = useState("S-03")
  const [node, setNode] = useState("skills/close-out/SKILL.md")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="A table // overline head, hairline rows, numbers in mono (Synapse workspace)">
        <Table>
          <TableCaption>Workspace // Personal, checked 15:37.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead numeric>Count</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {AREAS.map((row) => (
              <TableRow key={row.area}>
                <TableCell>{row.area}</TableCell>
                <TableCell numeric>{row.count}</TableCell>
                <TableCell>{row.change}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Specimen>

      <Specimen label="Selected row, header in view // failing checks in their own 112px scroll; a row is chosen by a press, or ↑ ↓ and Enter">
        <Table selectable stickyHeader label="Failing checks" containerClassName="max-h-28">
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Check</TableHead>
              <TableHead>Where</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CHECKS.map((row) => (
              <TableRow key={row.id} selected={chosen === row.id} onClick={() => setChosen(row.id)}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.check}</TableCell>
                <TableCell>{row.where}</TableCell>
                <TableCell>
                  <Badge tone={row.state === "Failing" ? "critical" : "neutral"}>{row.state}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Specimen>

      <Specimen label="Graph list // Synapse Y-15: the header stays in view, the chosen node's row is marked (SNA2)">
        <Table selectable stickyHeader label="Files in the graph" containerClassName="max-h-60">
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Region</TableHead>
              <TableHead numeric>Links out</TableHead>
              <TableHead numeric>Links in</TableHead>
              <TableHead numeric>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FILES.map((row) => (
              <TableRow key={row.file} selected={node === row.file} onClick={() => setNode(row.file)}>
                <TableCell>{row.file}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.region}</TableCell>
                <TableCell numeric>{row.out}</TableCell>
                <TableCell numeric>{row.in}</TableCell>
                <TableCell numeric>{row.issues}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Specimen>
    </div>
  )
}

const FILES = [
  { file: "decisions/memory-tiers.md", type: "decision", region: "context", out: "06", in: "14", issues: "00" },
  { file: "skills/close-out/SKILL.md", type: "skill", region: "skills", out: "11", in: "31", issues: "01" },
  { file: "frameworks/13-domain-rigor-stack.md", type: "framework", region: "frameworks", out: "09", in: "27", issues: "00" },
  { file: "knowledge/legion/_INDEX.md", type: "index", region: "knowledge", out: "42", in: "03", issues: "02" },
  { file: "projects/32-warpcore/SESSION-STATE.md", type: "baton", region: "projects", out: "08", in: "05", issues: "00" },
  { file: "skills/ux-copy/SKILL.md", type: "skill", region: "skills", out: "04", in: "12", issues: "01" },
  { file: "preferences/user-preferences.md", type: "preference", region: "preferences", out: "03", in: "48", issues: "00" },
  { file: "shared/workspace-ontology.md", type: "reference", region: "shared", out: "19", in: "36", issues: "00" },
]
