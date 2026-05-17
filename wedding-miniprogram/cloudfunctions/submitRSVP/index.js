const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, rsvpData } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId || !rsvpData) {
    return { success: false, message: '参数不完整' }
  }

  try {
    const normalized = normalizeRSVP(rsvpData, OPENID)

    // 内容安全检测（留言内容）
    if (normalized.message) {
      const secRes = await checkContentSafety(normalized.message)
      if (!secRes.safe) {
        return { success: false, message: secRes.message || '留言内容包含敏感信息，请修改后重试' }
      }
    }

    // 检查是否已有该手机号的记录
    const guestRes = await db.collection('guests').doc(weddingId).get()
    const guests = guestRes.data.guests || []
    const idx = guests.findIndex(g => {
      if (normalized.phone && g.phone === normalized.phone) return true
      if (normalized.openid && g.openid === normalized.openid) return true
      return false
    })

    const now = Date.now()
    const newGuest = {
      id: idx >= 0 ? guests[idx].id : Date.now().toString(),
      ...normalized,
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

function normalizeRSVP(data, openid) {
  const status = data.rsvp_status || data.status || 'attending'
  const attendingCount = Number(data.attending_count ?? data.guestCount ?? data.guest_count ?? 1)
  return {
    name: String(data.name || '').trim(),
    phone: String(data.phone || '').trim(),
    openid: data.openid || openid || '',
    rsvp_status: status,
    attending_count: status === 'declined' ? 0 : Math.max(1, attendingCount || 1),
    diet_preference: data.diet_preference || normalizeDiet(data.dietary),
    dietary: data.dietary || '',
    message: String(data.message || '').trim(),
    source: data.source || 'guest'
  }
}

function normalizeDiet(dietary) {
  const text = String(dietary || '')
  if (text.includes('素食')) return 'vegetarian'
  if (text.includes('清真')) return 'halal'
  if (text && !text.includes('无特殊要求')) return 'other'
  return 'normal'
}

async function checkContentSafety(content) {
  try {
    const secRes = await cloud.openapi.security.msgSecCheck({ content })
    return {
      safe: secRes.errCode === 0,
      message: secRes.errCode === 0 ? '' : '留言内容包含敏感信息，请修改后重试'
    }
  } catch (err) {
    console.error('msgSecCheck failed:', err)
    return { safe: false, message: '内容安全校验暂不可用，请稍后重试' }
  }
}
