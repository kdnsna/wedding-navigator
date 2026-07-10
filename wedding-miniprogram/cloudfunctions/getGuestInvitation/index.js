const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event = {}) => {
  const weddingId = String(event.weddingId || '').trim()
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, code: 'INVALID_ID', message: '缺少婚礼ID' }
  }

  try {
    const weddingRes = await safeGet('weddings', weddingId)
    if (!weddingRes.data) {
      return { success: false, code: 'NOT_FOUND', message: '这封邀请不存在或已失效' }
    }

    const isOwner = Boolean(OPENID && weddingRes.data.owner_openid === OPENID)
    const weddingStatus = weddingRes.data.status || 'draft'
    if (!isOwner && weddingStatus !== 'published' && weddingStatus !== 'ended') {
      return { success: false, code: 'NOT_PUBLISHED', message: '这封邀请尚未启封' }
    }

    const [invitationRes, albumRes, venuesRes, timelineRes, ownRsvp] = await Promise.all([
      safeGet('invitations', weddingId),
      safeGet('albums', weddingId),
      safeGet('venues', weddingId),
      safeGet('timelines', weddingId),
      getOwnRsvp(weddingId, OPENID)
    ])

    if (!invitationRes.data) {
      return { success: false, code: 'NOT_READY', message: '这封邀请尚未写完' }
    }

    const publicWedding = sanitizePublicDocument(weddingRes.data, weddingId)
    const publicInvitation = sanitizePublicDocument(invitationRes.data, weddingId)

    return {
      success: true,
      state: weddingStatus === 'ended' ? 'closed' : 'ready',
      data: {
        wedding: publicWedding,
        invitation: publicInvitation,
        album: sanitizePublicDocument(albumRes.data, weddingId) || { photos: [] },
        venues: sanitizePublicDocument(venuesRes.data, weddingId) || { venues: [] },
        timeline: sanitizePublicDocument(timelineRes.data, weddingId) || { events: [] },
        guests: {
          guests: ownRsvp ? [sanitizeCurrentRsvp(ownRsvp)] : []
        }
      }
    }
  } catch (err) {
    console.error('getGuestInvitation failed:', err)
    return { success: false, code: 'INTERNAL_ERROR', message: '邀请暂时无法打开，请稍后重试' }
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

async function getOwnRsvp(weddingId, openid) {
  if (!openid) return null
  try {
    const res = await db.collection('guests')
      .aggregate()
      .match({ _id: weddingId })
      .unwind('$guests')
      .match({ 'guests.openid': openid })
      .project({ _id: 0, guest: '$guests' })
      .limit(1)
      .end()
    const list = res.list || res.data || []
    return list[0]?.guest || null
  } catch (err) {
    if (isNotFoundError(err)) return null
    console.warn('getOwnRsvp aggregate fallback:', err)
    const guestsRes = await safeGet('guests', weddingId)
    const list = normalizeList(guestsRes.data, 'guests')
    return list.find(item => item?.openid === openid) || null
  }
}

function sanitizePublicDocument(doc, id) {
  if (!doc) return null
  const {
    owner_openid,
    owner_profile_id,
    commercial,
    workspace,
    entitlement,
    entitlements,
    ...publicData
  } = doc
  return { ...publicData, _id: id }
}

function sanitizeCurrentRsvp(rsvp) {
  const { openid, ...publicRsvp } = rsvp || {}
  return { ...publicRsvp, is_current_user: true }
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
