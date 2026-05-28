const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, type = 'view', channel = '' } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    await Promise.all([
      ensureCollection('share_stats'),
      ensureCollection('viewers')
    ])
    await ensureStatsDocument(weddingId)

    const eventType = normalizeEventType(type)
    const shareChannel = normalizeShareChannel(channel)
    const updateData = { updated_at: Date.now() }

    if (eventType === 'view') {
      updateData.views = _.inc(1)
    } else if (eventType === 'share') {
      updateData.shares = _.inc(1)
      updateData[`share_channels.${shareChannel}`] = _.inc(1)
    } else if (eventType === 'poster_save') {
      updateData.poster_saves = _.inc(1)
      updateData['share_channels.poster'] = _.inc(1)
    }

    await db.collection('share_stats').doc(weddingId).update({
      data: updateData
    }).catch(async (err) => {
      // 文档不存在则创建
      if (isDocNotExistError(err)) {
        await db.collection('share_stats').doc(weddingId).set({
          data: {
            views: eventType === 'view' ? 1 : 0,
            shares: eventType === 'share' ? 1 : 0,
            poster_saves: eventType === 'poster_save' ? 1 : 0,
            share_channels: buildInitialShareChannels(eventType, shareChannel),
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
    if (eventType === 'view' && OPENID) {
      const viewerId = `${weddingId}_${OPENID}`
      try {
        await db.collection('viewers').add({
          data: {
            _id: viewerId,
            wedding_id: weddingId,
            openid: OPENID,
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

function normalizeEventType(type) {
  const allowed = ['view', 'share', 'poster_save']
  return allowed.includes(type) ? type : 'view'
}

function normalizeShareChannel(channel) {
  const allowed = ['friend', 'timeline', 'poster']
  return allowed.includes(channel) ? channel : 'friend'
}

function buildInitialShareChannels(type, channel) {
  const initial = { friend: 0, timeline: 0, poster: 0 }
  if (type === 'share') {
    initial[channel] = 1
  }
  if (type === 'poster_save') {
    initial.poster = 1
  }
  return initial
}

async function ensureCollection(collectionName) {
  try {
    await db.createCollection(collectionName)
  } catch (err) {
    if (err.errCode !== -501005) {
      console.warn(`[ensureCollection] ${collectionName}:`, err.message)
    }
  }
}

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = (err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}

async function ensureStatsDocument(weddingId) {
  try {
    await db.collection('share_stats').doc(weddingId).get()
  } catch (err) {
    if (!isDocNotExistError(err)) throw err
    await db.collection('share_stats').doc(weddingId).set({
      data: {
        views: 0,
        shares: 0,
        poster_saves: 0,
        share_channels: { friend: 0, timeline: 0, poster: 0 },
        unique_viewers: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      }
    })
  }
}
