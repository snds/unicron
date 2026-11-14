// Tooltip: inverted ink, the caption role, square, no arrow; with keys; wrapping at its most
// width. View: ?view=tooltip
import { Button, Icon, Kbd, Tooltip, TooltipContent, TooltipTrigger } from "@unicron/ui"

import { Specimen } from "./_stage"

export default function TooltipView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <div className="flex flex-wrap gap-x-16 gap-y-10 pt-16">
        <Specimen label="Plain // a name for an icon-only control">
          <Tooltip open>
            <TooltipTrigger render={<Button variant="secondary" size="icon" aria-label="Archive" />}>
              <Icon name="archive" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Archive</TooltipContent>
          </Tooltip>
        </Specimen>

        <Specimen label="With keys // a Kbd takes the tip's ink">
          <Tooltip open>
            <TooltipTrigger render={<Button variant="secondary" size="icon" aria-label="Search" />}>
              <Icon name="search" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Search <Kbd>/</Kbd>
            </TooltipContent>
          </Tooltip>
        </Specimen>

        <Specimen label="Long // wraps at 320 (--c-tooltip-max-width)">
          <Tooltip open>
            <TooltipTrigger render={<Button variant="secondary" size="icon" aria-label="Sample data" />}>
              <Icon name="information" />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              Sample data: the engine doesn't provide this yet
            </TooltipContent>
          </Tooltip>
        </Specimen>

        <Specimen label="Theme // light and dark appear only here (decisions §5)">
          <Tooltip open>
            <TooltipTrigger render={<Button variant="secondary" size="icon" aria-label="Stone" />}>
              <Icon name="settings" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Stone is the light ground. Graphite is the dark one.</TooltipContent>
          </Tooltip>
        </Specimen>
      </div>
    </div>
  )
}
