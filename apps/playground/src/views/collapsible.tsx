// Collapsible: a part that opens on the motion-collapse recipe. View: ?view=collapsible
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Icon } from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

export default function CollapsibleView() {
  return (
    <Page>
      <Specimen label="Collapsible // closed to one line, open">
        <Column wide>
          <Collapsible defaultOpen>
            <div className="rule-t flex items-center justify-between py-3">
              <p className="type-overline">Runs with // 3</p>
              <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
                <Icon name="chevron--down" />
                Hide
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <ul className="type-ui flex flex-col pb-3">
                <li className="rule-t py-2">Claude Code // vale-dev</li>
                <li className="rule-t py-2">Tests // pnpm check</li>
                <li className="rule-t py-2">Reviewer // Sean</li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <div className="rule-t flex items-center justify-between py-3">
              <p className="type-overline">Older // 12</p>
              <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
                <Icon name="chevron--right" />
                Show
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <p className="type-caption pb-3 text-support-foreground">Twelve finished runs.</p>
            </CollapsibleContent>
          </Collapsible>
        </Column>
      </Specimen>
    </Page>
  )
}
