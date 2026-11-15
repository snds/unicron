// ScrollArea: a square thumb in the label ink. View: ?view=scroll-area
import { ScrollArea } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

const FOLDERS = ["Inbox", "Starred", "Drafts", "Sent", "Archive", "Receipts", "Travel", "Cabin 2026", "Newsletters", "Family", "School", "Taxes", "Work // Studio", "Work // Clients", "Recently deleted"]

export default function ScrollAreaView() {
  return (
    <Page>
      <Specimen label="ScrollArea // a list taller than its box">
        <div className="grid h-60 w-72 grid-rows-[minmax(0,1fr)] rule-box">
          <ScrollArea>
            <ul className="type-ui flex flex-col">
              {FOLDERS.map((folder, i) => (
                <li key={folder} className={`${i > 0 ? "rule-t " : ""}flex items-center justify-between px-4 py-2`}>
                  {folder}
                  <span className="type-folio text-muted-foreground">{String(i * 7 + 3).padStart(3, "0")}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </Specimen>
    </Page>
  )
}
