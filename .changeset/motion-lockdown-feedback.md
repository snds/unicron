---
"@unicron/ui": minor
---

Lockdown's feedback gets motion, in the 1.0 look. The clipboard countdown's words on SecretField and CodeDisplay ("Clears in 28 s", "Cleared") fade in over 120ms when they appear and when the phase changes, and hold still as the seconds tick. A SecretField's value fades in where the dots were when shown, and the dots fade back in when hidden. The strength rule's three cells change colour one after another, 50ms apart. New recipes `motion-appear` and `motion-fill-in-turn`, and three new entries in `motionContracts` (copy-words, reveal, strength). Shake stays opt-in: no field shakes by default, and `useShake` works on `Input` for an app that wants it on a refusal (documented).
