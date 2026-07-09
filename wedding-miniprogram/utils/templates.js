import { getThemeClass, getThemeTokens, isPremiumTheme, resolveTheme } from '@/utils/legacy-theme-map.js'

export const TEMPLATE_HERO_IMAGES = {
  'rose-couture': '/static/visuals/hero/hero-signature-rose.jpg',
  'champagne-editorial': '/static/visuals/hero/hero-champagne-editorial.jpg',
  'noir-banquet': '/static/visuals/hero/hero-noir-banquet.jpg',
  'garden-film': '/static/visuals/hero/hero-garden-film.jpg',
  'heritage-ritual': '/static/visuals/hero/hero-heritage-ritual.jpg',
  'shandong-family': '/static/visuals/hero/hero-shandong-family.jpg',
  'travel-friendly': '/static/visuals/hero/hero-travel-friendly.jpg'
}

function themeAccent(theme) {
  return getThemeTokens(theme).accent
}

function themeTier(theme) {
  return isPremiumTheme(theme) ? 'premium' : 'free'
}

function buildThemeCommercial(theme, unlockText) {
  const normalizedTheme = resolveTheme(theme)
  const premium = isPremiumTheme(normalizedTheme)
  return {
    tier: premium ? 'premium' : 'free',
    theme_key: normalizedTheme,
    entitlement: premium ? 'premium_templates' : '',
    priceLabel: premium ? '高级模板' : '免费模板',
    unlockText: unlockText || (premium ? '适合作为高级情绪色模板收费' : '基础免费，适合直接上线')
  }
}

