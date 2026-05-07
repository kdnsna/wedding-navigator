const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = (err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}

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

    let guestDoc = null
    try {
      guestDoc = await db.collection('guests').doc(weddingId).get()
    } catch (err) {
      if (isDocNotExistError(err)) {
        newGuest.created_at = now
        await db.collection('guests').add({
          data: { _id: weddingId, guests: [newGuest], created_at: now, updated_at: now }
        })
        return { success: true }
      }
      throw err
    }

    const guests = guestDoc.data.guests || []
    const idx = guests.findIndex(g => g.phone === rsvpData.phone)

    if (idx >= 0) {
      newGuest.id = guests[idx].id
      guests[idx] = newGuest
      await db.collection('guests').doc(weddingId).update({
        data: { guests, updated_at: now }
      })
    } else {
      newGuest.created_at = now
      await db.collection('guests').doc(weddingId).update({
        data: { guests: _.push(newGuest), updated_at: now }
      })
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message || '提交失败' }
  }
}
