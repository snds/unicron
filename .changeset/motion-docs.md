---
"@unicron/ui": patch
---

Motion docs and the last keyframes. TruncatedText's full text and CodeDisplay's next code now use the system recipes (`motion-fade motion-fade-fast`, `motion-appear`) instead of tw-animate-css classes, so no `@unicron/ui` part uses tw-animate-css any more. Its import stays in `@unicron/ui/styles` for apps that use it, marked deprecated, and goes in the next major. New docs page: docs/09-motion.md (the rules, every part's motion, going further in an app, adding a motion); DESIGN.md's motion section names the timing, press, layer and bounce rules.
