const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, guestLimit = 100, blessingLimit = 50 } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    // 并行查询核心数据
    const [
      weddingRes,
      invitationRes,
      albumRes,
      venuesRes,
      timelineRes,
      statsRes
    ] = await Promise.all([
      db.collection('weddings').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('invitations').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('albums').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('venues').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('timelines').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('share_stats').doc(weddingId).get().catch(() => ({ data: null }))
    ])

    if (!weddingRes.data) {
      return { success: false, message: '婚礼不存在' }
    }

    const isOwner = weddingRes.data.owner_openid === OPENID

    let weddingData = weddingRes.data
    if (!isOwner) {
      const { owner_openid, ...safeWedding } = weddingData
      weddingData = safeWedding
    }

    // 分页查询 guests 和 blessings，避免响应超限
    const guestLimitNum = Math.min(Math.max(1, guestLimit), 500)
    const blessingLimitNum = Math.min(Math.max(1, blessingLimit), 200)

    let guestsData = null
    let blessingsData = null

    try {
      const guestsRes = await db.collection('guests').doc(weddingId).get()
      guestsData = normalizeListDocument(guestsRes.data, 'guests')
      if (guestsData && guestsData.guests) {
        const total = guestsData.guests.length
        const sliced = guestsData.guests.slice(0, guestLimitNum)
        if (!isOwner) {
          const ownGuests = OPENID ? guestsData.guests.filter(g => g.openid === OPENID) : []
          guestsData = {
            ...guestsData,
            guests: ownGuests.map(g => {
              const { phone, dietary, openid, ...safe } = g
              return safe
            }),
            _totalGuests: total,
            _truncated: false
          }
        } else if (isOwner) {
          guestsData = {
            ...guestsData,
            guests: sliced,
            _totalGuests: total,
            _truncated: sliced.length < total
          }
        }
      }
    } catch (err) {
      console.warn('guests 查询失败:', err.message)
    }

    try {
      const blessingsRes = await db.collection('blessings').doc(weddingId).get()
      blessingsData = normalizeListDocument(blessingsRes.data, 'blessings')
      if (blessingsData && blessingsData.blessings) {
        const total = blessingsData.blessings.length
        const sliced = blessingsData.blessings.slice(0, blessingLimitNum)
        if (!isOwner && invitationRes.data?.features?.blessing_public === false) {
          blessingsData = {
            ...blessingsData,
            blessings: [],
            _totalBlessings: total,
            _truncated: false
          }
        } else if (!isOwner && sliced.length > 0) {
          blessingsData = {
            ...blessingsData,
            blessings: sliced.map(b => { const { openid, ...safe } = b; return safe }),
            _totalBlessings: total,
            _truncated: sliced.length < total
          }
        } else {
          blessingsData = {
            ...blessingsData,
            blessings: sliced,
            _totalBlessings: total,
            _truncated: sliced.length < total
          }
        }
      }
    } catch (err) {
      console.warn('blessings 查询失败:', err.message)
    }

    return {
      success: true,
      isOwner,
      data: {
        wedding: weddingData,
        invitation: invitationRes.data,
        album: albumRes.data,
        venues: venuesRes.data,
        timeline: timelineRes.data,
        guests: guestsData,
        blessings: blessingsData,
        stats: statsRes.data,
        isOwner
      }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

function normalizeListDocument(doc, key) {
  if (!doc) return null
  const value = doc[key]
  if (Array.isArray(value)) return doc
  if (value && Array.isArray(value[key])) {
    return { ...doc, [key]: value[key] }
  }
  return { ...doc, [key]: [] }
}