export const WEDDING_TEMPLATES = [
  {
    id: 'rose-couture',
    legacyIds: ['classic'],
    name: '红玫瑰高定',
    shortName: '红玫瑰',
    desc: '红金、近黑、大片封面，仪式感最强，默认主推',
    kicker: 'LUXURY ROSE WEDDING',
    className: 'tpl-rose',
    theme: 'wine',
    themeClass: getThemeClass('wine'),
    accent: themeAccent('wine'),
    surface: '#6E2F38',
    preview: 'linear-gradient(145deg, #6E2F38 0%, #8A3B45 52%, #B08D57 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['rose-couture'],
    photoMood: '建议使用竖版主封面，人物居中偏上，留出底部文字空间',
    albumMood: '高定相册',
    copy: '适合酒店、宴会厅、正式仪式和大多数婚礼场景',
    tier: themeTier('wine'),
    commercial: buildThemeCommercial('wine', '基础免费，适合直接上线'),
    preset: {
      mainText: '以爱为名，以余生为约。诚挚邀请您莅临我们的婚礼，在玫瑰与灯光之间，见证我们人生中最珍贵的一刻。',
      venueName: '玫瑰宴会厅'
    },
    plan: {
      scenario: '酒店宴会',
      coverLayout: '竖版主封面，人物居中偏上，底部保留新人姓名、日期与主场地。',
      invitationCopy: '正式、体面、克制，适合长辈与同事同时阅读。',
      timeline: [
        { time: '10:30', title: '宾客签到', roleIds: ['guest'], notes: '建议提前到场，预留停车和合影时间' },
        { time: '11:18', title: '迎宾合影', roleIds: ['guest', 'parents'], notes: '亲友可在签到区与新人合影' },
        { time: '12:08', title: '婚礼仪式', roleIds: ['guest', 'parents', 'vendor'], notes: '以现场主持安排为准', isImportant: true },
        { time: '12:38', title: '喜宴开席', roleIds: ['guest', 'parents'], notes: '请按桌卡入席' },
        { time: '13:18', title: '敬酒致谢', roleIds: ['guest', 'parents'], notes: '新人向亲友致谢' }
      ],
      guide: {
        arrivalTime: '11:30',
        transport: '建议宾客直接前往主场地，外地亲友可提前查看住宿与停车信息。',
        parking: '请以酒店现场停车指引为准，建议预留 20 分钟入场。',
        routeTips: ['普通宾客：直接导航至主场地', '双方父母：建议提前 40 分钟到场']
      },
      posterStyle: {
        title: '正式宴会海报',
        composition: '大幅照片 + 红玫瑰标题 + 小程序码居中收束',
        accent: themeAccent('wine')
      }
    }
  },
  {
    id: 'champagne-editorial',
    legacyIds: ['luxury'],
    name: '香槟杂志',
    shortName: '香槟',
    desc: '浅色、拱门、杂志排版，轻盈干净',
    kicker: 'MODERN CEREMONY',
    className: 'tpl-champagne',
    theme: 'wine',
    themeClass: getThemeClass('wine'),
    accent: themeAccent('wine'),
    surface: '#F7F2E9',
    preview: 'linear-gradient(145deg, #F7F2E9 0%, #FFFDF8 52%, #B08D57 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['champagne-editorial'],
    photoMood: '建议使用浅色、户外或白纱照片，画面保留自然留白',
    albumMood: '杂志影像',
    copy: '适合草坪、极简、白绿色或香槟色婚礼',
    tier: themeTier('wine'),
    commercial: buildThemeCommercial('wine', '基础免费，适合直接上线'),
    preset: {
      mainText: '我们把这一天折进一页温柔的请柬里。愿您与我们一起，在香槟色的光影中，共赴一场关于爱与承诺的仪式。',
      venueName: '香槟花园厅'
    },
    plan: {
      scenario: '草坪简约',
      coverLayout: '浅色户外照片优先，文字放在自然留白处，避免遮挡人物面部。',
      invitationCopy: '轻盈、自然、像一封写给亲友的短笺。',
      timeline: [
        { time: '10:30', title: '宾客抵达', roleIds: ['guest'], notes: '建议穿着便于户外行走的鞋履' },
        { time: '11:00', title: '草坪仪式', roleIds: ['guest', 'parents', 'vendor'], notes: '户外仪式以现场天气安排为准', isImportant: true },
        { time: '11:40', title: '合影与茶歇', roleIds: ['guest'], notes: '可在花园区自由合影' },
        { time: '12:18', title: '午宴开始', roleIds: ['guest'], notes: '请按桌卡入席' }
      ],
      guide: {
        arrivalTime: '10:20',
        transport: '户外场地建议提前查看停车点和步行入口。',
        parking: '如遇雨天，请以新人临时通知的室内入口为准。',
        routeTips: ['普通宾客：直接导航至草坪入口', '摄影司仪：提前确认仪式区与备用室内点位']
      },
      posterStyle: {
        title: '香槟杂志海报',
        composition: '浅底留白 + 拱形照片 + 细线信息分区',
        accent: themeAccent('wine')
      }
    }
  },
  {
    id: 'noir-banquet',
    legacyIds: ['modern'],
    name: '黑金晚宴',
    shortName: '黑金',
    desc: '强对比、夜宴灯光、黑金卡片，第一眼更戏剧',
    kicker: 'BLACK TIE BANQUET',
    className: 'tpl-noir',
    theme: 'indigo',
    themeClass: getThemeClass('indigo'),
    accent: themeAccent('indigo'),
    surface: '#2C3E52',
    preview: 'linear-gradient(145deg, #2C3E52 0%, #3A5068 58%, #B08D57 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['noir-banquet'],
    photoMood: '建议使用夜景、宴会厅、灯光或黑礼服照片',
    albumMood: '晚宴片场',
    copy: '适合晚宴、酒店宴会厅、高级餐厅和黑金主题',
    tier: themeTier('indigo'),
    commercial: buildThemeCommercial('indigo', '适合作为视觉高级模板收费'),
    preset: {
      mainText: '夜幕、灯火、挚爱与挚友。诚邀您出席我们的婚礼晚宴，与我们一同举杯，见证这场属于爱意的黑金时刻。',
      venueName: '黑金宴会厅'
    },
    plan: {
      scenario: '黑金晚宴',
      coverLayout: '夜景或宴会厅照片，人物与灯光形成强对比，底部适合放小程序码。',
      invitationCopy: '晚宴感、朋友感更强，适合年轻宾客比例较高的婚礼。',
      timeline: [
        { time: '17:30', title: '晚宴签到', roleIds: ['guest'], notes: '建议提前到场拍照入席' },
        { time: '18:18', title: '入场仪式', roleIds: ['guest', 'parents', 'vendor'], notes: '灯光较暗，请留意现场引导', isImportant: true },
        { time: '18:40', title: '晚宴开席', roleIds: ['guest'], notes: '请按桌卡入席' },
        { time: '19:30', title: '举杯致谢', roleIds: ['guest', 'parents'], notes: '与新人共同举杯' }
      ],
      guide: {
        arrivalTime: '17:40',
        transport: '晚宴时段建议预留晚高峰通勤时间。',
        parking: '如酒店停车紧张，建议打车或拼车前往。',
        routeTips: ['普通宾客：直接前往宴会厅签到区', '摄影司仪：提前确认灯光与音响控台']
      },
      posterStyle: {
        title: '黑金晚宴海报',
        composition: '暗色照片 + 金色信息条 + 小程序码底部',
        accent: themeAccent('indigo')
      }
    }
  },
  {
    id: 'garden-film',
    legacyIds: [],
    name: '花园胶片',
    shortName: '花园',
    desc: '自然、胶片、生活感，照片故事性强',
    kicker: 'GARDEN FILM',
    className: 'tpl-garden',
    theme: 'pine',
    themeClass: getThemeClass('pine'),
    accent: themeAccent('pine'),
    surface: '#F7F2E9',
    preview: 'linear-gradient(145deg, #E5E9DF 0%, #FFFDF8 54%, #4A6151 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['garden-film'],
    photoMood: '建议使用草坪、花园、旅拍或自然光照片',
    albumMood: '胶片故事',
    copy: '适合户外、草坪、旅拍和温柔生活感婚礼',
    tier: themeTier('pine'),
    commercial: buildThemeCommercial('pine', '适合作为庭园情绪色模板收费'),
    preset: {
      mainText: '在花香、微风与自然光里，我们将把相爱的日常郑重写成誓言。期待您来到现场，和我们一起收藏这段春日般的记忆。',
      venueName: '花园草坪仪式区'
    },
    plan: {
      scenario: '花园胶片',
      coverLayout: '自然光、旅拍或生活感照片，适合保留胶片颗粒与真实表情。',
      invitationCopy: '像一段日常故事，少一些排场，多一些亲近。',
      timeline: [
        { time: '09:30', title: '亲友抵达', roleIds: ['guest'], notes: '可先在花园区自由合影' },
        { time: '10:18', title: '户外仪式', roleIds: ['guest', 'parents', 'vendor'], notes: '请以现场座位引导为准', isImportant: true },
        { time: '10:50', title: '亲友合影', roleIds: ['guest', 'parents'], notes: '按亲友分组合影' },
        { time: '11:30', title: '简餐茶歇', roleIds: ['guest'], notes: '轻松交流，感谢到场' }
      ],
      guide: {
        arrivalTime: '09:50',
        transport: '建议提前确认户外入口，雨天请留意临时通知。',
        parking: '户外场地停车位有限，建议拼车或打车。',
        routeTips: ['普通宾客：直接导航至花园入口', '双方父母：提前抵达合影区']
      },
      posterStyle: {
        title: '胶片故事海报',
        composition: '照片拼贴 + 细体中文标题 + 温柔绿色点缀',
        accent: themeAccent('pine')
      }
    }
  },
  {
    id: 'heritage-ritual',
    legacyIds: [],
    name: '新中式礼宴',
    shortName: '新中式',
    desc: '红金、留白、礼序感，适合重视敬茶改口和家庭仪式的婚礼',
    kicker: '中式礼宴',
    className: 'tpl-rose',
    theme: 'cinnabar',
    themeClass: getThemeClass('cinnabar'),
    accent: themeAccent('cinnabar'),
    surface: '#FAF6EF',
    preview: 'linear-gradient(145deg, #9E3322 0%, #FAF6EF 54%, #B08D57 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['heritage-ritual'],
    photoMood: '建议使用中式礼服、敬茶或家宴场景照片，画面要端正、留白充足',
    albumMood: '礼序影像',
    copy: '适合中式礼服、敬茶改口、证婚和家庭仪式感较强的婚礼',
    tier: themeTier('cinnabar'),
    commercial: buildThemeCommercial('cinnabar', '适合作为礼序方案模板收费'),
    preset: {
      mainText: '良辰已定，喜期将至。谨以此函敬邀亲友莅临喜宴，见证我们结为连理，也与家人同享这份团圆与欢喜。',
      venueName: '中式礼宴厅'
    },
    plan: {
      scenario: '新中式',
      coverLayout: '中式礼服或敬茶照片，姓名和日期采用竖向或居中排版。',
      invitationCopy: '恭敬、清楚、有礼，优先照顾长辈阅读习惯。',
      timeline: [
        { time: '08:18', title: '迎亲出发', roleIds: ['parents', 'party'], notes: '以双方家庭安排为准' },
        { time: '09:28', title: '敬茶改口', roleIds: ['parents', 'party'], notes: '双方父母与新人参与', isImportant: true },
        { time: '11:18', title: '亲友签到', roleIds: ['guest'], notes: '请按席位牌入席' },
        { time: '12:08', title: '证婚礼成', roleIds: ['guest', 'parents', 'vendor'], notes: '共同见证新人礼成', isImportant: true },
        { time: '12:38', title: '喜宴开席', roleIds: ['guest'], notes: '敬备喜筵，恭候亲友' }
      ],
      guide: {
        arrivalTime: '11:30',
        transport: '亲友可直接前往喜宴场地，参与迎亲和敬茶的家人请按家庭群通知集合。',
        parking: '请预留停车、签到和认亲寒暄时间。',
        routeTips: ['普通宾客：直接前往喜宴场地', '父母亲友：按家庭通知提前到场参与礼序']
      },
      posterStyle: {
        title: '新中式礼宴海报',
        composition: '红金留白 + 礼序文案 + 小程序码底部',
        accent: themeAccent('cinnabar')
      }
    }
  },
  {
    id: 'shandong-family',
    legacyIds: [],
    name: '山东家宴',
    shortName: '家宴',
    desc: '体面、明白、节俭有礼，强调接亲路线、席设地点和回门安排',
    kicker: '喜宴手册',
    className: 'tpl-champagne',
    theme: 'cinnabar',
    themeClass: getThemeClass('cinnabar'),
    accent: themeAccent('cinnabar'),
    surface: '#FBF7F1',
    preview: 'linear-gradient(145deg, #F4E4D7 0%, #FFFDF8 48%, #C3402B 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['shandong-family'],
    photoMood: '建议使用端正合影、家宴或仪式照片，信息区域保持清晰易读',
    albumMood: '家宴纪实',
    copy: '适合重视亲友到场、接亲、会亲、回门和席位安排的山东家庭婚礼',
    tier: themeTier('cinnabar'),
    commercial: buildThemeCommercial('cinnabar', '适合作为地域习俗方案模板收费'),
    preset: {
      mainText: '喜期已定，敬备薄酌。诚邀亲友拨冗赴宴，见证新人礼成，同叙亲情，共贺良缘。',
      venueName: '喜宴大厅'
    },
    plan: {
      scenario: '山东家宴',
      coverLayout: '信息优先，主照片不遮挡日期、席设地点、建议到达时间。',
      invitationCopy: '少夸张、多实用，强调亲友赴宴、路线清楚、喜事新办。',
      timeline: [
        { time: '07:58', title: '接亲集合', roleIds: ['party', 'parents'], notes: '接亲人员按家庭通知集合' },
        { time: '09:28', title: '迎亲礼成', roleIds: ['party', 'parents'], notes: '以双方家庭安排为准' },
        { time: '10:58', title: '宾客签到', roleIds: ['guest'], notes: '亲友到场后请查看桌号' },
        { time: '11:38', title: '认亲合影', roleIds: ['guest', 'parents'], notes: '双方亲友可按桌合影' },
        { time: '12:08', title: '喜宴开席', roleIds: ['guest', 'parents'], notes: '请按席位入座', isImportant: true },
        { time: '14:00', title: '送客致谢', roleIds: ['guest', 'parents'], notes: '感谢亲友到场见证' }
      ],
      guide: {
        arrivalTime: '10:50',
        transport: '普通宾客直接到喜宴大厅；接亲亲友、双方父母和外地亲友按各自路线到场。',
        parking: '建议提前到场，预留停车、认亲和入席时间。',
        routeTips: ['普通宾客：直接导航至喜宴大厅', '接亲亲友：按家庭群路线集合', '外地宾客：优先查看住宿与停车信息']
      },
      posterStyle: {
        title: '家宴实用海报',
        composition: '清晰日期地点 + 家宴照片 + 醒目小程序码',
        accent: themeAccent('cinnabar')
      }
    }
  },
  {
    id: 'travel-friendly',
    legacyIds: [],
    name: '异地宾客友好',
    shortName: '异地友好',
    desc: '把住宿、交通、停车和到达时间放在前面，适合外地亲友多的婚礼',
    kicker: '宾客路书',
    className: 'tpl-garden',
    theme: 'indigo',
    themeClass: getThemeClass('indigo'),
    accent: themeAccent('indigo'),
    surface: '#F5F6EF',
    preview: 'linear-gradient(145deg, #E5E7EA 0%, #FFFDF8 50%, #3A5068 100%)',
    defaultHero: TEMPLATE_HERO_IMAGES['travel-friendly'],
    photoMood: '建议使用城市、酒店、合影或旅拍照片，信息层要足够清楚',
    albumMood: '到场手册',
    copy: '适合异地宾客较多、需要重点说明住宿交通和时间安排的婚礼',
    tier: themeTier('indigo'),
    commercial: buildThemeCommercial('indigo', '适合作为路书方案模板收费'),
    preset: {
      mainText: '为了让远道而来的亲友更安心，我们把时间、地点、路线和住宿整理成这本手册。期待您顺利抵达，与我们相聚。',
      venueName: '婚礼主场地'
    },
    plan: {
      scenario: '异地宾客友好',
      coverLayout: '封面首屏保留主场地、建议到达时间、住宿入口，不让宾客反复查找。',
      invitationCopy: '温和、清楚，重点回应“怎么来、住哪里、几点到”。',
      timeline: [
        { time: '10:30', title: '外地宾客抵达', roleIds: ['guest'], notes: '可先办理入住或寄存行李' },
        { time: '11:20', title: '宾客签到', roleIds: ['guest'], notes: '请预留路程与停车时间' },
        { time: '12:08', title: '仪式开始', roleIds: ['guest', 'parents', 'vendor'], notes: '以现场安排为准', isImportant: true },
        { time: '12:38', title: '宴席开始', roleIds: ['guest'], notes: '请按桌卡入席' }
      ],
      guide: {
        arrivalTime: '11:20',
        transport: '建议外地宾客提前收藏酒店、主场地和停车点，遇到堵车可直接打车前往。',
        parking: '停车信息以现场为准，建议外地亲友优先打车或拼车。',
        routeTips: ['外地宾客：先查看住宿，再导航至主场地', '普通宾客：直接导航至主场地']
      },
      posterStyle: {
        title: '路书型分享海报',
        composition: '主场地信息前置 + 路线提示 + 小程序码',
        accent: themeAccent('indigo')
      }
    }
  }
]

