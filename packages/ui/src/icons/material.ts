// Owned module (not generated): Material Symbols names that arrive as data, translated to Carbon.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 18:738; no app PR, no DSA record)
import { materialToCarbon } from "./material.gen"
import type { IconName } from "./registry"

/**
 * The Carbon name for a Material Symbols name, from the same map `unicron-codemod icons` uses
 * (codemod/MAPPING.md). For icon names the codemod cannot reach because they arrive at run time:
 * a name a server sends, or one a saved template stored before 1.0. Translate such a name once,
 * when it is read, and store the Carbon name.
 *
 * Returns `null` for a Material name with no Carbon match, and for anything that is not a Material
 * name, Carbon names included:
 *
 * ```ts
 * const icon = iconFromMaterial(stored) ?? (isIconName(stored) ? stored : "document")
 * ```
 *
 * A few words are names in both sets with different drawings (`error`, `pin`, `warning`; MAPPING.md
 * → Same word). This always reads them as Material, so translate only data written before the
 * switch.
 */
export function iconFromMaterial(name: string): IconName | null {
  return Object.hasOwn(materialToCarbon, name) ? materialToCarbon[name]! : null
}
