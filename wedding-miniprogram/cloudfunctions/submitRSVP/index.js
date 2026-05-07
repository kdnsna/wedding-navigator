const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, rsvpData } = event

  if (!weddingId || !rsvpData) {
    return { success: false, message: '参数不完整' }
  }

  try {
    if (rsvpData.message) {
      const secRes = await cloud.openapi.security.msgSecCheck({
        content: rsvpData.message
      })
      if (secRes.errCode !== 0) {
        return { success: false, message: '留言内容包含敏感信息，请修改后重试' }
      }
    }

    const now = Date.now()
    const newGuest = {
      id: Date.now().toString(),
      ...rsvpData,
      updated_at: now
    }

    try {
      const guestRes = await db.collection('guests').doc(weddingId).get()
      const guests = guestRes.data.guests || []
      const idx = guests.findIndex(g => g.phone === rsvpData.phone)

      if (idx >= 0) {
        newGuest.id = guests[idx].id
        if (idx >= 0) guests[idx] = newGuest
        await db.collection('guests').doc(weddingId).update({
          data: { guests, updated_at: now }
        })
      } else {
        newGuest.created_at = now
        await db.collection('guests').doc(weddingId).update({
          data: { guests: _.push(newGuest), updated_at: now }
        })
      }
    } catch (err) {
      if (err.errCode === -1 || err.message?.includes('not exist')) {
        newGuest.created_at = now
        await db.collection('guests').add({
          data: { _id: weddingId, guests: [newGuest], created_at: now, updated_at: now }
        })
      } else {
        throw err
      }
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
