/**
 * 请柬用到的线条图标 / 浪花 / 纸纹，全部是内联 SVG（小程序不支持 <svg> 标签，改成 Data URL 背景图）。
 * 路径与 H5 index.html 完全相同。
 */
const WINE = '#773747'
const IVORY = '#F5F0E8'

const svg = (body, viewBox = '0 0 24 24', extra = '') =>
  'url("data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${extra}>${body}</svg>`) +
  '")'

const stroke = (color, w = 1.4, join = true) =>
  `fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${join ? ' stroke-linejoin="round"' : ''}`

const GUIDE = {
  calendar: [false, '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/>'],
  pin: [false, '<path d="M12 21s-6.5-5.3-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.7 12 21 12 21z"/><circle cx="12" cy="10.2" r="2.2"/>'],
  train: [true, '<path d="M5 16V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V16M5 16h14M5 16l-1.5 3M19 16l1.5 3M9 6V4h6v2M8.5 19.5h7"/><circle cx="8.5" cy="12.8" r="0.6"/><circle cx="15.5" cy="12.8" r="0.6"/>'],
  bed: [true, '<path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M3 18h18M3 18v2M21 18v2M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/>'],
  weather: [true, '<circle cx="8" cy="8" r="2.6"/><path d="M8 3.4v1.4M3.4 8h1.4M11.8 4.2l1-1M4.2 4.2l1 1"/><path d="M9.5 20h7.2a3.8 3.8 0 0 0 .7-7.53A5.4 5.4 0 0 0 7 14.6 3.1 3.1 0 0 0 9.5 20z"/>'],
  camera: [true, '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><circle cx="12" cy="13.6" r="3.4"/><path d="M8.5 7.5 10 5h4l1.5 2.5"/>'],
  phone: [true, '<path d="M6.8 3.6h2.9l1.5 4-2 1.5a12.5 12.5 0 0 0 5.7 5.7l1.5-2 4 1.5v2.9a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.8 5.8a2 2 0 0 1 2-2.2z"/>']
}

export const guideIcons = Object.fromEntries(
  Object.entries(GUIDE).map(([k, [join, body]]) => [k, svg(`<g ${stroke(WINE, 1.4, join)}>${body}</g>`)])
)

const arrow = (c) => svg(`<path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" ${stroke(c, 1.3)}/>`, '0 0 12 12')
export const mapArrow = { wine: arrow(WINE), ivory: arrow(IVORY) }

export const envelope = svg(`<g ${stroke(IVORY, 1.5)}><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></g>`)

const wave = (d, fill) => svg(`<path d="${d}" fill="${fill}"/>`, '0 0 1440 60', 'preserveAspectRatio="none"')
export const waves = [
  wave('M0 30 C 240 14, 480 14, 720 30 S 1200 46, 1440 30 L1440 60 L0 60 Z', '#FBF7EF'),
  wave('M0 32 C 180 20, 360 20, 540 31 S 900 44, 1080 32 S 1350 22, 1440 32 L1440 60 L0 60 Z', '#FBF7EF'),
  wave('M0 34 C 120 26, 240 26, 360 33 S 600 42, 720 34 S 960 26, 1080 33 S 1320 42, 1440 34 L1440 60 L0 60 Z', '#F5F0E8')
]

export const endingWave = svg(
  '<path d="M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 122 8" stroke="#5F8494" stroke-width="1.2" stroke-linecap="round" fill="none"/>',
  '0 0 120 14'
)

// 纸张颗粒（与 H5 body::after 相同）
export const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")"
