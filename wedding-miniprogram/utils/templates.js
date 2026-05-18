export const WEDDING_TEMPLATES = [
  {
    id: 'rose-couture',
    legacyIds: ['classic'],
    name: '红玫瑰高定',
    shortName: '红玫瑰',
    desc: '红金、近黑、大片封面，仪式感最强，默认主推',
    kicker: 'LUXURY ROSE WEDDING',
    className: 'tpl-rose',
    accent: '#B03A5B',
    surface: '#1A1A1A',
    preview: 'linear-gradient(145deg, #4B111E 0%, #B03A5B 52%, #C9A96E 100%)',
    photoMood: '建议使用竖版主封面，人物居中偏上，留出底部文字空间',
    albumMood: '高定相册',
    copy: '适合酒店、宴会厅、正式仪式和大多数婚礼场景'
  },
  {
    id: 'champagne-editorial',
    legacyIds: ['luxury'],
    name: '香槟杂志',
    shortName: '香槟',
    desc: '浅色、拱门、杂志排版，轻盈干净',
    kicker: 'MODERN CEREMONY',
    className: 'tpl-champagne',
    accent: '#A4783B',
    surface: '#F7EEE4',
    preview: 'linear-gradient(145deg, #F7EEE4 0%, #FFFFFF 52%, #C9A96E 100%)',
    photoMood: '建议使用浅色、户外或白纱照片，画面保留自然留白',
    albumMood: '杂志影像',
    copy: '适合草坪、极简、白绿色或香槟色婚礼'
  },
  {
    id: 'noir-banquet',
    legacyIds: ['modern'],
    name: '黑金晚宴',
    shortName: '黑金',
    desc: '强对比、夜宴灯光、黑金卡片，第一眼更戏剧',
    kicker: 'BLACK TIE BANQUET',
    className: 'tpl-noir',
    accent: '#C9A96E',
    surface: '#111111',
    preview: 'linear-gradient(145deg, #050505 0%, #2C2C2C 58%, #C9A96E 100%)',
    photoMood: '建议使用夜景、宴会厅、灯光或黑礼服照片',
    albumMood: '晚宴片场',
    copy: '适合晚宴、酒店宴会厅、高级餐厅和黑金主题'
  },
  {
    id: 'garden-film',
    legacyIds: [],
    name: '花园胶片',
    shortName: '花园',
    desc: '自然、胶片、生活感，照片故事性强',
    kicker: 'GARDEN FILM',
    className: 'tpl-garden',
    accent: '#6F7E5D',
    surface: '#F5F6EF',
    preview: 'linear-gradient(145deg, #EAF0E2 0%, #FFFFFF 54%, #6F7E5D 100%)',
    photoMood: '建议使用草坪、花园、旅拍或自然光照片',
    albumMood: '胶片故事',
    copy: '适合户外、草坪、旅拍和温柔生活感婚礼'
  }
]

const DEFAULT_TEMPLATE_ID = 'rose-couture'

export function normalizeTemplateId(id) {
  const target = WEDDING_TEMPLATES.find(t => t.id === id || t.legacyIds.includes(id))
  return target?.id || DEFAULT_TEMPLATE_ID
}

export function getWeddingTemplate(id) {
  const normalized = normalizeTemplateId(id)
  return WEDDING_TEMPLATES.find(t => t.id === normalized) || WEDDING_TEMPLATES[0]
}

export function getTemplateClass(id) {
  return getWeddingTemplate(id).className
}
