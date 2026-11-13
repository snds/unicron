// Tabs: the line variant is Figma's Top Tab (15:498); the default a square segmented control. View: ?view=tabs
import { Icon, Tabs, TabsContent, TabsList, TabsTrigger } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function TabsView() {
  return (
    <Page>
      <Specimen label="Line // Top Tab: overline, index, 2px primary indicator" column>
        <Tabs defaultValue="tasks">
          <TabsList variant="line" aria-label="Warpcore">
            <TabsTrigger value="chat" index="01">
              Chat
            </TabsTrigger>
            <TabsTrigger value="tasks" index="03">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="spend" index="04">
              Spend
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="messages">
          <TabsList variant="line" aria-label="Shared conversation">
            <TabsTrigger value="messages">
              <Icon name="chat" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="comments">
              <Icon name="edit" />
              Comments 03
            </TabsTrigger>
            <TabsTrigger value="files" disabled>
              <Icon name="attachment" />
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent value="messages">Cabin for the 20th, confirmed.</TabsContent>
        </Tabs>
      </Specimen>

      <Specimen label="Default // square segmented control, the chosen segment in inverted ink" column>
        <Tabs defaultValue="characters">
          <TabsList aria-label="Kind">
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="words">Words</TabsTrigger>
          </TabsList>
          <TabsContent value="characters">20 characters: letters, digits and symbols.</TabsContent>
        </Tabs>
        <Tabs defaultValue="week">
          <TabsList aria-label="Range">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </Specimen>

      <Specimen label="Vertical // line" column>
        <Tabs defaultValue="general" orientation="vertical">
          <TabsList variant="line" aria-label="Settings">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
        </Tabs>
      </Specimen>
    </Page>
  )
}
