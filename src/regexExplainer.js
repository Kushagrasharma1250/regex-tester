export function explainRegex(pattern) {
  if (!pattern) return []
  const tokens = []
  let i = 0

  while (i < pattern.length) {
    const ch = pattern[i]

    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1]
      const escapes = {
        d: { label: '\\d', desc: 'Digit', detail: 'Matches any digit from 0 to 9', color: '#60a5fa' },
        D: { label: '\\D', desc: 'Non-digit', detail: 'Matches any character that is NOT a digit', color: '#60a5fa' },
        w: { label: '\\w', desc: 'Word character', detail: 'Matches any letter, digit, or underscore [a-zA-Z0-9_]', color: '#34d399' },
        W: { label: '\\W', desc: 'Non-word', detail: 'Matches any character that is NOT a word character', color: '#34d399' },
        s: { label: '\\s', desc: 'Whitespace', detail: 'Matches space, tab, newline, or other whitespace characters', color: '#a78bfa' },
        S: { label: '\\S', desc: 'Non-whitespace', detail: 'Matches any character that is NOT whitespace', color: '#a78bfa' },
        b: { label: '\\b', desc: 'Word boundary', detail: 'Matches the boundary between a word character and a non-word character', color: '#fb923c' },
        B: { label: '\\B', desc: 'Non-boundary', detail: 'Matches any position that is NOT a word boundary', color: '#fb923c' },
        n: { label: '\\n', desc: 'Newline', detail: 'Matches a newline character', color: '#f472b6' },
        t: { label: '\\t', desc: 'Tab', detail: 'Matches a tab character', color: '#f472b6' },
        r: { label: '\\r', desc: 'Carriage return', detail: 'Matches a carriage return character', color: '#f472b6' },
      }
      if (escapes[next]) {
        tokens.push({ ...escapes[next], raw: '\\' + next })
      } else {
        tokens.push({ raw: '\\' + next, label: '\\' + next, desc: 'Escaped character', detail: `Matches the literal character "${next}"`, color: '#e2e8f0' })
      }
      i += 2
      continue
    }

    if (ch === '[') {
      let j = i + 1
      let cls = '['
      if (j < pattern.length && pattern[j] === '^') { cls += '^'; j++ }
      while (j < pattern.length && pattern[j] !== ']') {
        if (pattern[j] === '\\') { cls += pattern[j] + pattern[j + 1]; j += 2 }
        else { cls += pattern[j]; j++ }
      }
      if (j < pattern.length) { cls += ']'; j++ }
      const negated = cls[1] === '^'
      tokens.push({
        raw: cls,
        label: cls,
        desc: negated ? 'Negated character class' : 'Character class',
        detail: negated
          ? `Matches any character NOT in: ${cls.slice(2, -1)}`
          : `Matches any one character in: ${cls.slice(1, -1)}`,
        color: '#fbbf24',
      })
      i = j
      continue
    }

    if (ch === '(') {
      if (pattern.slice(i, i + 3) === '(?:') {
        tokens.push({ raw: '(?:', label: '(?:', desc: 'Non-capturing group (open)', detail: 'Groups expressions together without capturing. Use this when you need grouping but don\'t need to reference the group later.', color: '#94a3b8' })
        i += 3
      } else if (pattern.slice(i, i + 3) === '(?=') {
        tokens.push({ raw: '(?=', label: '(?=', desc: 'Positive lookahead (open)', detail: 'Asserts that what follows is the pattern inside. Does not consume characters.', color: '#f472b6' })
        i += 3
      } else if (pattern.slice(i, i + 3) === '(?!') {
        tokens.push({ raw: '(?!', label: '(?!', desc: 'Negative lookahead (open)', detail: 'Asserts that what follows is NOT the pattern inside. Does not consume characters.', color: '#f472b6' })
        i += 3
      } else if (pattern.slice(i, i + 4) === '(?<=') {
        tokens.push({ raw: '(?<=', label: '(?<=', desc: 'Positive lookbehind (open)', detail: 'Asserts that what precedes is the pattern inside.', color: '#f472b6' })
        i += 4
      } else if (pattern.slice(i, i + 4) === '(?<!') {
        tokens.push({ raw: '(?<!', label: '(?<!', desc: 'Negative lookbehind (open)', detail: 'Asserts that what precedes is NOT the pattern inside.', color: '#f472b6' })
        i += 4
      } else {
        const groupNum = tokens.filter(t => t.desc && t.desc.includes('Capture group')).length + 1
        tokens.push({ raw: '(', label: '(', desc: `Capture group ${groupNum} (open)`, detail: `Starts capture group #${groupNum}. Everything inside will be captured and can be referenced as $${groupNum} in a replacement.`, color: '#34d399' })
        i++
      }
      continue
    }

    if (ch === ')') {
      tokens.push({ raw: ')', label: ')', desc: 'Group close', detail: 'Closes the group', color: '#94a3b8' })
      i++
      continue
    }

    if ('*+?'.includes(ch) || (ch === '{' && /\{(\d+)(,\d*)?\}/.test(pattern.slice(i)))) {
      let quant = ch
      if (ch === '{') {
        const m = pattern.slice(i).match(/^\{(\d+)(,\d*)?\}/)
        if (m) { quant = m[0]; i += m[0].length } else { i++ }
      } else {
        i++
      }
      if (i < pattern.length && pattern[i] === '?') { quant += '?'; i++ }

      const quantDescs = {
        '*': { desc: 'Zero or more', detail: 'Matches the previous element 0 or more times (greedy — takes as many as possible)' },
        '*?': { desc: 'Zero or more (lazy)', detail: 'Matches the previous element 0 or more times, but as few as possible' },
        '+': { desc: 'One or more', detail: 'Matches the previous element 1 or more times (greedy)' },
        '+?': { desc: 'One or more (lazy)', detail: 'Matches the previous element 1 or more times, but as few as possible' },
        '?': { desc: 'Optional', detail: 'Matches the previous element 0 or 1 time — makes it optional' },
        '??': { desc: 'Optional (lazy)', detail: 'Matches 0 or 1 time, preferring 0' },
      }
      const qd = quantDescs[quant] || { desc: 'Quantifier', detail: `Matches the previous element ${quant} times` }
      tokens.push({ raw: quant, label: quant, ...qd, color: '#fb923c' })
      continue
    }

    const specials = {
      '.': { desc: 'Any character', detail: 'Matches any single character except a newline (unless the "s" flag is set)', color: '#60a5fa' },
      '^': { desc: 'Start anchor', detail: 'Matches the start of the string (or start of each line with the "m" flag)', color: '#f472b6' },
      '$': { desc: 'End anchor', detail: 'Matches the end of the string (or end of each line with the "m" flag)', color: '#f472b6' },
      '|': { desc: 'Alternation', detail: 'Matches either the expression to the left OR the expression to the right (like a logical OR)', color: '#a78bfa' },
    }

    if (specials[ch]) {
      tokens.push({ raw: ch, label: ch, ...specials[ch] })
      i++
      continue
    }

    tokens.push({ raw: ch, label: ch, desc: 'Literal character', detail: `Matches the exact character "${ch}"`, color: '#e2e8f0' })
    i++
  }

  return tokens
}
