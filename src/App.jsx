import { useState, useMemo } from 'react'

const FLAG_DEFS = [
  { flag: 'g', label: 'g', title: 'Global — find all matches' },
  { flag: 'i', label: 'i', title: 'Ignore case' },
  { flag: 'm', label: 'm', title: 'Multiline — ^ and $ match line boundaries' },
  { flag: 's', label: 's', title: 'Dot-all — . matches newlines' },
  { flag: 'u', label: 'u', title: 'Unicode mode' },
]

const CHEATSHEET = [
  {
    title: 'Character Classes',
    items: [
      { p: '.', d: 'Any character except newline' },
      { p: '\\d', d: 'Digit [0-9]' },
      { p: '\\D', d: 'Non-digit' },
      { p: '\\w', d: 'Word character [a-zA-Z0-9_]' },
      { p: '\\W', d: 'Non-word character' },
      { p: '\\s', d: 'Whitespace' },
      { p: '\\S', d: 'Non-whitespace' },
    ],
  },
  {
    title: 'Quantifiers',
    items: [
      { p: '*', d: '0 or more' },
      { p: '+', d: '1 or more' },
      { p: '?', d: '0 or 1 (optional)' },
      { p: '{n}', d: 'Exactly n times' },
      { p: '{n,m}', d: 'Between n and m times' },
    ],
  },
  {
    title: 'Anchors & Groups',
    items: [
      { p: '^', d: 'Start of string/line' },
      { p: '$', d: 'End of string/line' },
      { p: '(abc)', d: 'Capture group' },
      { p: '(?:abc)', d: 'Non-capture group' },
      { p: '(?=abc)', d: 'Positive lookahead' },
      { p: '(?!abc)', d: 'Negative lookahead' },
      { p: 'a|b', d: 'a or b' },
    ],
  },
]

function buildRegex(pattern, flags) {
  if (!pattern) return { regex: null, error: null }
  try {
    const regex = new RegExp(pattern, flags)
    return { regex, error: null }
  } catch (e) {
    return { regex: null, error: e.message }
  }
}

function getMatches(regex, text) {
  if (!regex || !text) return []
  const matches = []
  try {
    if (regex.flags.includes('g')) {
      let m
      const r = new RegExp(regex.source, regex.flags)
      while ((m = r.exec(text)) !== null) {
        matches.push({ value: m[0], index: m.index, groups: m.slice(1), namedGroups: m.groups })
        if (m[0].length === 0) r.lastIndex++
      }
    } else {
      const m = regex.exec(text)
      if (m) matches.push({ value: m[0], index: m.index, groups: m.slice(1), namedGroups: m.groups })
    }
  } catch {}
  return matches
}

