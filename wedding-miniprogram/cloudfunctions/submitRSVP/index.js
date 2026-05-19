const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = (err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}

exports.main = async (event, context) => {
  const { weddingId, rsvpData } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId || !rsvpData) {
    return { success: false, message: '参数不完整' }
  }

  try {
    const invitationRes = await db.collection('invitations').doc(weddingId).get().catch(() => ({ data: null }))
    const features = invitationRes.data?.features || {}
    if (features.show_rsvp === false) {
      return { success: false, message: '新人暂未开放在线回执' }
    }

    const normalized = normalizeRSVP(rsvpData, OPENID)
    if (features.rsvp_phone_required === true && normalized.rsvp_status !== 'declined' && !normalized.phone) {
      return { success: false, message: '请填写联系电话' }
    }

    if (normalized.message) {
      const secRes = await checkContentSafety(normalized.message)
      if (!secRes.safe) {
        return { success: false, message: secRes.message || '留言内容包含敏感信息，请修改后重试' }
      }
    }

    const now = Date.now()
    let guestDoc = null
    try {
      guestDoc = await db.collection('guests').doc(weddingId).get()
    } catch (err) {
      if (isDocNotExistError(err)) {
        const newGuest = {
          id: Date.now().toString(),
          ...normalized,
          created_at: now,
          updated_at: now
        }
        await db.collection('guests').add({
          data: { _id: weddingId, guests: [newGuest], created_at: now, updated_at: now }
        })
        return { success: true }
      }
      throw err
    }

    const guests = guestDoc.data.guests || []
    const idx = guests.findIndex(g => {
      if (normalized.phone && g.phone === normalized.phone) return true
      if (normalized.openid && g.openid === normalized.openid) return true
      return false
    })

    if (idx >= 0 && features.allow_rsvp_update === false) {
      return { success: false, message: '回执已提交，如需修改请联系新人' }
    }

    const newGuest = {
      id: idx >= 0 ? guests[idx].id : Date.now().toString(),
      ...normalized,
      updated_at: now
    }

    if (idx >= 0) {
      // 使用数组位置更新，避免全量覆盖导致的并发丢数据
      await db.collection('guests').doc(weddingId).update({
        data: {
          [`guests.${idx}`]: newGuest,
          updated_at: now
        }
      })
    } else {
      newGuest.created_at = now
      // _.push 是原子操作，无竞态
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
    relationship: String(data.relationship || '').trim(),
    arrival_time: String(data.arrival_time || '').trim(),
    transport_mode: String(data.transport_mode || '').trim(),
    companion_note: String(data.companion_note || data.companion_names || '').trim(),
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
    if (process.env.CONTENT_SAFETY_MODE === 'strict') {
      return { safe: false, message: '内容安全校验暂不可用，请稍后重试' }
    }
    return { safe: true, degraded: true, message: '内容安全校验暂不可用，已按降级策略提交' }
  }
}
