import { useState, useMemo, useRef, useEffect } from 'react'
import { explainRegex } from './regexExplainer'
import { EXAMPLES } from './examples'

const FLAG_DEFS = [
  { flag: 'g', title: 'Global', desc: 'Find all matches (not just the first)' },
  { flag: 'i', title: 'Ignore case', desc: 'Case-insensitive matching' },
  { flag: 'm', title: 'Multiline', desc: '^ and $ match line boundaries' },
  { flag: 's', title: 'Dot-all', desc: '. matches newlines too' },
  { flag: 'u', title: 'Unicode', desc: 'Full Unicode support' },
]

const MATCH_COLORS = [
  { bg: 'rgba(251,191,36,0.25)', border: '#fbbf24', text: '#fbbf24' },
  { bg: 'rgba(96,165,250,0.25)', border: '#60a5fa', text: '#60a5fa' },
  { bg: 'rgba(52,211,153,0.25)', border: '#34d399', text: '#34d399' },
  { bg: 'rgba(244,114,182,0.25)', border: '#f472b6', text: '#f472b6' },
  { bg: 'rgba(167,139,250,0.25)', border: '#a78bfa', text: '#a78bfa' },
  { bg: 'rgba(251,146,60,0.25)', border: '#fb923c', text: '#fb923c' },
]

const CHEATSHEET = [
  { title: 'Character Classes', items: [
    { p: '.', d: 'Any character (except newline)' },
    { p: '\\d', d: 'Digit [0–9]' },
    { p: '\\D', d: 'Non-digit' },
    { p: '\\w', d: 'Word char [a-zA-Z0-9_]' },
    { p: '\\W', d: 'Non-word character' },
    { p: '\\s', d: 'Whitespace (space, tab…)' },
    { p: '\\S', d: 'Non-whitespace' },
    { p: '[abc]', d: 'Any of a, b, or c' },
    { p: '[^abc]', d: 'Anything except a, b, c' },
    { p: '[a-z]', d: 'Any lowercase letter' },
  ]},
  { title: 'Quantifiers', items: [
    { p: '*', d: '0 or more (greedy)' },
    { p: '+', d: '1 or more (greedy)' },
    { p: '?', d: '0 or 1 — makes optional' },
    { p: '{n}', d: 'Exactly n times' },
    { p: '{n,}', d: 'n or more times' },
    { p: '{n,m}', d: 'Between n and m times' },
    { p: '*?  +?  ??', d: 'Lazy (as few as possible)' },
  ]},
  { title: 'Anchors', items: [
    { p: '^', d: 'Start of string/line' },
    { p: '$', d: 'End of string/line' },
    { p: '\\b', d: 'Word boundary' },
    { p: '\\B', d: 'Non-word boundary' },
  ]},
  { title: 'Groups', items: [
    { p: '(abc)', d: 'Capture group' },
    { p: '(?:abc)', d: 'Non-capturing group' },
    { p: 'a|b', d: 'a or b (alternation)' },
    { p: '(?=abc)', d: 'Positive lookahead' },
    { p: '(?!abc)', d: 'Negative lookahead' },
  ]},
  { title: 'Replacement', items: [
    { p: '$1 $2', d: 'Insert capture group 1, 2…' },
    { p: '$&', d: 'Insert entire match' },
    { p: "$'", d: 'Insert text after match' },
    { p: '$`', d: 'Insert text before match' },
  ]},
]

function buildRegex(pattern, flags) {
  if (!pattern) return { regex: null, error: null }
  try {
    return { regex: new RegExp(pattern, flags), error: null }
  } catch (e) {
    return { regex: null, error: e.message }
  }
}

