// A small tokenizer for JavaScript, TypeScript and JSX. Node built-ins only (none needed).
//
// It exists so the codemod can tell a string literal from a comment, a regular expression, a
// template and JSX text, and can find the bracket that closes another. It is not a parser: it
// keeps no tree, only a flat list of tokens, each with its place in the source.
//
// Token: { t, v, s, e, nl, m?, q?, tag?, jsx? }
//   t   "id" | "num" | "str" | "tpl" | "re" | "p" | "jsxOpen" | "jsxAttr" | "jsxEnd" | "jsxClose" | "jsxText"
//   v   the text (for "str": the text between the quotes, unescaped only as far as needed)
//   s,e start and end offsets in the source (for "str": of the whole literal, quotes included)
//   nl  a line break sits between the previous token and this one
//   m   for a bracket: the index of its partner
//   q   for "str": the quote character
//   tag for "jsxAttr": the element it sits on

const PUNCTUATORS = [
  ">>>=", "...", "===", "!==", "**=", "<<=", ">>=", ">>>", "&&=", "||=", "??=",
  "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>", "**",
]
// After one of these words a `/` starts a regular expression and a `<` may start JSX.
const KEYWORDS_BEFORE_EXPRESSION = new Set([
  "return", "case", "default", "typeof", "void", "delete", "throw", "new", "in", "of", "instanceof", "else", "do", "yield", "await",
])
const ID_START = /[A-Za-z_$ -￿]/
const ID_PART = /[\w$ -￿]/

export class LexError extends Error {}

/**
 * @param {string} source
 * @param {{ jsx?: boolean }} [options] jsx: read `<Tag …>` as JSX (off for .ts, where `<T>` is a type)
 */
