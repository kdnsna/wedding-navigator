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
    // 权限校验：仅主人可查看统计
    const wedding = await db.collection('weddings').doc(weddingId).get().catch(() => ({ data: null }))
    if (!wedding.data || wedding.data.owner_openid !== OPENID) {
      return { success: false, message: '无权查看' }
    }

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
          attending: guests.filter(g => getGuestStatus(g) === 'attending').length,
          uncertain: guests.filter(g => getGuestStatus(g) === 'uncertain').length,
          declined: guests.filter(g => getGuestStatus(g) === 'declined').length,
          pending: guests.filter(g => getGuestStatus(g) === 'pending').length,
          attending_people: guests
            .filter(g => getGuestStatus(g) === 'attending')
            .reduce((sum, g) => sum + getGuestCount(g), 0)
        },
        blessings: blessings.length
      }
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

function getGuestStatus(guest) {
  return guest.rsvp_status || guest.status || 'pending'
}

function getGuestCount(guest) {
  return Number(guest.attending_count ?? guest.guestCount ?? guest.guest_count ?? 1)
}