const DEFAULT_TEMPLATE_ID = 'rose-couture'

export const DEFAULT_TIMELINE_ROLES = [
  { id: 'guest', name: '普通宾客' },
  { id: 'party', name: '伴郎伴娘' },
  { id: 'parents', name: '双方父母' },
  { id: 'vendor', name: '摄影司仪' }
]

export function normalizeTemplateId(id) {
  const target = WEDDING_TEMPLATES.find(t => t.id === id || t.legacyIds.includes(id))
  if (target) return target.id
  const theme = resolveTheme(id)
  return WEDDING_TEMPLATES.find(t => t.theme === theme)?.id || DEFAULT_TEMPLATE_ID
}

export function getWeddingTemplate(id) {
  const normalized = normalizeTemplateId(id)
  return WEDDING_TEMPLATES.find(t => t.id === normalized) || WEDDING_TEMPLATES[0]
}

export function getTemplateClass(id) {
  const template = getWeddingTemplate(id)
  return [template.className, getThemeClass(template.theme || template.themeClass)].filter(Boolean).join(' ')
}

export function getTemplateTheme(id) {
  const template = getWeddingTemplate(id)
  return resolveTheme(template.theme || template.themeClass)
}

export function getTemplateHeroImage(id) {
  const template = getWeddingTemplate(id)
  return template.defaultHero || TEMPLATE_HERO_IMAGES[DEFAULT_TEMPLATE_ID]
}