function getMatches(regex, text) {
  if (!regex || !text) return []
  const results = []
  try {
    if (regex.flags.includes('g')) {
      let m
      const r = new RegExp(regex.source, regex.flags)
      while ((m = r.exec(text)) !== null) {
        results.push({ value: m[0], index: m.index, end: m.index + m[0].length, groups: Array.from(m).slice(1), namedGroups: m.groups || null })
        if (m[0].length === 0) r.lastIndex++
        if (results.length > 500) break
      }
    } else {
      const m = regex.exec(text)
      if (m) results.push({ value: m[0], index: m.index, end: m.index + m[0].length, groups: Array.from(m).slice(1), namedGroups: m.groups || null })
    }
  } catch {}
  return results
}

function HighlightedText({ text, matches, activeMatch, onMatchClick }) {
  if (!text) return <div className="highlighted-text muted-placeholder">Paste or type your test string above…</div>
  if (!matches.length) return <div className="highlighted-text">{text}</div>

  const parts = []
  let last = 0
  matches.forEach((m, mi) => {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), highlight: false })
    parts.push({ text: m.value, highlight: true, index: mi })
    last = m.end
  })
  if (last < text.length) parts.push({ text: text.slice(last), highlight: false })

  return (
    <div className="highlighted-text">
      {parts.map((p, i) => {
        if (!p.highlight) return <span key={i}>{p.text}</span>
        const col = MATCH_COLORS[p.index % MATCH_COLORS.length]
        const isActive = activeMatch === p.index
        return (
          <mark
            key={i}
            className={`match-mark${isActive ? ' active' : ''}`}
            style={{ background: col.bg, borderBottom: `2px solid ${col.border}`, color: col.text, boxShadow: isActive ? `0 0 0 2px ${col.border}` : 'none' }}
            onClick={() => onMatchClick(p.index)}
            title={`Match #${p.index + 1}`}
          >
            {p.text}
          </mark>
        )
      })}
    </div>
  )
}