function HighlightedText({ text, matches }) {
  if (!matches.length) return <div className="highlighted-text">{text || <span style={{ color: 'var(--muted)' }}>Start typing to test your regex...</span>}</div>

  const parts = []
  let last = 0
  for (const m of matches) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), highlight: false })
    parts.push({ text: m.value, highlight: true })
    last = m.index + m.value.length
  }
  if (last < text.length) parts.push({ text: text.slice(last), highlight: false })

  return (
    <div className="highlighted-text">
      {parts.map((p, i) =>
        p.highlight
          ? <mark key={i} className="match">{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </div>
  )
}

export default function App() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('Hello World! Testing regex tester 123.\nEmail: user@example.com\nPhone: (555) 123-4567')
  const [replaceWith, setReplaceWith] = useState('')
  const [rightTab, setRightTab] = useState('matches')
  const [copied, setCopied] = useState(false)

  const toggleFlag = (f) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f)
  }

  const { regex, error } = useMemo(() => buildRegex(pattern, flags), [pattern, flags])
  const matches = useMemo(() => getMatches(regex, testText), [regex, testText])

  const replaceResult = useMemo(() => {
    if (!regex || !testText) return ''
    try {
      return testText.replace(regex, replaceWith)
    } catch {
      return ''
    }
  }, [regex, testText, replaceWith])

  const copyResult = () => {
    navigator.clipboard.writeText(replaceResult).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="app">
      <header>
        <h1>Regex Tester</h1>
        <span className="subtitle">Test and debug regular expressions in real time</span>
      </header>

      <div className="main">
        <div className="panel regex-row">
          <div className="panel-header">
            <span className="panel-title">Regular Expression</span>
            {error
              ? <span className="error-msg">{error}</span>
              : matches.length > 0
                ? <span className="match-count">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
                : pattern
                  ? <span className="match-count zero">0 matches</span>
                  : null
            }
          </div>
          <div className="panel-body" style={{ paddingBottom: '0.6rem' }}>
            <div className={`regex-input-wrapper${error ? ' error' : ''}`}>
              <span className="regex-slash">/</span>
              <input
                className="regex-input"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                spellCheck={false}
              />
              <span className="regex-slash">/</span>
              <input
                className="regex-flags"
                value={flags}
                onChange={e => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
                placeholder="flags"
                spellCheck={false}
                maxLength={6}
              />
            </div>
            <div className="flags-row">
              {FLAG_DEFS.map(({ flag, label, title }) => (
                <button
                  key={flag}
                  className={`flag-btn${flags.includes(flag) ? ' active' : ''}`}
                  title={title}
                  onClick={() => toggleFlag(flag)}
                >
                  <code>{label}</code> <span style={{ color: 'var(--muted)', fontFamily: 'sans-serif', fontSize: '0.72rem' }}>{title.split(' — ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Test String</span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <textarea
              value={testText}
              onChange={e => setTestText(e.target.value)}
              placeholder="Paste or type your test string here..."
              spellCheck={false}
              style={{ minHeight: '120px', flex: 'none' }}
            />
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div className="panel-title" style={{ marginBottom: '0.5rem' }}>Highlighted Matches</div>
              <HighlightedText text={testText} matches={matches} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="tabs">
            <button className={`tab${rightTab === 'matches' ? ' active' : ''}`} onClick={() => setRightTab('matches')}>Matches</button>
            <button className={`tab${rightTab === 'replace' ? ' active' : ''}`} onClick={() => setRightTab('replace')}>Replace</button>
            <button className={`tab${rightTab === 'cheatsheet' ? ' active' : ''}`} onClick={() => setRightTab('cheatsheet')}>Cheatsheet</button>
          </div>

          {rightTab === 'matches' && (
            <div className="panel-body">
              {matches.length === 0 ? (
                <div className="no-matches">
                  {pattern ? (error ? 'Invalid pattern' : 'No matches found') : 'Enter a pattern above to find matches'}
                </div>
              ) : (
                <div className="matches-list">
                  {matches.map((m, i) => (
                    <div key={i} className="match-item">
                      <div className="match-item-header">
                        <span className="match-index">#{i + 1}</span>
                        <span className="match-value">"{m.value}"</span>
                        <span className="match-pos">@{m.index}–{m.index + m.value.length}</span>
                      </div>
                      {(m.groups.length > 0 || m.namedGroups) && (
                        <div className="groups-list">
                          {m.groups.map((g, gi) => (
                            <div key={gi} className="group-item">
                              <span className="group-label">Group {gi + 1}:</span>
                              <span className="group-value">{g ?? 'undefined'}</span>
                            </div>
                          ))}
                          {m.namedGroups && Object.entries(m.namedGroups).map(([k, v]) => (
                            <div key={k} className="group-item">
                              <span className="group-label">{k}:</span>
                              <span className="group-value">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rightTab === 'replace' && (
            <>
              <div className="replace-row">
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Replace with:</span>
                <input
                  className="replace-input"
                  value={replaceWith}
                  onChange={e => setReplaceWith(e.target.value)}
                  placeholder="$1, $2, or literal text..."
                  spellCheck={false}
                />
              </div>
              <div className="panel-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="panel-title">Result</span>
                  <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copyResult}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="result-box">{replaceResult || <span style={{ color: 'var(--muted)' }}>Result will appear here...</span>}</div>
              </div>
            </>
          )}

          {rightTab === 'cheatsheet' && (
            <div className="panel-body">
              <div className="cheatsheet">
                {CHEATSHEET.map(section => (
                  <div key={section.title} className="cheatsheet-section">
                    <h4>{section.title}</h4>
                    {section.items.map(item => (
                      <div key={item.p} className="cheat-item">
                        <span className="cheat-pattern">{item.p}</span>
                        <span className="cheat-desc">{item.d}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
