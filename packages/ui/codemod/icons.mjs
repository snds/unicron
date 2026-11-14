// `unicron-codemod icons`: Material Symbols names → Carbon names, in source text.
//
// It finds string literals that sit in an icon position and are a known Material name, and
// swaps the name. Nothing else in the file changes: quotes, spacing and line breaks stay.
// It never guesses. A known Material name anywhere else is listed, not touched.
//
// Icon positions (the rules, in the order they are tried):
//   1. JSX: `name=` on <Icon> (or a tag given with --tag), and on any element an attribute
//      called `icon`, `iconName`, `glyph`, or ending in `Icon` / `Glyph` (emptyIcon, leadingIcon).
//   2. A property or type member with such a name, singular or plural: `icon: "home"`,
//      `icon?: "a" | "b"`, `icons: ["a", "b"]`.
//   3. A variable, default or assignment with such a name: `const ICON = {…}`, `const CHANGE_ICON
//      = {…} as const`, `let glyph = open ? "a" : "b"`, `({ icon = "home" })`. An object is read as
//      a map (its values are icons), an array as a list.
//   4. A declaration typed as the icon type: `: IconName`, `: IconName[]`, `: Record<K, IconName>`,
//      a tuple with IconName in it (`Array<[View, IconName]>`: only that slot), `satisfies …` the
//      same. A type alias declared in the same file is followed one step.
//   5. A function that returns icons: a return type of `IconName`, or a name such as `kindIcon`.
//
// Inside any of these, a literal counts when it is the value: the whole expression, a branch of
// `? :`, an operand of `??` or `||`, the right side of `&&`. A literal that is compared
// (`kind === "folder"`), passed to a call, or used as a key is never touched.

import { lex } from "./lex.mjs"

const ICONISH_ATTRIBUTE = /^(icon|iconName|glyph)$|(Icon|Glyph)$/
const ICONISH_KEY = /^(icons?|iconNames?|glyphs?)$|(Icons?|Glyphs?)$/
const ICONISH_NAME = /^(icons?|glyphs?)$|(Icons?|Glyphs?)$|(^|_)(ICONS?|GLYPHS?)$/
const PLURAL = /s$/i

// A line break ends an expression unless one of these sits on either side of it.
const BINARY = new Set([
  "?", ":", ".", "?.", "||", "&&", "??", "+", "-", "*", "/", "%", "|", "&", "^", "**",
  "===", "!==", "==", "!=", "<", ">", "<=", ">=", "<<", ">>", ">>>",
  "=", "+=", "-=", "*=", "/=", "%=", "&&=", "||=", "??=", "=>",
])
const WORD_OPERATORS = new Set(["as", "satisfies", "in", "instanceof", "extends", "keyof", "typeof", "readonly", "is"])
const COMPARISONS = new Set(["===", "!==", "==", "!="])
const MEMBER_STARTS = new Set(["{", ",", ";", "("])
const MODIFIERS = new Set(["readonly", "public", "private", "protected", "static", "declare", "override"])

/**
 * @param {string} source
 * @param {object} options
 * @param {Record<string, string | null>} options.map         Material name → Carbon name or null
 * @param {Record<string, string>} [options.notes]            why a name maps to null
 * @param {boolean} [options.jsx]                             read `<Tag>` as JSX (false for .ts)
 * @param {string[]} [options.tags]                           elements whose `name=` is an icon
 * @param {string[]} [options.types]                          type names that mean "an icon name"
 * @param {Set<string>} [options.carbonNames]                 every name Icon can draw, when known
 * @param {Set<string>} [options.sameWord]                    Material names that are also Carbon names with another drawing
 * @param {Map<string, string>} [options.sharedAliases]       type aliases declared in other files (see sharedTypeAliases)
 */
