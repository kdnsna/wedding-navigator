const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId } = event

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

    return {
      success: true,
      data: {
        wedding: weddingRes.data,
        invitation: invitationRes.data,
        album: albumRes.data,
        venues: venuesRes.data,
        timeline: timelineRes.data,
        guests: guestsRes.data,
        blessings: blessingsRes.data,
        stats: statsRes.data
      }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
