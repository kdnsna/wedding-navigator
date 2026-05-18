const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    // 并行查询所有关联数据
    const [
      weddingRes,
      invitationRes,
      albumRes,
      venuesRes,
      timelineRes,
      guestsRes,
      blessingsRes,
      statsRes
    ] = await Promise.all([
      db.collection('weddings').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('invitations').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('albums').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('venues').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('timelines').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('guests').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('blessings').doc(weddingId).get().catch(() => ({ data: null })),
      db.collection('share_stats').doc(weddingId).get().catch(() => ({ data: null }))
    ])

    if (!weddingRes.data) {
      return { success: false, message: '婚礼不存在' }
    }

    // 判断是否为婚礼主人
    const isOwner = weddingRes.data.owner_openid === OPENID

    let weddingData = weddingRes.data
    if (!isOwner) {
      const { owner_openid, ...safeWedding } = weddingData
      weddingData = safeWedding
    }

    let guestsData = normalizeListDocument(guestsRes.data, 'guests')
    const blessingsData = normalizeListDocument(blessingsRes.data, 'blessings')
    if (!isOwner && guestsData && guestsData.guests) {
      guestsData = {
        ...guestsData,
        guests: guestsData.guests.map(g => {
          const { phone, dietary, ...safeGuest } = g
          return safeGuest
        })
      }
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