export function transformIcons(source, options) {
  const { map = {}, notes = {}, jsx = true, tags = ["Icon"], types = ["IconName", "CoreIconName"], carbonNames, sameWord = new Set(), sharedAliases = new Map() } = options
  const tokens = lex(source, { jsx })
  const tagSet = new Set(tags)
  const iconType = `(?:${types.join("|")})`

  const isP = (i, v) => tokens[i]?.t === "p" && tokens[i].v === v
  const isId = (i, v) => tokens[i]?.t === "id" && (v === undefined || tokens[i].v === v)
  const text = (a, b) => (a < b ? source.slice(tokens[a].s, tokens[b - 1].e) : "")

  /** The index just past token i when it opens a group or a JSX element; else i + 1. */
  function after(i) {
    const token = tokens[i]
    if (token.t === "p" && token.m !== undefined && token.m > i) return token.m + 1
    if (token.t === "jsxOpen") {
      let depth = 0
      for (let j = i; j < tokens.length; j++) {
        const t = tokens[j]
        if (t.t === "p" && t.m !== undefined && t.m > j) {
          j = t.m
          continue
        }
        if (t.t === "jsxOpen") depth++
        else if ((t.t === "jsxEnd" && t.v === "/>") || t.t === "jsxClose") {
          depth--
          if (depth === 0) return j + 1
        }
      }
      return tokens.length
    }
    return i + 1
  }
  /** The indexes of the tokens in [a, b) that are not inside a group or an element. */
  function* top(a, b) {
    for (let i = a; i < b; i = after(i)) yield i
  }
  const continues = (prev, next) =>
    (prev.t === "p" && BINARY.has(prev.v)) ||
    (next.t === "p" && BINARY.has(next.v)) ||
    (next.t === "id" && WORD_OPERATORS.has(next.v)) ||
    (prev.t === "id" && WORD_OPERATORS.has(prev.v))
  /** Where the expression that starts at token a ends (exclusive). */
  function expressionEnd(a, limit = tokens.length) {
    let i = a
    while (i < limit) {
      const token = tokens[i]
      if (token.t === "p") {
        if (token.v === "," || token.v === ";") return i
        if ((token.v === ")" || token.v === "]" || token.v === "}") && (token.m === undefined || token.m < a)) return i
      }
      if (token.t === "jsxEnd" || token.t === "jsxClose" || token.t === "jsxAttr" || token.t === "jsxText") return i
      if (i > a && token.nl && !continues(tokens[i - 1], token)) return i
      i = after(i)
    }
    return Math.min(i, limit)
  }
  /** Drop wrapping parentheses and a trailing `as …` / `satisfies …`. */
  function core(a, b) {
    for (;;) {
      let cut = -1
      for (const i of top(a, b)) {
        if (i > a && tokens[i].t === "id" && (tokens[i].v === "as" || tokens[i].v === "satisfies")) {
          cut = i
          break
        }
      }
      if (cut >= 0) b = cut
      else if (b - a >= 2 && isP(a, "(") && tokens[a].m === b - 1) {
        a++
        b--
      } else return [a, b]
    }
  }
  const splitTop = (a, b, separators) => {
    const parts = []
    let from = a
    for (const i of top(a, b)) {
      if (tokens[i].t === "p" && separators.has(tokens[i].v)) {
        parts.push([from, i])
        from = i + 1
      }
    }
    parts.push([from, b])
    return parts
  }

  /** The string literals in [a, b) that are a value of the expression. */
  function values(a, b) {
    ;[a, b] = core(a, b)
    if (a >= b) return []
    // cond ? x : y
    let question = -1
    let nested = 0
    for (const i of top(a, b)) {
      if (!isP(i, "?") && !isP(i, ":")) continue
      if (question < 0) {
        if (isP(i, "?")) question = i
        continue
      }
      if (isP(i, "?")) nested++
      else if (nested > 0) nested--
      else return [...values(question + 1, i), ...values(i + 1, b)]
    }
    if (question >= 0) return []
    const alternatives = splitTop(a, b, new Set(["??", "||"]))
    if (alternatives.length > 1) return alternatives.flatMap(([x, y]) => values(x, y))
    const guarded = splitTop(a, b, new Set(["&&"]))
    if (guarded.length > 1) return values(...guarded[guarded.length - 1])
    const union = splitTop(a, b, new Set(["|"]))
    if (union.length > 1) return union.flatMap(([x, y]) => values(x, y))
    return b - a === 1 && tokens[a].t === "str" ? [a] : []
  }
  const elements = (open) => splitTop(open + 1, tokens[open].m, new Set([","])).filter(([x, y]) => y > x && !isP(x, "..."))
  /** The values of an object literal's own properties. */
  function mapValues(open) {
    const found = []
    for (const [x, y] of elements(open)) {
      const colon = [...top(x, y)].find((i) => isP(i, ":"))
      if (colon !== undefined) found.push(...values(colon + 1, y))
    }
    return found
  }
  /** `return` expressions in a function body, not those of a function nested in it. */
  function returns(open) {
    const close = tokens[open].m
    const found = []
    for (let i = open + 1; i < close; i++) {
      if (isP(i, "=>") && isP(i + 1, "{")) i = tokens[i + 1].m
      else if (isId(i, "function")) {
        let j = i + 1
        while (j < close && !isP(j, "(")) j++
        j = tokens[j]?.m ?? j
        while (j < close && !isP(j, "{")) j = after(j)
        if (j < close) i = tokens[j].m
      } else if (isId(i, "return") && !isP(i - 1, ".")) found.push(...values(i + 1, expressionEnd(i + 1, close)))
    }
    return found
  }
  /** An initializer, read by its shape: a map, a list, an arrow function, or one expression. */
  function shaped(a, b, { map: asMap = true } = {}) {
    ;[a, b] = core(a, b)
    if (a >= b) return []
    if (isP(a, "[") && tokens[a].m === b - 1) return elements(a).flatMap(([x, y]) => values(x, y))
    if (isP(a, "{") && tokens[a].m === b - 1) return asMap ? mapValues(a) : []
    const arrow = [...top(a, b)].find((i) => isP(i, "=>"))
    if (arrow !== undefined) return isP(arrow + 1, "{") ? returns(arrow + 1) : values(arrow + 1, b)
    return values(a, b)
  }

  // ── type text → how to read the value ─────────────────────────────────────────────────────────
  // Type aliases: the ones this file declares, then the ones the caller found elsewhere in the tree.
  const declared = []
  for (let i = 0; i < tokens.length; i++) {
    if (!isId(i, "type") || !isId(i + 1) || !isP(i + 2, "=")) continue
    declared.push([tokens[i + 1].v, text(i + 3, expressionEnd(i + 3))])
  }
  if (options.aliasesOnly) return { aliases: declared }
  const mentionsIcon = new RegExp(`\\b${iconType}\\b`)
  const aliases = new Map([...sharedAliases].filter(([name]) => !declared.some(([own]) => own === name)))
  for (const [name, body] of declared) if (mentionsIcon.test(body)) aliases.set(name, body)
  function shapeOf(typeText) {
    let t = typeText
    for (const [name, body] of aliases) t = t.replace(new RegExp(`\\b${name}\\b`, "g"), `(${body})`)
    t = t.replace(/\s+/g, "")
    for (let before = ""; before !== t; ) {
      before = t
      t = t
        .replace(/^\((.*)\)$/, "$1")
        .replace(/^readonly/, "")
        .replace(/^(?:Readonly|Partial|Required)<(.*)>$/, "$1")
    }
    if (new RegExp(`^${iconType}(\\|null|\\|undefined)*$`).test(t)) return { kind: "value" }
    if (new RegExp(`^(?:${iconType}\\[\\]|(?:Readonly)?Array<${iconType}>)$`).test(t)) return { kind: "list" }
    if (new RegExp(`^(?:Record<.+,${iconType}>|\\{\\[[^\\]]+\\]:${iconType};?\\})$`).test(t)) return { kind: "map" }
    for (const [, inside] of t.matchAll(/\[([^[\]]*)\]/g)) {
      const members = inside.split(",").map((m) => m.replace(/^readonly/, "").replace(/^\w+\??:/, ""))
      const slots = members.flatMap((m, at) => (new RegExp(`^${iconType}$`).test(m) ? [at] : []))
      if (members.length >= 2 && slots.length) return { kind: "tuple", arity: members.length, slots }
    }
    return null
  }
  function typed(shape, a, b) {
    if (shape.kind === "value") return shaped(a, b, { map: false })
    if (shape.kind === "list" || shape.kind === "map") return shaped(a, b)
    const found = []
    for (let i = a; i < b; i++) {
      if (!isP(i, "[") || tokens[i].m === undefined || tokens[i].m >= b) continue
      const parts = elements(i)
      if (parts.length !== shape.arity || parts.some(([x]) => isP(x, "["))) continue
      for (const slot of shape.slots) found.push(...values(...parts[slot]))
    }
    return found
  }
  /** The type after `satisfies` at the top of [a, b), if there is one. */
  function satisfied(a, b) {
    for (const i of top(a, b)) {
      if (i === a || !isId(i, "satisfies")) continue
      // `<` and `>` are not brackets here, so follow them by hand: a comma inside them is part of the type.
      let angle = 0
      let closed = -1
      let end = i + 1
      for (; end < tokens.length; end = after(end)) {
        const t = tokens[end]
        // On a new line the type goes on only after an operator; the `>` that closes `<…>` is not one.
        if (end > i + 1 && t.nl && angle <= 0 && (closed === end - 1 ? !(t.t === "p" && BINARY.has(t.v)) : !continues(tokens[end - 1], t))) break
        if (t.t !== "p") continue
        if (t.v === "<") angle++
        else if (t.v === ">" || t.v === ">>" || t.v === ">>>") {
          angle -= t.v.length
          if (angle <= 0) closed = end
        } else if (t.v === ";" || (t.v === "," && angle <= 0) || (t.m !== undefined && t.m < end)) break
      }
      return text(i + 1, end)
    }
    return null
  }

  // ── the rules ─────────────────────────────────────────────────────────────────────────────────
  const hits = new Set()
  const add = (found) => found.forEach((i) => hits.add(i))

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    // 1. JSX attributes
    if (token.t === "jsxAttr") {
      if (!isP(i + 1, "=")) continue
      if (!((token.v === "name" && tagSet.has(token.tag)) || ICONISH_ATTRIBUTE.test(token.v))) continue
      const value = i + 2
      if (tokens[value]?.t === "str") hits.add(value)
      else if (isP(value, "{")) add(shaped(value + 1, tokens[value].m, { map: false }))
      continue
    }

    // 2. properties and type members
    if ((token.t === "id" || (token.t === "str" && !token.jsx)) && ICONISH_KEY.test(token.v)) {
      const colon = isP(i + 1, ":") ? i + 1 : isP(i + 1, "?") && isP(i + 2, ":") ? i + 2 : -1
      // A key starts a member: after `{`, `,`, `;`, `(`, a modifier, or on a line of its own.
      // That keeps `cond ? !icon : "x"` (a branch of ?:, not a key) out.
      const prev = tokens[i - 1]
      const startsMember = !prev || (prev.t === "p" ? MEMBER_STARTS.has(prev.v) || (token.nl && prev.v !== "?" && prev.v !== "." && prev.v !== "?.") : prev.t === "id" ? MODIFIERS.has(prev.v) || (token.nl && prev.v !== "case") : token.nl)
      if (colon > 0 && startsMember) {
        const end = expressionEnd(colon + 1)
        // `(icon: IconName = "home")`: the default is the value.
        const assign = [...top(colon + 1, end)].find((j) => isP(j, "="))
        add(shaped(assign === undefined ? colon + 1 : assign + 1, end, { map: PLURAL.test(token.v) }))
      }
    }

    // 3. variables, defaults and assignments with an icon-ish name
    if (token.t === "id" && ICONISH_NAME.test(token.v) && isP(i + 1, "=") && !tokens[i + 1].jsx) {
      add(shaped(i + 2, expressionEnd(i + 2)))
    }

    // 4. typed declarations
    if (token.t === "id" && (token.v === "const" || token.v === "let" || token.v === "var") && isId(i + 1)) {
      let equals = -1
      for (const j of top(i + 2, tokens.length)) {
        const t = tokens[j]
        if (isP(j, "=")) equals = j
        if (isP(j, "=") || isP(j, ";") || isId(j, "of") || isId(j, "in")) break
        if (t.t === "p" && t.m !== undefined && t.m < j) break
        // A comma can sit inside `<…>`, which is not a bracket here, so it does not end the type.
        if (j > i + 2 && t.nl && !isP(j - 1, ",") && !continues(tokens[j - 1], t)) break
      }
      if (equals > 0) {
        const end = expressionEnd(equals + 1)
        const annotation = isP(i + 2, ":") ? text(i + 3, equals) : null
        const shape = (annotation && shapeOf(annotation)) || shapeOf(satisfied(equals + 1, tokens.length) ?? "")
        if (shape) add(typed(shape, equals + 1, end))
        else if (annotation && ICONISH_NAME.test(tokens[i + 1].v)) add(shaped(equals + 1, end))
      }
    }

    // 5. functions that return icons
    if (isId(i, "function") && isId(i + 1) && ICONISH_NAME.test(tokens[i + 1].v)) {
      let j = i + 2
      while (j < tokens.length && !isP(j, "(")) j++
      j = (tokens[j]?.m ?? j) + 1
      while (j < tokens.length && !(isP(j, "{") && !(isP(tokens[j].m + 1, "|") || isP(tokens[j].m + 1, "&") || isP(tokens[j].m + 1, "[") || isP(tokens[j].m + 1, "{")))) j = after(j)
      if (j < tokens.length) add(returns(j))
    }
    if (isP(i, ")") && isP(i + 1, ":")) {
      let j = i + 2
      while (j < tokens.length && !isP(j, "=>") && !isP(j, "{") && !isP(j, ";") && !isP(j, ",") && !isP(j, ")")) j = after(j)
      if ((isP(j, "=>") || isP(j, "{")) && shapeOf(text(i + 2, j))?.kind === "value") {
        if (isP(j, "{")) add(returns(j))
        else if (isP(j + 1, "{")) add(returns(j + 1))
        else add(values(j + 1, expressionEnd(j + 1)))
      }
    }
  }

  // ── what to do with each literal ──────────────────────────────────────────────────────────────
  const lineStarts = [0]
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") lineStarts.push(i + 1)
  const where = (offset) => {
    let low = 0
    let high = lineStarts.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (lineStarts[mid] <= offset) low = mid
      else high = mid - 1
    }
    return { line: low + 1, column: offset - lineStarts[low] + 1 }
  }
  const lineText = (offset) => {
    const { line } = where(offset)
    return source.slice(lineStarts[line - 1], lineStarts[line] ?? source.length).trim().slice(0, 160)
  }

  /**
   * The "channel" a literal travels in: the argument slot of a named call, a column of a table of
   * rows, a list, or a property name. When a Material name that can only be an icon (`play_arrow`)
   * sits in a channel, a plain word in the same channel (`error`, `close`) is probably an icon too.
   */
  function channel(i) {
    let opener = -1
    let slot = 0
    for (let j = i - 1; j >= 0; j--) {
      const t = tokens[j]
      if (t.t !== "p") continue
      if (t.m !== undefined && t.m < j) j = t.m
      else if (t.m !== undefined && t.m > i) {
        opener = j
        break
      } else if (t.v === ",") slot++
    }
    if (opener < 0) return null
    if (isP(opener, "(") && isId(opener - 1)) return `call ${tokens[opener - 1].v}(), argument ${slot + 1}`
    if (isP(opener, "[")) {
      let outer = -1
      for (let j = opener - 1; j >= 0; j--) {
        const t = tokens[j]
        if (t.t !== "p" || t.m === undefined) continue
        if (t.m < j) j = t.m
        else if (t.m > opener) {
          outer = j
          break
        }
      }
      return outer >= 0 && isP(outer, "[") ? `rows at ${where(tokens[outer].s).line}, column ${slot + 1}` : `list at ${where(tokens[opener].s).line}`
    }
    if (isP(opener, "{")) {
      // The property this literal is the value of: the key before the nearest `:` at this level.
      for (let j = i - 1; j > opener; j--) {
        const t = tokens[j]
        if (t.t === "p" && t.m !== undefined && t.m < j) j = t.m
        else if (t.t === "p" && t.v === ",") break
        else if (t.t === "p" && t.v === ":" && (isId(j - 1) || tokens[j - 1]?.t === "str")) {
          const owner = isP(opener - 1, "=") && isId(opener - 2) ? tokens[opener - 2].v : null
          return owner ? `values of ${owner}` : `property ${tokens[j - 1].v}`
        }
      }
    }
    return null
  }

  const report = { rewrites: [], unchanged: [], unmapped: [], unknown: [], carbon: [], left: [], likely: [], sameWord: [] }
  const plain = []
  const edits = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.t !== "str") continue
    const name = token.v
    const known = Object.hasOwn(map, name)
    const at = { ...where(token.s), name }
    if (hits.has(i)) {
      if (known) {
        const to = map[name]
        if (to === null) report.unmapped.push({ ...at, note: notes[name] ?? "" })
        else if (to === name) report.unchanged.push(at)
        else {
          report.rewrites.push({ ...at, to })
          edits.push({ s: token.s + 1, e: token.e - 1, to })
        }
      } else if (carbonNames?.has(name) || name.includes("--")) report.carbon.push(at)
      else if (/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(name) && (name.includes("_") || carbonNames)) report.unknown.push(at)
      continue
    }
    if (!known) continue
    // A known Material name, outside every icon position.
    const prev = tokens[i - 1]
    const next = tokens[i + 1]
    const compared = (prev?.t === "p" && COMPARISONS.has(prev.v)) || (next?.t === "p" && COMPARISONS.has(next.v))
    if (name.includes("_")) report.left.push({ ...at, to: map[name], text: lineText(token.s), channel: channel(i) })
    else if (!compared && !token.jsx && !isId(i - 1, "case") && !(isP(i + 1, ":") && !isP(i - 1, "?"))) plain.push([i, at])
  }
  // Plain words: say which ones share a channel with a name that can only be an icon.
  const channels = new Set(report.left.map((entry) => entry.channel).filter(Boolean))
  for (const [i, at] of plain) {
    const token = tokens[i]
    const via = channels.size ? channel(i) : null
    if (via && channels.has(via)) report.likely.push({ ...at, to: map[at.name], text: lineText(token.s), channel: via, silent: sameWord.has(at.name) })
    else if (sameWord.has(at.name)) report.sameWord.push({ ...at, to: map[at.name], text: lineText(token.s) })
  }

  // ── props that are gone in 1.0 ────────────────────────────────────────────────────────────────
  // Icon lost Material Symbols' `fill`, `weight`, `grade` and `opticalSize`; IconButton lost `fill`.
  // In the apps `fill` often carries a state (pinned, a favourite, the current item), and Carbon
  // draws a filled glyph as a name of its own. So where the glyph is a literal and the curated set
  // has its filled form, `fill` becomes that name: bare `fill` (or `fill={true}`) picks it,
  // `fill={expr}` picks it when the expression holds (`name={expr ? "pin--filled" : "pin"}`), and
  // `fill={false}` just goes. Every other use is listed, by line, with what to do.
  report.filled = []
  report.removedProps = []
  const propTags = new Set([...tagSet, "IconButton"])
  const nameAttribute = (tag) => (tag === "IconButton" ? "icon" : "name")
  const filledOf = (name) => {
    for (const candidate of [`${name}--filled`, name.replace(/--outline$/, "--filled")]) {
      if (candidate !== name && carbonNames?.has(candidate)) return candidate
    }
    return null
  }
  const replaced = new Map() // a name literal's token index → its new text, quotes included
  const removedRanges = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].t !== "jsxOpen" || !propTags.has(tokens[i].v)) continue
    const tag = tokens[i].v
    const attrs = new Map()
    for (let j = i + 1; j < tokens.length && tokens[j].t !== "jsxEnd"; j = after(j)) if (tokens[j].t === "jsxAttr") attrs.set(tokens[j].v, j)
    for (const prop of ["fill", "weight", "grade", "opticalSize"]) {
      const a = attrs.get(prop)
      if (a === undefined || (tag === "IconButton" && prop !== "fill")) continue
      const valued = isP(a + 1, "=")
      const value = valued ? a + 2 : -1
      const braced = valued && isP(value, "{")
      const end = !valued ? tokens[a].e : braced ? tokens[tokens[value].m].e : tokens[value].e
      const expr = braced ? source.slice(tokens[value].e, tokens[tokens[value].m].s).trim() : null
      const at = { ...where(tokens[a].s), name: prop, tag, text: lineText(tokens[a].s) }
      if (prop !== "fill") {
        report.removedProps.push({ ...at, hint: "Carbon has one weight and one size of drawing: delete it." })
        continue
      }
      // The glyph, if it is a literal: its Carbon name after this run, and that name's filled form.
      const n = attrs.get(nameAttribute(tag))
      const literal = n !== undefined && isP(n + 1, "=") && tokens[n + 2]?.t === "str" ? n + 2 : -1
      const glyph = literal < 0 ? null : tokens[literal].v
      const base = glyph === null ? null : Object.hasOwn(map, glyph) ? map[glyph] : carbonNames?.has(glyph) ? glyph : null
      const filled = base ? filledOf(base) : null
      const on = !valued || expr === "true"
      const off = expr === "false"
      const stringFill = valued && !braced
      if (stringFill || (braced && /^["'`]/.test(expr))) {
        report.removedProps.push({ ...at, hint: "a paint, not a state: delete it; the icon takes the text color (set a text color class)." })
        continue
      }
      if (off || (filled && literal >= 0)) {
        removedRanges.push({ s: tokens[a - 1].e, e: end })
        if (!off) {
          const quote = source[tokens[literal].s]
          const simple = /^[!\w$.?[\]]+$/.test(expr ?? "")
          const text = on ? `${quote}${filled}${quote}` : `{${simple ? expr : `(${expr})`} ? "${filled}" : "${base}"}`
          replaced.set(literal, text)
          report.filled.push({ ...at, name: glyph, to: on ? filled : `${expr} ? ${filled} : ${base}` })
        }
        continue
      }
      report.removedProps.push({
        ...at,
        hint: !base
          ? "the glyph is not a literal here: if fill marks a state, pick the glyph's --filled name when the state holds (star--filled, pin--filled), or show the state another way."
          : `"${base}" has no filled form in the curated set: show the state another way (a different glyph, aria-pressed with a fill, a mark), then delete it.`,
      })
    }
  }
  const finalEdits = edits.filter((edit) => ![...replaced.keys()].some((k) => edit.s === tokens[k].s + 1))
  for (const [k, text] of replaced) finalEdits.push({ s: tokens[k].s, e: tokens[k].e, to: text })
  for (const range of removedRanges) finalEdits.push({ ...range, to: "" })

  let output = source
  for (const edit of finalEdits.sort((x, y) => y.s - x.s)) output = output.slice(0, edit.s) + edit.to + output.slice(edit.e)
  return { output, ...report }
}

/**
 * Type aliases that mention an icon type and are declared exactly once across the given sources.
 * With these, `const SCREENS: ReadonlyArray<Screen>` is understood in a file that imports `Screen`.
 * A name declared twice anywhere is left out: which one a file means cannot be known from here.
 *
 * @param {Array<{ source: string, jsx?: boolean }>} files
 * @param {string[]} [types]
 */
export function sharedTypeAliases(files, types = ["IconName", "CoreIconName"]) {
  const seen = new Map()
  for (const { source, jsx } of files) {
    let declared
    try {
      declared = transformIcons(source, { jsx, aliasesOnly: true }).aliases
    } catch {
      continue
    }
    for (const [name, body] of declared) seen.set(name, seen.has(name) ? null : body)
  }
  const mentionsIcon = new RegExp(`\\b(?:${types.join("|")})\\b`)
  return new Map([...seen].filter(([, body]) => body !== null && mentionsIcon.test(body)))
}