const MOOD_POSTER_THEME_MAP = {
  'theme-wine': {
    background: ['#6E2F38', '#8A3B45', '#2A231D'],
    photoOverlay: 'rgba(42, 35, 29, 0.56)',
    text: '#FFFDF8',
    muted: 'rgba(255, 253, 248, 0.62)',
    faint: 'rgba(255, 253, 248, 0.20)',
    line: 'rgba(255, 253, 248, 0.16)',
    accent: '#B08D57',
    qrText: 'rgba(42, 35, 29, 0.38)'
  },
  'theme-cinnabar': {
    background: ['#9E3322', '#C3402B', '#F7F2E9'],
    photoOverlay: 'rgba(63, 18, 10, 0.56)',
    text: '#FFFDF8',
    muted: 'rgba(255, 253, 248, 0.64)',
    faint: 'rgba(255, 253, 248, 0.20)',
    line: 'rgba(176, 141, 87, 0.26)',
    accent: '#B08D57',
    qrText: 'rgba(42, 35, 29, 0.38)'
  },
  'theme-indigo': {
    background: ['#2C3E52', '#3A5068', '#111820'],
    photoOverlay: 'rgba(12, 22, 32, 0.60)',
    text: '#FFFDF8',
    muted: 'rgba(255, 253, 248, 0.62)',
    faint: 'rgba(255, 253, 248, 0.18)',
    line: 'rgba(176, 141, 87, 0.22)',
    accent: '#B08D57',
    qrText: 'rgba(42, 35, 29, 0.38)'
  },
  'theme-pine': {
    background: ['#F7F2E9', '#E5E9DF', '#3A4D40'],
    photoOverlay: 'rgba(247, 242, 233, 0.68)',
    text: '#2A231D',
    muted: 'rgba(42, 35, 29, 0.58)',
    faint: 'rgba(42, 35, 29, 0.18)',
    line: 'rgba(74, 97, 81, 0.24)',
    accent: '#4A6151',
    qrText: 'rgba(42, 35, 29, 0.44)'
  }
}

