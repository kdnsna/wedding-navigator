const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId } = event

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    const [statsRes, guestsRes, blessingsRes] = await Promise.all([
      db.collection('share_stats').doc(weddingId).get().catch(() => ({ data: { views: 0, shares: 0, unique_viewers: 0 } })),
      db.collection('guests').doc(weddingId).get().catch(() => ({ data: { guests: [] } })),
      db.collection('blessings').doc(weddingId).get().catch(() => ({ data: { blessings: [] } }))
    ])

    const guests = guestsRes.data.guests || []
    const blessings = blessingsRes.data.blessings || []

    return {
      success: true,
      stats: {
        views: statsRes.data.views || 0,
        shares: statsRes.data.shares || 0,
        unique_viewers: statsRes.data.unique_viewers || 0,
        rsvp: {
          total: guests.length,
          attending: guests.filter(g => g.rsvp_status === 'attending').length,
          uncertain: guests.filter(g => g.rsvp_status === 'uncertain').length,
          declined: guests.filter(g => g.rsvp_status === 'declined').length,
          pending: guests.filter(g => g.rsvp_status === 'pending').length
        },
        blessings: blessings.length
      }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
