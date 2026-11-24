// Tabs: every variant is Figma's Pill Tab (15:498), the chosen tab on the neutral 8% fill. View: ?view=tabs
import { Icon, Tabs, TabsContent, TabsList, TabsTrigger } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function TabsView() {
  return (
    <Page>
      <Specimen label="Pill Tab with an index and icons" column>
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
            <TabsTrigger value="comments" mark={3}>
              <Icon name="edit" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="files" disabled>
              <Icon name="attachment" />
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent value="messages">Cabin for the 20th, confirmed.</TabsContent>
        </Tabs>
      </Specimen>

      <Specimen label="Pill Tab, plain" column>
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

      <Specimen label="Counts said in the name: 'Requests, 2' (Lockdown 30)" column>
        <Tabs defaultValue="requests">
          <TabsList variant="line" aria-label="Sharing">
            <TabsTrigger value="requests" mark={2}>
              Requests
            </TabsTrigger>
            <TabsTrigger value="shared" mark={{ count: 1, tone: "needs-you" }}>
              Shared with you
            </TabsTrigger>
            <TabsTrigger value="household">Household</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="open">
          <TabsList aria-label="Requests">
            <TabsTrigger value="open" mark={2}>
              Open
            </TabsTrigger>
            <TabsTrigger value="done" mark={14}>
              Done
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Specimen>

      <Specimen label="Keep case: a person's name keeps its own case (Vale 8)" column>
        <Tabs defaultValue="ana">
          <TabsList variant="line" aria-label="Team">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ana" keepCase>
              Ana McKay
            </TabsTrigger>
            <TabsTrigger value="joris" keepCase>
              Joris van der Berg
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Specimen>

      <Specimen label="Vertical" column>
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