export function lex(source, { jsx = true } = {}) {
  const tokens = []
  const brackets = []
  let at = 0
  let sawNewline = false

  const push = (token) => {
    token.nl = sawNewline
    sawNewline = false
    tokens.push(token)
    return token
  }
  const open = (v) => {
    brackets.push(tokens.length)
    push({ t: "p", v, s: at, e: at + 1 })
    at++
  }
  const close = (v) => {
    const partner = brackets.pop()
    const index = tokens.length
    const token = push({ t: "p", v, s: at, e: at + 1 })
    if (partner !== undefined) {
      token.m = partner
      tokens[partner].m = index
    }
    at++
  }
  /** Whether the previous token ends a value, so that `/` divides and `<` compares. */
  const afterOperand = (back = 1) => {
    const prev = tokens[tokens.length - back]
    if (!prev) return false
    if (prev.t === "num" || prev.t === "str" || prev.t === "tpl" || prev.t === "re") return true
    if (prev.t === "id") return !KEYWORDS_BEFORE_EXPRESSION.has(prev.v)
    if (prev.t === "p") {
      if (prev.v === ")" || prev.v === "]" || prev.v === "}") return true
      // `x! / 2` and `i++ / 2`: a postfix mark keeps the value before it a value.
      return (prev.v === "!" || prev.v === "++" || prev.v === "--") && back === 1 && afterOperand(2)
    }
    return prev.t === "jsxEnd" || prev.t === "jsxClose"
  }

  function skipSpaceAndComments() {
    for (;;) {
      const c = source[at]
      if (c === "\n") {
        sawNewline = true
        at++
      } else if (c === " " || c === "\t" || c === "\r" || c === "﻿" || c === " ") at++
      else if (c === "/" && source[at + 1] === "/") {
        const end = source.indexOf("\n", at)
        at = end < 0 ? source.length : end
      } else if (c === "/" && source[at + 1] === "*") {
        const end = source.indexOf("*/", at + 2)
        if (end < 0) throw new LexError("a comment is never closed")
        if (source.slice(at, end).includes("\n")) sawNewline = true
        at = end + 2
      } else return
    }
  }

  function string(quote) {
    const start = at
    at++
    let value = ""
    while (at < source.length) {
      const c = source[at]
      if (c === "\\") {
        value += source.slice(at, at + 2)
        at += 2
      } else if (c === quote) {
        at++
        return push({ t: "str", v: value, s: start, e: at, q: quote })
      } else if (c === "\n") throw new LexError("a string runs past the end of its line")
      else {
        value += c
        at++
      }
    }
    throw new LexError("a string is never closed")
  }

  function template() {
    const start = at
    at++
    let plain = true
    let value = ""
    while (at < source.length) {
      const c = source[at]
      if (c === "\\") {
        value += source.slice(at, at + 2)
        at += 2
      } else if (c === "`") {
        at++
        // A template with nothing substituted is a plain string in backticks.
        return push(plain ? { t: "str", v: value, s: start, e: at, q: "`" } : { t: "tpl", v: "", s: start, e: at })
      } else if (c === "$" && source[at + 1] === "{") {
        plain = false
        const mark = tokens.length
        const depth = brackets.length
        open("{")
        at++ // open() stepped over "$"; step over "{"
        tokens[mark].e = at
        code(depth)
        // The tokens inside stay in the list, so a literal in `${cond ? "a" : "b"}` is still seen.
      } else {
        value += c
        at++
      }
    }
    throw new LexError("a template is never closed")
  }

  function regex() {
    const start = at
    at++
    let inClass = false
    while (at < source.length) {
      const c = source[at]
      if (c === "\\") at += 2
      else if (c === "\n") throw new LexError("a regular expression runs past the end of its line")
      else if (c === "[") {
        inClass = true
        at++
      } else if (c === "]") {
        inClass = false
        at++
      } else if (c === "/" && !inClass) {
        at++
        while (at < source.length && ID_PART.test(source[at])) at++
        return push({ t: "re", v: source.slice(start, at), s: start, e: at })
      } else at++
    }
    throw new LexError("a regular expression is never closed")
  }

  /** Whether the `<` at `at` opens a JSX element. */
  function startsJsx() {
    if (!jsx || afterOperand()) return false
    const next = source[at + 1]
    if (next === ">") return true
    if (!next || !ID_START.test(next)) return false
    // `<T,>(x) => …`, `<T extends …>` and `<T>(x: T) => …` are type parameters, not elements.
    let i = at + 1
    while (i < source.length && /[\w$.:-]/.test(source[i])) i++
    const name = source.slice(at + 1, i)
    const rest = source.slice(i, i + 12)
    if (/^\s*,/.test(rest) || /^\s+extends\s/.test(rest)) return false
    return !(/^[A-Z][A-Za-z0-9]?$/.test(name) && /^>\s*\(/.test(rest))
  }

  function jsxElement() {
    const start = at
    at++
    let i = at
    while (i < source.length && /[\w$.:-]/.test(source[i])) i++
    const tag = source.slice(at, i)
    at = i
    push({ t: "jsxOpen", v: tag, s: start, e: at })
    // Attributes, up to `>` or `/>`.
    for (;;) {
      skipSpaceAndComments()
      const c = source[at]
      if (c === undefined) throw new LexError(`<${tag}> is never closed`)
      if (c === "/" && source[at + 1] === ">") {
        push({ t: "jsxEnd", v: "/>", s: at, e: at + 2 })
        at += 2
        return
      }
      if (c === ">") {
        push({ t: "jsxEnd", v: ">", s: at, e: at + 1 })
        at++
        break
      }
      if (c === "{") {
        const depth = brackets.length
        open("{")
        code(depth)
        continue
      }
      let j = at
      while (j < source.length && /[\w$:-]/.test(source[j])) j++
      if (j === at) throw new LexError(`unexpected ${JSON.stringify(c)} in <${tag}>`)
      push({ t: "jsxAttr", v: source.slice(at, j), s: at, e: j, tag })
      at = j
      skipSpaceAndComments()
      if (source[at] !== "=") continue
      push({ t: "p", v: "=", s: at, e: at + 1, jsx: true })
      at++
      skipSpaceAndComments()
      const v = source[at]
      if (v === '"' || v === "'") {
        // A JSX attribute string has no escapes: it runs to the next matching quote.
        const end = source.indexOf(v, at + 1)
        if (end < 0) throw new LexError("an attribute string is never closed")
        push({ t: "str", v: source.slice(at + 1, end), s: at, e: end + 1, q: v, jsx: true })
        at = end + 1
      } else if (v === "{") {
        const depth = brackets.length
        open("{")
        code(depth)
      } else if (v === "<") jsxElement()
      else throw new LexError(`unexpected ${JSON.stringify(v)} after ${tag}'s attribute`)
    }
    // Children, up to the closing tag.
    for (;;) {
      const next = source.slice(at).search(/[<{]/)
      if (next < 0) throw new LexError(`<${tag}> is never closed`)
      if (next > 0) {
        const text = source.slice(at, at + next)
        if (text.includes("\n")) sawNewline = true
        if (text.trim()) push({ t: "jsxText", v: text, s: at, e: at + next })
        at += next
      }
      if (source[at] === "{") {
        const depth = brackets.length
        open("{")
        code(depth)
      } else if (source[at + 1] === "/") {
        const end = source.indexOf(">", at)
        if (end < 0) throw new LexError(`</${tag}> is never closed`)
        push({ t: "jsxClose", v: source.slice(at + 2, end).trim(), s: at, e: end + 1 })
        at = end + 1
        return
      } else jsxElement()
    }
  }

  /** Read code. With `untilDepth`, stop after the `}` that brings the bracket stack back to it. */
  function code(untilDepth) {
    for (;;) {
      skipSpaceAndComments()
      if (at >= source.length) {
        if (untilDepth !== undefined) throw new LexError("a { is never closed")
        return
      }
      const c = source[at]
      if (c === '"' || c === "'") string(c)
      else if (c === "`") template()
      else if (c === "(" || c === "[" || c === "{") open(c)
      else if (c === ")" || c === "]" || c === "}") {
        close(c)
        if (c === "}" && untilDepth !== undefined && brackets.length === untilDepth) return
      } else if (c === "/" && !afterOperand()) regex()
      else if (c === "<" && startsJsx()) jsxElement()
      else if (ID_START.test(c) || c === "#" || c === "@") {
        let i = at + 1
        while (i < source.length && ID_PART.test(source[i])) i++
        push({ t: "id", v: source.slice(at, i), s: at, e: i })
        at = i
      } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(source[at + 1] ?? ""))) {
        let i = at + 1
        while (i < source.length && /[\w.]/.test(source[i])) i++
        push({ t: "num", v: source.slice(at, i), s: at, e: i })
        at = i
      } else {
        const p = PUNCTUATORS.find((x) => source.startsWith(x, at)) ?? c
        // `?.5` is a ternary and a number, not optional chaining.
        const v = p === "?." && /[0-9]/.test(source[at + 2] ?? "") ? "?" : p
        push({ t: "p", v, s: at, e: at + v.length })
        at += v.length
      }
    }
  }

  code()
  return tokens
}
