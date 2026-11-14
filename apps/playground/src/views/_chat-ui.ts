// The chat area's new components, for the chat views, until packages/ui/src/index.ts exports them.
// Not a view: the registry skips files that start with "_".
//
// The playground's typecheck maps @unicron/ui to packages/ui/src/index.ts, which the integrator
// owns; these components are not in it yet. At merge the integrator adds their export lines to
// index.ts, points every `from "./_chat-ui"` in views/ at "@unicron/ui", and deletes this file.
export * from "../../../../packages/ui/src/components/ui/composer"
export * from "../../../../packages/ui/src/components/ui/chat-message"
export * from "../../../../packages/ui/src/components/ui/artifact-card"
export * from "../../../../packages/ui/src/components/ui/summary-block"
export * from "../../../../packages/ui/src/components/ui/prose"
export * from "../../../../packages/ui/src/components/ui/code-block"
