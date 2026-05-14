export const EXAMPLES = [
  {
    label: 'Email address',
    pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    text: 'Contact us at hello@example.com or support@company.org\nInvalid: not-an-email, @missing.com',
  },
  {
    label: 'Phone number (US)',
    pattern: '\\(?\\d{3}\\)?[\\s\\-.]\\d{3}[\\s\\-.]\\d{4}',
    flags: 'g',
    text: 'Call us: (555) 123-4567 or 555.987.6543\nAlso: 800-555-0100',
  },
  {
    label: 'URL',
    pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\._~:/?#[\\]@!$&\'()*+,;=]*)?',
    flags: 'gi',
    text: 'Visit https://www.example.com or http://docs.site.io/guide?q=regex#anchor',
  },
  {
    label: 'Hex color code',
    pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
    flags: 'g',
    text: 'Colors: #ff0000 (red), #00FF00 (green), #00f (shorthand), not #ZZZZZZ',
  },
  {
    label: 'IP address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    flags: 'g',
    text: 'Servers: 192.168.1.1 and 10.0.0.255\nInvalid: 999.1.1.1 or 192.168.1',
  },
  {
    label: 'Date (YYYY-MM-DD)',
    pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    text: 'Events on 2024-01-15 and 2024-12-31\nInvalid: 2024-13-01 or 2024-00-10',
  },
  {
    label: 'HTML tag',
    pattern: '<([a-z][a-z0-9]*)(?:\\s[^>]*)?>(.*?)<\\/\\1>',
    flags: 'gis',
    text: '<h1>Hello World</h1>\n<p class="intro">This is a <strong>test</strong></p>',
  },
  {
    label: 'Words only',
    pattern: '\\b[a-zA-Z]+\\b',
    flags: 'g',
    text: 'Hello World! This has 123 numbers and special @chars too.',
  },
  {
    label: 'Duplicate words',
    pattern: '\\b(\\w+)\\s+\\1\\b',
    flags: 'gi',
    text: 'This is is a test of duplicate words in in a sentence.',
  },
  {
    label: 'Password strength',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%]).{8,}$',
    flags: 'm',
    text: 'Weak123\nStrong@Pass1\nAnotherGood#2024\nnouppercasehere1!',
  },
]
