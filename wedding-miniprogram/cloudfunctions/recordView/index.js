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
    const updateData = { updated_at: Date.now() }

    if (type === 'view') {
      updateData.views = _.inc(1)
    } else if (type === 'share') {
      updateData.shares = _.inc(1)
    }

    await db.collection('share_stats').doc(weddingId).update({
      data: updateData
    }).catch(async (err) => {
      // 文档不存在则创建
      if (err.errCode === -502005) {
        await db.collection('share_stats').add({
          data: { _id: weddingId, views: type === 'view' ? 1 : 0, shares: type === 'share' ? 1 : 0, unique_viewers: 0, updated_at: Date.now() }
        })
      } else {
        throw err
      }
    })

    if (OPENID) {
      try {
        const viewerId = `${weddingId}_${OPENID}`
        await db.collection('viewers').doc(viewerId).get()
      } catch (e) {
        if (e.errCode === -1 || e.message?.includes('not exist')) {
          await db.collection('viewers').add({
            data: {
              _id: `${weddingId}_${OPENID}`,
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
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
