const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingData } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingData) {
    return { success: false, message: '缺少婚礼数据' }
  }

  try {
    const weddingId = await generateUniqueId()
    const now = Date.now()

    // 创建婚礼主文档
    await db.collection('weddings').add({
      data: {
        _id: weddingId,
        ...weddingData.wedding,
        owner_openid: OPENID,
        created_at: now,
        updated_at: now
      }
    })

    // 并行创建关联集合
    await Promise.all([
      db.collection('invitations').add({
        data: { _id: weddingId, ...weddingData.invitation, created_at: now, updated_at: now }
      }),
      db.collection('albums').add({
        data: { _id: weddingId, photos: [], created_at: now, updated_at: now }
      }),
      db.collection('venues').add({
        data: { _id: weddingId, venues: [], created_at: now, updated_at: now }
      }),
      db.collection('timelines').add({
        data: { _id: weddingId, events: [], created_at: now, updated_at: now }
      }),
      db.collection('guests').add({
        data: { _id: weddingId, guests: [], created_at: now, updated_at: now }
      }),
      db.collection('blessings').add({
        data: { _id: weddingId, blessings: [], created_at: now, updated_at: now }
      }),
      db.collection('share_stats').add({
        data: { _id: weddingId, views: 0, shares: 0, unique_viewers: 0, created_at: now, updated_at: now }
      })
    ])

    return { success: true, weddingId }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

async function generateUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}
