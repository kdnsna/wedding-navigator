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
    const wedding = await db.collection('weddings').doc(weddingId).get()
    if (wedding.data.owner_openid !== OPENID) {
      return { success: false, message: '无权查看' }
    }

    const res = await db.collection('guests').doc(weddingId).get()
    const guests = res.data.guests || []

    const stats = {
      total: guests.length,
      attending: guests.filter(g => g.rsvp_status === 'attending').length,
      uncertain: guests.filter(g => g.rsvp_status === 'uncertain').length,
      declined: guests.filter(g => g.rsvp_status === 'declined').length,
      pending: guests.filter(g => g.rsvp_status === 'pending').length,
      attending_people: guests
        .filter(g => g.rsvp_status === 'attending')
        .reduce((sum, g) => sum + (g.attending_count || 1), 0)
    }

    return { success: true, stats }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
