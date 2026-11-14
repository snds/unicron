// File Chip: the attachment on Vale's message (contract 5.1a, 5.1b #30). View: ?view=file-chip
import type { ReactNode } from "react"
import { Button, Icon } from "@unicron/ui"
import { FileChip } from "../../../../packages/ui/src/components/ui/file-chip"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  )
}

export default function FileChipView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // type tag, name, size; a link that opens the file (Vale)">
        <FileChip name="Pine Hollow booking.pdf" type="PDF" size="84 KB" href="#pine-hollow-booking" />
      </Specimen>

      <Specimen label="Press, trailing action // a button; Save and Remove beside it, never inside">
        <FileChip
          name="Pine Hollow booking.pdf"
          size="84 KB"
          onClick={() => undefined}
          action={
            <Button variant="ghost" size="icon-sm" aria-label="Save Pine Hollow booking.pdf">
              <Icon name="download" />
            </Button>
          }
        />
        <FileChip
          name="Pine Hollow booking.pdf"
          size="84 KB"
          action={
            <Button variant="ghost" size="icon-sm" aria-label="Remove Pine Hollow booking.pdf">
              <Icon name="close" />
            </Button>
          }
        />
      </Specimen>

      <Specimen label="Busy, critical // on its way; what is wrong in place of the size">
        <FileChip name="Pine Hollow booking.pdf" size="84 KB" busy />
        <FileChip
          name="Pine Hollow booking.pdf"
          critical="Too big to send"
          action={
            <Button variant="ghost" size="icon-sm" aria-label="Remove Pine Hollow booking.pdf">
              <Icon name="close" />
            </Button>
          }
        />
      </Specimen>

      <Specimen label="No type given // the tag is the name's extension">
        <FileChip name="0042_opaque.sql" size="2 KB" href="#migration" />
        <FileChip name="auth.md" size="6 KB" href="#auth" />
      </Specimen>
    </div>
  )
}