const POSTER_THEME_MAP = {
  ...MOOD_POSTER_THEME_MAP,
  'theme-rose': MOOD_POSTER_THEME_MAP['theme-wine'],
  'theme-champagne': MOOD_POSTER_THEME_MAP['theme-wine'],
  'theme-noir': MOOD_POSTER_THEME_MAP['theme-indigo'],
  'theme-garden': MOOD_POSTER_THEME_MAP['theme-pine'],
  'theme-heritage': MOOD_POSTER_THEME_MAP['theme-cinnabar'],
  'theme-shandong': MOOD_POSTER_THEME_MAP['theme-cinnabar'],
  'theme-travel': MOOD_POSTER_THEME_MAP['theme-indigo']
}

export function getTemplatePosterTheme(id) {
  const template = getWeddingTemplate(id)
  const themeClass = getThemeClass(template.theme || template.themeClass)
  return POSTER_THEME_MAP[themeClass] || POSTER_THEME_MAP[template.themeClass] || POSTER_THEME_MAP['theme-wine']
}

const TEMPLATE_PREVIEW_EXAMPLES = {
  'rose-couture': {
    couple: { groom: '顾临川', bride: '沈知夏' },
    date: '2026-11-14',
    time: '12:08',
    venueName: '玫瑰宴会厅',
    address: '济南市历下区经十路 99 号',
    coverLine: '玫瑰、灯光与正式宴会',
    weather: '晴 18-25°C',
    transport: '建议 11:30 前到达，酒店地下停车场可用',
    rsvpName: '王一鸣',
    blessings: ['愿你们在日常里一直相爱，在热闹里也能听见彼此。', '今天的玫瑰和灯光都很衬你们，祝新婚快乐。'],
    gallery: ['迎宾合影', '宴会厅仪式', '玫瑰花墙']
  },
  'champagne-editorial': {
    couple: { groom: '周予安', bride: '林若晴' },
    date: '2026-05-20',
    time: '11:00',
    venueName: '香槟花园厅',
    address: '青岛市崂山区海景路 28 号',
    coverLine: '花园、白纱与一页短笺',
    weather: '多云 19-24°C',
    transport: '户外仪式请从花园南门进入，雨天改为室内厅',
    rsvpName: '陈思远',
    blessings: ['像今天的风一样轻盈，愿你们把温柔过成很长的以后。', '草坪和香槟色都刚刚好，祝你们新婚快乐。'],
    gallery: ['草坪仪式', '花园茶歇', '白纱影像']
  },
  'noir-banquet': {
    couple: { groom: '陆辰', bride: '许知意' },
    date: '2026-10-18',
    time: '18:18',
    venueName: '黑金宴会厅',
    address: '上海市黄浦区外滩中山东一路 8 号',
    coverLine: '夜幕、灯火与举杯时刻',
    weather: '晴 17-22°C',
    transport: '晚高峰建议打车到酒店正门，地下 B2 可停车',
    rsvpName: '赵嘉禾',
    blessings: ['今晚的灯光很像电影结尾，愿你们一直有好故事。', '祝你们在人生的每一次举杯里，都有彼此。'],
    gallery: ['夜宴入场', '烛光誓言', '举杯致谢']
  },
  'garden-film': {
    couple: { groom: '宋屿', bride: '唐栀' },
    date: '2026-04-26',
    time: '10:18',
    venueName: '花园草坪仪式区',
    address: '杭州市西湖区龙井路 66 号',
    coverLine: '自然光、胶片与生活感',
    weather: '晴 16-23°C',
    transport: '草坪入口在园区东侧，建议步行或拼车到达',
    rsvpName: '刘可',
    blessings: ['愿你们把每个普通清晨，都过成值得收藏的胶片。', '今天像春天本身，祝你们一直鲜活相爱。'],
    gallery: ['花园合影', '自然光仪式', '胶片故事']
  },
  'heritage-ritual': {
    couple: { groom: '贺云舟', bride: '温明月' },
    date: '2026-09-12',
    time: '12:08',
    venueName: '中式礼宴厅',
    address: '南京市秦淮区夫子庙街 18 号',
    coverLine: '敬茶、礼序与两家团圆',
    weather: '晴 20-27°C',
    transport: '亲友 11:30 前到达喜宴厅，敬茶亲属按家庭群通知集合',
    rsvpName: '张伯远',
    blessings: ['良辰美景，佳偶天成，愿两家亲友同享长久欢喜。', '礼成之日，祝新人琴瑟和鸣，岁岁安康。'],
    gallery: ['敬茶改口', '礼宴入席', '合家欢喜']
  },
  'shandong-family': {
    couple: { groom: '赵明远', bride: '孙嘉宁' },
    date: '2026-11-14',
    time: '12:08',
    venueName: '喜宴大厅',
    address: '济南市市中区经七路 168 号',
    coverLine: '席设何处、几点到场、亲友明白',
    weather: '晴 12-20°C',
    transport: '普通宾客直接到喜宴大厅，接亲亲友按家庭群路线集合',
    rsvpName: '刘叔',
    blessings: ['喜期已定，亲友同贺，祝小两口日子越过越红火。', '喜事新办也体面，祝新人百年好合，阖家欢乐。'],
    gallery: ['接亲路线', '认亲合影', '喜宴开席']
  },
  'travel-friendly': {
    couple: { groom: '陈北辰', bride: '乔南枝' },
    date: '2026-08-22',
    time: '12:08',
    venueName: '婚礼主场地',
    address: '苏州市工业园区月光码头 6 号',
    coverLine: '远道而来，也能顺利抵达',
    weather: '多云 24-31°C',
    transport: '外地亲友先办理入住，再打车 12 分钟到主场地',
    rsvpName: '李梦然',
    blessings: ['从很远的地方来，也很值得。祝你们一路相伴，一路有光。', '路书很清楚，婚礼很温暖，祝新婚快乐。'],
    gallery: ['酒店入住', '主场地路线', '亲友相聚']
  }
}

