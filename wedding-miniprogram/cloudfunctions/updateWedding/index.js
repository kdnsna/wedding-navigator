const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId, collection, data } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId || !collection || !data) {
    return { success: false, message: '参数不完整' }
  }

  const validCollections = ['weddings', 'invitations', 'albums', 'venues', 'timelines', 'guests', 'blessings']
  if (!validCollections.includes(collection)) {
    return { success: false, message: '无效的集合名称' }
  }

  try {
    // 验证所有权（ weddings 集合）
    if (collection === 'weddings') {
      const ownerRes = await db.collection('weddings').doc(weddingId).get()
      if (ownerRes.data.owner_openid !== OPENID) {
        return { success: false, message: '无权限修改' }
      }
    } else {
      // 非 weddings 集合也校验主人身份
      let ownerRes
      try {
        ownerRes = await db.collection('weddings').doc(weddingId).get()
      } catch (err) {
        return { success: false, message: '查询婚礼失败，请稍后重试' }
      }
      if (!ownerRes.data || ownerRes.data.owner_openid !== OPENID) {
        return { success: false, message: '无权限修改' }
      }
    }

    const protectedFields = ['_id', 'owner_openid', 'created_at']
    const cleanData = { ...data }
    for (const field of protectedFields) {
      delete cleanData[field]
    }
    const normalizedData = normalizeThemeForCollection(collection, cleanData)

    // 所有白名单集合的文档本身就是业务对象。
    // 直接写对象，避免把 invitations 写成 { invitations: {...} } 或把 guests 写成 { guests: { guests: [...] } }。
    const updateData = { ...normalizedData, updated_at: Date.now() }

    try {
      await db.collection(collection).doc(weddingId).update({
        data: updateData
      })
    } catch (err) {
      if (!isDocNotExistError(err) || collection === 'weddings') {
        throw err
      }
      await db.collection(collection).doc(weddingId).set({
        data: { ...updateData, created_at: Date.now() }
      })
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = (err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}

const LEGACY_THEME_MAP = {
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
const VALID_THEMES = ['wine', 'cinnabar', 'indigo', 'pine']

function resolveTheme(key) {
  const normalized = String(key || '').trim().replace(/^theme-/, '')
  if (VALID_THEMES.includes(normalized)) return normalized
  return LEGACY_THEME_MAP[normalized] || 'wine'
}

function readTheme(data = {}) {
  return data.theme || data.basic_info?.theme || data.commercial?.theme_key || data.workspace?.theme_key || ''
}

function normalizeThemeForCollection(collection, data = {}) {
  const rawTheme = readTheme(data)
  if (!rawTheme || (collection !== 'weddings' && collection !== 'invitations')) return data
  const theme = resolveTheme(rawTheme)

  if (collection === 'invitations') {
    return {
      ...data,
      theme,
      commercial: {
        ...(data.commercial || {}),
        theme_key: theme
      }
    }
  }

  const normalized = { ...data }
  if (data.basic_info) normalized.basic_info = { ...data.basic_info, theme }
  if (data.commercial) normalized.commercial = { ...data.commercial, theme_key: theme }
  if (data.workspace) normalized.workspace = { ...data.workspace, theme_key: theme }
  return normalized
}