export default function App() {
  const [pattern, setPattern] = useState('\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Z|a-z]{2,}\\b')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('Hello! Reach me at ssk1250y@gmail.com')
  const [replaceWith, setReplaceWith] = useState('[REDACTED]')
  const [rightTab, setRightTab] = useState('explain')
  const [activeMatch, setActiveMatch] = useState(null)
  const [showExamples, setShowExamples] = useState(false)
  const [copied, setCopied] = useState(false)
  const examplesRef = useRef(null)
  const matchRefs = useRef({})

  const toggleFlag = (f) => setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f)

  const { regex, error } = useMemo(() => buildRegex(pattern, flags), [pattern, flags])
  const matches = useMemo(() => getMatches(regex, testText), [regex, testText])
  const tokens = useMemo(() => explainRegex(pattern), [pattern])

  const replaceResult = useMemo(() => {
    if (!regex || !testText) return ''
    try { return testText.replace(regex, replaceWith) } catch { return '' }
  }, [regex, testText, replaceWith])

  const loadExample = (ex) => {
    setPattern(ex.pattern)
    setFlags(ex.flags)
    setTestText(ex.text)
    setActiveMatch(null)
    setShowExamples(false)
  }

  const handleMatchClick = (idx) => {
    setActiveMatch(idx)
    setRightTab('matches')
    setTimeout(() => {
      matchRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }

  useEffect(() => {
    const handler = (e) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target)) setShowExamples(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyResult = () => {
    navigator.clipboard.writeText(replaceResult).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <div className="logo">
            <span className="logo-slash">/</span>
            <span className="logo-text">regex</span>
            <span className="logo-slash">/</span>
            <span className="logo-badge">tester</span>
          </div>
          <span className="header-tagline">Interactive regular expression tester for beginners</span>
        </div>
        <div className="header-right" ref={examplesRef}>
          <button className="examples-btn" onClick={() => setShowExamples(v => !v)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Examples
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showExamples && (
            <div className="examples-dropdown">
              <div className="examples-title">Choose an example</div>
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="example-item" onClick={() => loadExample(ex)}>
                  <span className="example-label">{ex.label}</span>
                  <code className="example-pattern">/{ex.pattern.slice(0, 28)}{ex.pattern.length > 28 ? '…' : ''}/{ex.flags}</code>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="regex-bar">
        <div className={`regex-input-wrapper${error ? ' error' : regex && matches.length > 0 ? ' has-matches' : ''}`}>
          <span className="regex-delimiter">/</span>
          <input
            className="regex-input"
            value={pattern}
            onChange={e => { setPattern(e.target.value); setActiveMatch(null) }}
            placeholder="Enter your regular expression…"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="regex-delimiter">/</span>
          <div className="flags-input-area">
            <input
              className="flags-input"
              value={flags}
              onChange={e => setFlags(e.target.value.replace(/[^gimsuy]/g, '').split('').filter((c,i,a)=>a.indexOf(c)===i).join(''))}
              placeholder="flags"
              spellCheck={false}
              maxLength={6}
            />
          </div>
        </div>

        <div className="flags-row">
          {FLAG_DEFS.map(({ flag, title, desc }) => (
            <button
              key={flag}
              className={`flag-pill${flags.includes(flag) ? ' active' : ''}`}
              title={desc}
              onClick={() => toggleFlag(flag)}
            >
              <code>{flag}</code>
              <span>{title}</span>
            </button>
          ))}
          <div className="match-badge-area">
            {error
              ? <span className="badge badge-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Invalid pattern</span>
              : pattern
                ? <span className={`badge ${matches.length > 0 ? 'badge-success' : 'badge-zero'}`}>
                    {matches.length > 0
                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> {matches.length} match{matches.length !== 1 ? 'es' : ''}</>
                      : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> No matches</>
                    }
                  </span>
                : null
            }
          </div>
        </div>
        {error && <div className="error-bar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {error}</div>}
      </div>

      <div className="main-grid">
        <div className="left-col">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Test String</span>
              <span className="panel-hint">Click a match below to highlight it</span>
            </div>
            <div className="panel-body">
              <textarea
                value={testText}
                onChange={e => { setTestText(e.target.value); setActiveMatch(null) }}
                placeholder="Paste or type your test string here…"
                spellCheck={false}
                className="test-textarea"
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Match Highlighting</span>
              {matches.length > 0 && (
                <div className="legend">
                  {MATCH_COLORS.slice(0, Math.min(3, matches.length)).map((c, i) => (
                    <span key={i} style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'0.72rem', color: c.text }}>
                      <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background: c.bg, border:`1px solid ${c.border}` }}/>
                      #{i+1}
                    </span>
                  ))}
                  {matches.length > 3 && <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>+{matches.length-3} more</span>}
                </div>
              )}
            </div>
            <div className="panel-body highlight-body">
              <HighlightedText
                text={testText}
                matches={matches}
                activeMatch={activeMatch}
                onMatchClick={handleMatchClick}
              />
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="panel full-height">
            <div className="tabs">
              {[
                { id: 'explain', label: 'Explanation' },
                { id: 'matches', label: `Matches${matches.length ? ` (${matches.length})` : ''}` },
                { id: 'replace', label: 'Replace' },
                { id: 'cheatsheet', label: 'Cheatsheet' },
              ].map(t => (
                <button key={t.id} className={`tab${rightTab === t.id ? ' active' : ''}`} onClick={() => setRightTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {rightTab === 'explain' && (
              <div className="panel-body scrollable">
                {!pattern ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">Enter a pattern to see its explanation</div>
                    <div className="empty-sub">Each part of your regex will be broken down and explained in plain English.</div>
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <div className="empty-title">Fix the pattern error first</div>
                    <div className="empty-sub">{error}</div>
                  </div>
                ) : (
                  <>
                    <div className="explain-visual">
                      {tokens.map((t, i) => (
                        <span key={i} className="token-chip" style={{ background: t.color + '20', border: `1px solid ${t.color}50`, color: t.color }}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <div className="explain-list">
                      {tokens.map((t, i) => (
                        <div key={i} className="explain-item">
                          <code className="explain-token" style={{ color: t.color, background: t.color + '15' }}>{t.label}</code>
                          <div className="explain-text">
                            <div className="explain-desc">{t.desc}</div>
                            <div className="explain-detail">{t.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {rightTab === 'matches' && (
              <div className="panel-body scrollable">
                {matches.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">{pattern && !error ? '🔎' : '✏️'}</div>
                    <div className="empty-title">{pattern && !error ? 'No matches found' : 'Enter a pattern to see matches'}</div>
                    <div className="empty-sub">{pattern && !error ? 'Try adjusting your pattern or test string.' : 'The matches and capture groups will appear here.'}</div>
                  </div>
                ) : (
                  <div className="matches-list">
                    {matches.map((m, i) => {
                      const col = MATCH_COLORS[i % MATCH_COLORS.length]
                      return (
                        <div
                          key={i}
                          ref={el => matchRefs.current[i] = el}
                          className={`match-card${activeMatch === i ? ' active' : ''}`}
                          style={{ borderLeft: `3px solid ${col.border}`, '--match-bg': col.bg }}
                          onClick={() => setActiveMatch(activeMatch === i ? null : i)}
                        >
                          <div className="match-card-header">
                            <span className="match-num" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>#{i + 1}</span>
                            <code className="match-val">"{m.value || '(empty)'}"</code>
                            <span className="match-pos">index {m.index}–{m.end}</span>
                            <span className="match-len">{m.value.length} char{m.value.length !== 1 ? 's' : ''}</span>
                          </div>
                          {m.groups.length > 0 && (
                            <div className="match-groups">
                              <div className="groups-label">Capture groups:</div>
                              {m.groups.map((g, gi) => (
                                <div key={gi} className="group-row">
                                  <span className="group-num">Group {gi + 1}</span>
                                  <code className="group-val">{g === undefined ? <em>not matched</em> : `"${g}"`}</code>
                                </div>
                              ))}
                              {m.namedGroups && Object.entries(m.namedGroups).map(([k, v]) => (
                                <div key={k} className="group-row">
                                  <span className="group-num">?&lt;{k}&gt;</span>
                                  <code className="group-val">"{v}"</code>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {rightTab === 'replace' && (
              <div className="panel-body scrollable">
                <div className="replace-section">
                  <label className="replace-label">Replace matches with:</label>
                  <div className="replace-hint">Use $1, $2… to insert capture groups. Use $& for the full match.</div>
                  <input
                    className="replace-input"
                    value={replaceWith}
                    onChange={e => setReplaceWith(e.target.value)}
                    placeholder="Replacement string… ($1, $&, or literal)"
                    spellCheck={false}
                  />
                </div>
                <div className="replace-result-section">
                  <div className="replace-result-header">
                    <span className="panel-title">Result</span>
                    <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copyResult}>
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="result-box">
                    {regex && testText
                      ? replaceResult
                      : <span className="muted-placeholder">Result will appear here after you enter a pattern and test string…</span>
                    }
                  </div>
                </div>
                {matches.length > 0 && (
                  <div className="replace-summary">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Replaced {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </div>
                )}
              </div>
            )}

            {rightTab === 'cheatsheet' && (
              <div className="panel-body scrollable">
                <div className="cheatsheet-intro">Quick reference — click any pattern to use it in the tester.</div>
                {CHEATSHEET.map(section => (
                  <div key={section.title} className="cheat-section">
                    <div className="cheat-section-title">{section.title}</div>
                    {section.items.map(item => (
                      <div
                        key={item.p}
                        className="cheat-row"
                        onClick={() => { setPattern(prev => prev + item.p.split(/\s+/)[0]) }}
                        title="Click to append to pattern"
                      >
                        <code className="cheat-pat">{item.p}</code>
                        <span className="cheat-desc">{item.d}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
