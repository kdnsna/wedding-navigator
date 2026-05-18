const fs = require('fs')
const path = require('path')

const outDir = path.resolve(__dirname, '../static/visuals')
const primary = '#1A1A1A'
const rose = '#B03A5B'
const gold = '#C9A96E'
const muted = '#666666'

function svg(body, options = {}) {
  const stroke = options.stroke || primary
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="${stroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
${body}
  </g>
</svg>
`
}

function writeIcon(name, body, options) {
  fs.writeFileSync(path.join(outDir, `icon-${name}.svg`), svg(body, options))
}

const icons = {
  album: `
    <rect x="18" y="22" width="60" height="52" rx="10"/>
    <path d="M26 62l15-16 12 11 8-8 9 13"/>
    <circle cx="62" cy="36" r="5" stroke="${gold}"/>`,
  blessing: `
    <path d="M48 76S20 60 20 38c0-11 8-18 18-18 6 0 10 3 10 8 0-5 4-8 10-8 10 0 18 7 18 18 0 22-28 38-28 38z" stroke="${rose}"/>
    <path d="M36 43h24" stroke="${gold}"/>`,
  date: `
    <rect x="20" y="24" width="56" height="52" rx="10"/>
    <path d="M32 18v14M64 18v14M20 40h56"/>
    <path d="M35 54h8M53 54h8M35 66h8" stroke="${gold}"/>`,
  guide: `
    <path d="M18 72l18-52 16 32 26-12-18 36-18-32-24 28z"/>
    <path d="M36 20l6 24M52 52l8 24" stroke="${gold}"/>`,
  hotel: `
    <path d="M22 76V28c0-5 3-8 8-8h36c5 0 8 3 8 8v48"/>
    <path d="M16 76h64M34 36h8M54 36h8M34 52h8M54 52h8"/>
    <path d="M42 76V62h12v14" stroke="${gold}"/>`,
  location: `
    <path d="M48 80S26 57 26 38c0-13 9-22 22-22s22 9 22 22c0 19-22 42-22 42z"/>
    <circle cx="48" cy="38" r="8" stroke="${rose}"/>`,
  manage: `
    <rect x="20" y="18" width="56" height="60" rx="12"/>
    <path d="M34 34h28M34 48h28M34 62h16"/>
    <circle cx="68" cy="62" r="5" stroke="${gold}"/>`,
  music: `
    <path d="M36 64V28l34-8v36"/>
    <circle cx="29" cy="66" r="9"/>
    <circle cx="63" cy="58" r="9"/>
    <path d="M36 38l34-8" stroke="${gold}"/>`,
  parking: `
    <circle cx="48" cy="48" r="30"/>
    <path d="M40 66V30h14c8 0 13 5 13 12s-5 12-13 12H40"/>`,
  person: `
    <circle cx="48" cy="32" r="12"/>
    <path d="M24 76c4-16 14-24 24-24s20 8 24 24"/>`,
  phone: `
    <path d="M34 18l10 16-8 7c5 10 12 17 22 22l7-8 15 10c-2 8-8 13-16 13-23 0-46-23-46-46 0-8 6-14 16-14z"/>`,
  poster: `
    <rect x="26" y="14" width="44" height="68" rx="8"/>
    <path d="M36 32h24M36 46h24M36 60h14"/>
    <path d="M42 74h12" stroke="${gold}"/>`,
  rsvp: `
    <rect x="18" y="24" width="60" height="48" rx="10"/>
    <path d="M28 40h24M28 54h16"/>
    <path d="M58 54l7 7 13-16" stroke="${rose}"/>`,
  save: `
    <path d="M24 18h40l8 8v52H24V18z"/>
    <path d="M34 18v22h26V18M36 78V58h24v20"/>
    <path d="M44 30h8" stroke="${gold}"/>`,
  speaker: `
    <path d="M18 56V40h14l18-16v48L32 56H18z"/>
    <path d="M60 36c5 7 5 17 0 24M68 28c9 12 9 28 0 40" stroke="${gold}"/>`,
  time: `
    <circle cx="48" cy="48" r="30"/>
    <path d="M48 30v20l14 8" stroke="${rose}"/>`,
  timeline: `
    <path d="M48 18v60"/>
    <circle cx="48" cy="28" r="7" stroke="${gold}"/>
    <circle cx="48" cy="48" r="7"/>
    <circle cx="48" cy="68" r="7" stroke="${rose}"/>
    <path d="M26 28h12M58 48h12M26 68h12"/>`,
  tip: `
    <path d="M48 16c-13 0-24 10-24 23 0 9 5 16 13 20v8h22v-8c8-4 13-11 13-20 0-13-11-23-24-23z"/>
    <path d="M40 80h16M40 68h16"/>
    <path d="M48 30v14M48 54h.1" stroke="${gold}"/>`,
  transport: `
    <path d="M20 58V36c0-7 5-12 12-12h32c7 0 12 5 12 12v22"/>
    <path d="M16 58h64M28 58v10M68 58v10M32 38h32"/>
    <circle cx="32" cy="68" r="6" stroke="${gold}"/>
    <circle cx="64" cy="68" r="6" stroke="${gold}"/>`,
  venue: `
    <path d="M18 76h60"/>
    <path d="M24 76V40l24-18 24 18v36"/>
    <path d="M40 76V56h16v20"/>
    <path d="M36 44h24" stroke="${gold}"/>`,
  warning: `
    <path d="M48 18l34 60H14L48 18z"/>
    <path d="M48 38v18M48 68h.1" stroke="${rose}"/>`,
  'weather-cloudy': `
    <path d="M30 62h36c8 0 14-6 14-14s-6-14-14-14c-3-10-11-16-22-16-12 0-22 9-24 21-7 2-12 6-12 12 0 7 6 11 22 11z"/>
    <path d="M26 28l-8-8" stroke="${gold}"/>`,
  'weather-precip': `
    <path d="M30 44h36c7 0 12-5 12-12s-5-12-12-12c-4-8-11-12-21-12-11 0-19 7-21 17-7 1-12 5-12 10 0 6 5 9 18 9z"/>
    <path d="M34 58l-6 12M50 58l-6 12M66 58l-6 12" stroke="${rose}"/>`,
  'weather-rain': `
    <path d="M30 44h36c7 0 12-5 12-12s-5-12-12-12c-4-8-11-12-21-12-11 0-19 7-21 17-7 1-12 5-12 10 0 6 5 9 18 9z"/>
    <path d="M32 58l-8 12M50 58l-8 12M68 58l-8 12" stroke="${gold}"/>`,
  'weather-sunny': `
    <circle cx="48" cy="48" r="16" stroke="${gold}"/>
    <path d="M48 14v10M48 72v10M14 48h10M72 48h10M24 24l7 7M65 65l7 7M72 24l-7 7M31 65l-7 7"/>`,
  'weather-sunrise': `
    <path d="M18 70h60"/>
    <path d="M30 58c3-8 10-14 18-14s15 6 18 14" stroke="${gold}"/>
    <path d="M48 18v18M38 28l10-10 10 10"/>`,
  'weather-sunset': `
    <path d="M18 70h60"/>
    <path d="M30 58c3-8 10-14 18-14s15 6 18 14" stroke="${gold}"/>
    <path d="M48 36V18M38 26l10 10 10-10"/>`,
  'weather-wind': `
    <path d="M18 34h38c6 0 10-4 10-9s-4-9-9-9c-4 0-7 2-9 6"/>
    <path d="M18 50h52c5 0 8 3 8 8s-4 8-9 8c-4 0-7-2-9-6"/>
    <path d="M18 66h28" stroke="${gold}"/>`
}

for (const [name, body] of Object.entries(icons)) {
  writeIcon(name, body)
}

console.log(`generated ${Object.keys(icons).length} vector icons`)
