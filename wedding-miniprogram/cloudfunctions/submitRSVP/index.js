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
    // 内容安全检测（留言内容）
    if (rsvpData.message) {
      const secRes = await cloud.openapi.security.msgSecCheck({
        content: rsvpData.message
      })
      if (secRes.errCode !== 0) {
        return { success: false, message: '留言内容包含敏感信息，请修改后重试' }
      }
    }

    // 检查是否已有该手机号的记录
    const guestRes = await db.collection('guests').doc(weddingId).get()
    const guests = guestRes.data.guests || []
    const idx = guests.findIndex(g => g.phone === rsvpData.phone)

    const now = Date.now()
    const newGuest = {
      id: idx >= 0 ? guests[idx].id : Date.now().toString(),
      ...rsvpData,
      updated_at: now
    }
    if (idx < 0) {
      newGuest.created_at = now
    }

    if (idx >= 0) {
      guests[idx] = newGuest
    } else {
      guests.push(newGuest)
    }

    await db.collection('guests').doc(weddingId).update({
      data: { guests, updated_at: now }
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
