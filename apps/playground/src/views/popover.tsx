// Popover, solid and square, with PopoverHeader (overline, title; a close when asked for); one
// over the menu scrim (Warpcore's environment picker, rules 8.13). View: ?view=popover
import {
  Button,
  FloatButton,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Switch,
} from "@unicron/ui"

import { Specimen, Stage } from "./_stage"

function Choice({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="rule-t flex items-baseline justify-between gap-4 py-3">
      <span className="type-ui">{name}</span>
      {/* On the name's baseline: a 20px line of 12px type reaches 1px under a 20px line of 15px type,
          and that pixel comes off its margin, so the row stays 44 (as LogRow's time). */}
      <span className="type-meta -mb-px">{meta}</span>
    </div>
  )
}

export default function PopoverView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <div className="flex flex-wrap gap-10">
        <Specimen label="PopoverHeader // overline, title, and a close when asked for (Warpcore U-08)">
          <div className="h-[340px] w-[360px] max-w-full">
            <Popover open modal={false}>
              <PopoverTrigger render={<Button variant="secondary" />}>Who answers</PopoverTrigger>
              <PopoverContent align="start">
                <PopoverHeader overline="Who answers // 03" title="Pick a model" showCloseButton />
                <div className="flex flex-col">
                  <Choice name="Claude Opus 5.5" meta="Anthropic" />
                  <Choice name="qwen3-32b" meta="Local" />
                  <Choice name="Auto" meta="OpenRouter" />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </Specimen>

        <Specimen label="Composed // a title and a description, no close">
          <div className="h-[340px] w-[360px] max-w-full">
            <Popover open modal={false}>
              <PopoverTrigger render={<Button variant="secondary" />}>Workspace context</PopoverTrigger>
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverTitle>Workspace context</PopoverTitle>
                  <PopoverDescription>What the model reads before it answers in this chat.</PopoverDescription>
                </PopoverHeader>
                <div className="flex items-center justify-between gap-4">
                  <span className="type-ui">Include open files</span>
                  <Switch defaultChecked aria-label="Include open files" />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </Specimen>
      </div>

      <Stage label="Over the menu scrim // the environment picker opens from its chip in place" width={720} height={420} app="warpcore">
        {(container) => (
          <div className="absolute bottom-6 left-6">
            <Popover open modal={false}>
              <PopoverTrigger render={<FloatButton label="Environment" icon="laptop" size="l" />} />
              <PopoverContent container={container} side="top" align="start" sideOffset={8} scrim>
                <PopoverHeader overline="Environment // 03" title="Where it runs" />
                <div className="flex flex-col">
                  <Choice name="sean-mbp" meta="This Mac" />
                  <Choice name="build-01" meta="Linux // 64 GB" />
                  <Choice name="Cloud sandbox" meta="Anthropic" />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </Stage>
    </div>
  )
}