export function buildTemplatePreviewData(templateId) {
  const template = getWeddingTemplate(templateId)
  const example = TEMPLATE_PREVIEW_EXAMPLES[template.id] || TEMPLATE_PREVIEW_EXAMPLES[DEFAULT_TEMPLATE_ID]
  const timeline = buildTemplateTimeline(template.id).events
  const guide = buildTemplateGuide(template.id, {
    venueName: example.venueName,
    venueAddress: example.address,
    time: example.time
  })
  return {
    template,
    templateClass: getTemplateClass(template.id),
    couple: example.couple,
    date: example.date,
    time: example.time,
    venueName: example.venueName,
    address: example.address,
    coverLine: example.coverLine,
    weather: example.weather,
    transport: example.transport,
    rsvpName: example.rsvpName,
    invitationText: template.preset?.mainText || '',
    gallery: example.gallery,
    blessings: example.blessings,
    timeline,
    guide,
    stats: {
      rsvp: 86,
      blessings: 24,
      views: 1298
    }
  }
}

export function buildTemplateTimeline(templateId, mainVenueId = 'main-venue') {
  const template = getWeddingTemplate(templateId)
  const timeline = template.plan?.timeline || []
  return {
    roles: DEFAULT_TIMELINE_ROLES,
    events: timeline.map((event, index) => ({
      id: `${template.id}-${String(index + 1).padStart(2, '0')}`,
      time: event.time,
      title: event.title,
      venue_id: event.venue_id || mainVenueId,
      notes: event.notes || '',
      is_important: Boolean(event.isImportant || event.is_important),
      assignee_ids: event.roleIds || event.assignee_ids || ['guest'],
      sort_order: index
    }))
  }
}

export function buildTemplateGuide(templateId, options = {}) {
  const template = getWeddingTemplate(templateId)
  const guide = template.plan?.guide || {}
  return {
    venues: [{
      id: options.mainVenueId || 'main-venue',
      name: options.venueName || template.preset?.venueName || '婚礼主场地',
      type: 'venue',
      address: options.venueAddress || '',
      arrival_time: guide.arrivalTime || options.time || '',
      contact_phone: '',
      coordinate: null
    }],
    transportation: {
      transport: guide.transport || '',
      parking: guide.parking || '',
      route_tips: guide.routeTips || []
    },
    accommodations: []
  }
}
