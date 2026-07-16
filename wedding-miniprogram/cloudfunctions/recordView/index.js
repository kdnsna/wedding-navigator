const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, type = 'view', visualPreset = '' } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    const normalizedVisualPreset = normalizeVisualPreset(visualPreset)
    const updateData = { updated_at: Date.now() }
    if (normalizedVisualPreset) updateData.last_visual_preset = normalizedVisualPreset

    if (type === 'view') {
      updateData.views = _.inc(1)
    } else if (type === 'share') {
      updateData.shares = _.inc(1)
    }

    await db.collection('share_stats').doc(weddingId).update({
      data: updateData
    }).catch(async (err) => {
      // 文档不存在则创建
      if (isDocNotExistError(err)) {
        await db.collection('share_stats').doc(weddingId).set({
          data: {
            views: type === 'view' ? 1 : 0,
            shares: type === 'share' ? 1 : 0,
            unique_viewers: 0,
            created_at: Date.now(),
            updated_at: Date.now()
          }
        })
      } else {
        throw err
      }
    })

    // 幂等去重：用固定 _id 的 add，重复键自动跳过 unique_viewers 计数
    if (OPENID) {
      const viewerId = `${weddingId}_${OPENID}`
      try {
        await db.collection('viewers').add({
          data: {
            _id: viewerId,
            wedding_id: weddingId,
            openid: OPENID,
            visual_preset: normalizedVisualPreset,
            created_at: Date.now()
          }
        })
        // add 成功 → 新访客，递增 unique_viewers
        await db.collection('share_stats').doc(weddingId).update({
          data: { unique_viewers: _.inc(1), updated_at: Date.now() }
        })
      } catch (e) {
        // 重复键 (errCode -502003) 表示访客已存在，正常跳过
        if (e.errCode !== -502003) {
          console.error('viewer insert error:', e)
        }
      }
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

function normalizeVisualPreset(value) {
  const valid = ['cinematic-documentary', 'new-chinese-ceremony', 'garden-film', 'editorial-couture', 'night-banquet']
  const normalized = String(value || '').trim()
  return valid.includes(normalized) ? normalized : ''
}

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = (err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}
