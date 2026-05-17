const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, type = 'view' } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }

  try {
    await ensureStatsDocument(weddingId)

    const updateData = { updated_at: Date.now() }

    if (type === 'view') {
      updateData.views = _.inc(1)
    } else if (type === 'share') {
      updateData.shares = _.inc(1)
    }

    // 更新统计
    await db.collection('share_stats').doc(weddingId).update({
      data: updateData
    })

    // 记录独立访客（使用 openid 去重）
    if (OPENID) {
      const viewerRes = await db.collection('viewers').where({
        wedding_id: weddingId,
        openid: OPENID
      }).get()

      if (viewerRes.data.length === 0) {
        await db.collection('viewers').add({
          data: {
            wedding_id: weddingId,
            openid: OPENID,
            created_at: Date.now()
          }
        })

        await db.collection('share_stats').doc(weddingId).update({
          data: { unique_viewers: _.inc(1), updated_at: Date.now() }
        })
      }
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

async function ensureStatsDocument(weddingId) {
  try {
    await db.collection('share_stats').doc(weddingId).get()
  } catch (err) {
    await db.collection('share_stats').doc(weddingId).set({
      data: {
        views: 0,
        shares: 0,
        unique_viewers: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      }
    })
  }
}
