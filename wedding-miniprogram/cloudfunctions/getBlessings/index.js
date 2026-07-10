const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event = {}) => {
  const weddingId = String(event.weddingId || '').trim()
  const limit = Math.min(Math.max(Number(event.limit) || 20, 1), 50)
  const offset = Math.max(Number(event.cursor) || 0, 0)
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) return { success: false, code: 'INVALID_ID', message: '缺少婚礼ID' }

  try {
    const [weddingRes, invitationRes, blessingsRes] = await Promise.all([
      safeGet('weddings', weddingId),
      safeGet('invitations', weddingId),
      safeGet('blessings', weddingId)
    ])
    const isOwner = Boolean(OPENID && weddingRes.data?.owner_openid === OPENID)
    const isPublic = ['published', 'ended'].includes(weddingRes.data?.status)
    if (!weddingRes.data || (!isOwner && !isPublic)) {
      return { success: false, code: 'NOT_FOUND', message: '这封邀请不存在或已失效' }
    }
    if (invitationRes.data?.features?.blessing_public === false) {
      return { success: true, blessings: [], nextCursor: null, total: 0 }
    }

    const all = normalizeList(blessingsRes.data, 'blessings')
      .filter(item => item?.visible !== false)
      .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
    const page = all.slice(offset, offset + limit).map(({ openid, ...item }) => item)
    const nextCursor = offset + page.length < all.length ? offset + page.length : null
    return { success: true, blessings: page, nextCursor, total: all.length }
  } catch (err) {
    console.error('getBlessings failed:', err)
    return { success: false, code: 'INTERNAL_ERROR', message: '祝福暂时无法展开' }
  }
}

async function safeGet(collection, id) {
  try {
    return await db.collection(collection).doc(id).get()
  } catch (err) {
    if (isNotFoundError(err)) return { data: null }
    throw err
  }
}

function normalizeList(doc, key) {
  if (!doc) return []
  if (Array.isArray(doc[key])) return doc[key]
  if (Array.isArray(doc[key]?.[key])) return doc[key][key]
  return []
}

function isNotFoundError(err) {
  if (!err) return false
  if ([-502005, -501000].includes(err.errCode)) return true
  const message = String(err.errMsg || err.message || '').toLowerCase()
  return message.includes('not exist') || message.includes('not found')
}
