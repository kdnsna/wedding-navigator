export const DEFAULT_VISUAL_PRESET = 'cinematic-documentary'

export const VISUAL_PRESETS = Object.freeze([
  {
    id: 'cinematic-documentary',
    name: '电影纪实',
    shortName: '电影',
    kicker: 'CINEMATIC STORY',
    desc: '让照片像爱情电影开场，适合街拍、旅拍与自然互动。',
    className: 'visual-cinematic',
    premium: false,
    coverFocus: 'center',
    albumLayout: 'story-strip',
    posterLayout: 'cinematic'
  },
  {
    id: 'new-chinese-ceremony',
    name: '新中式华章',
    shortName: '东方',
    kicker: 'ORIENTAL CEREMONY',
    desc: '强调礼序、留白与东方气韵，适合中式礼服、敬茶和园林照片。',
    className: 'visual-heritage',
    premium: true,
    coverFocus: 'top',
    albumLayout: 'ceremony-scroll',
    posterLayout: 'heritage'
  },
  {
    id: 'garden-film',
    name: '花园胶片',
    shortName: '花园',
    kicker: 'GARDEN FILM',
    desc: '自然、松弛、有生活感，适合草坪、海边、花房与 CCD 影像。',
    className: 'visual-garden',
    premium: true,
    coverFocus: 'center',
    albumLayout: 'contact-sheet',
    posterLayout: 'garden'
  },
  {
    id: 'editorial-couture',
    name: '杂志高定',
    shortName: '高定',
    kicker: 'EDITORIAL COUTURE',
    desc: '像婚礼杂志封面，适合影棚、酒店、黑白礼服和高完成度大片。',
    className: 'visual-editorial',
    premium: true,
    coverFocus: 'top',
    albumLayout: 'editorial-spread',
    posterLayout: 'editorial'
  },
  {
    id: 'night-banquet',
    name: '夜宴片场',
    shortName: '夜宴',
    kicker: 'AFTER DARK',
    desc: '强化夜景、灯光与举杯时刻，适合酒店晚宴和城市夜景。',
    className: 'visual-night',
    premium: true,
    coverFocus: 'center',
    albumLayout: 'night-sequence',
    posterLayout: 'night'
  }
])

const PRESET_BY_ID = Object.freeze(Object.fromEntries(VISUAL_PRESETS.map(item => [item.id, item])))

const SCENARIO_VISUAL_MAP = Object.freeze({
  'rose-couture': 'cinematic-documentary',
  'champagne-editorial': 'editorial-couture',
  'noir-banquet': 'night-banquet',
  'garden-film': 'garden-film',
  'heritage-ritual': 'new-chinese-ceremony',
  'shandong-family': 'new-chinese-ceremony',
  'travel-friendly': 'cinematic-documentary',
  classic: 'cinematic-documentary',
  luxury: 'editorial-couture',
  modern: 'night-banquet'
})

export function resolveVisualPreset(key, scenarioPreset = '') {
  const normalized = String(key || '').trim().replace(/^visual-/, '')
  if (PRESET_BY_ID[normalized]) return normalized
  return SCENARIO_VISUAL_MAP[String(scenarioPreset || '').trim()] || DEFAULT_VISUAL_PRESET
}

export function getVisualPreset(key, scenarioPreset = '') {
  return PRESET_BY_ID[resolveVisualPreset(key, scenarioPreset)] || PRESET_BY_ID[DEFAULT_VISUAL_PRESET]
}

export function getVisualPresetClass(key, scenarioPreset = '') {
  return getVisualPreset(key, scenarioPreset).className
}

export function isPremiumVisualPreset(key, scenarioPreset = '') {
  return getVisualPreset(key, scenarioPreset).premium === true
}

export function getScenarioVisualPreset(scenarioPreset = '') {
  return resolveVisualPreset('', scenarioPreset)
}
