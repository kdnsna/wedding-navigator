/**
 * 旧七套主题 -> 新四情绪色
 * 与 styles/theme.scss 中的兼容别名严格一一对应，
 * 修改任何一侧必须同步另一侧。
 */
export const LEGACY_THEME_MAP = {
  'red-classic': 'cinnabar',
  'sakura-pink': 'wine',
  champagne: 'wine',
  'minimal-white': 'wine',
  'ocean-blue': 'indigo',
  'violet-dream': 'indigo',
  'garden-green': 'pine',
  rose: 'wine',
  noir: 'indigo',
  garden: 'pine',
  heritage: 'cinnabar',
  shandong: 'cinnabar',
  travel: 'indigo'
}

export const VALID_THEMES = ['wine', 'cinnabar', 'indigo', 'pine']

export const THEME_TOKENS = {
  wine: {
    key: 'wine',
    name: '酒红 · 信笺',
    tier: 'free',
    accent: '#8A3B45',
    accentInk: '#6E2F38',
    onAccent: '#FFFDF8'
  },
  cinnabar: {
    key: 'cinnabar',
    name: '朱砂 · 囍宴',
    tier: 'premium',
    accent: '#C3402B',
    accentInk: '#9E3322',
    onAccent: '#FFFDF8'
  },
  indigo: {
    key: 'indigo',
    name: '黛蓝 · 远书',
    tier: 'premium',
    accent: '#3A5068',
    accentInk: '#2C3E52',
    onAccent: '#FFFDF8'
  },
  pine: {
    key: 'pine',
    name: '松绿 · 庭园',
    tier: 'premium',
    accent: '#4A6151',
    accentInk: '#3A4D40',
    onAccent: '#FFFDF8'
  }
}

export function resolveTheme(key) {
  const normalized = String(key || '').trim().replace(/^theme-/, '')
  if (VALID_THEMES.includes(normalized)) return normalized
  return LEGACY_THEME_MAP[normalized] || 'wine'
}

export function getThemeClass(key) {
  return `theme-${resolveTheme(key)}`
}

export function getThemeTokens(key) {
  return THEME_TOKENS[resolveTheme(key)] || THEME_TOKENS.wine
}

export function isPremiumTheme(key) {
  return resolveTheme(key) !== 'wine'
}
