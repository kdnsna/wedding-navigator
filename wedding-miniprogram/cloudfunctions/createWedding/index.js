const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const RELATED_COLLECTIONS = ['invitations', 'albums', 'venues', 'timelines', 'guests', 'blessings', 'share_stats']

exports.main = async (event, context) => {
  const { weddingData } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingData) {
    return { success: false, message: '缺少婚礼数据' }
  }

  let weddingId = null
  try {
    weddingId = await generateUniqueId()
    const now = Date.now()

    await db.collection('weddings').add({
      data: {
        _id: weddingId,
        ...weddingData.wedding,
        owner_openid: OPENID,
        created_at: now,
        updated_at: now
      }
    })

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
    if (weddingId) {
      await cleanupPartialCreation(weddingId).catch(() => {})
    }
    return { success: false, message: err.message }
  }
}

async function cleanupPartialCreation(weddingId) {
  try { await db.collection('weddings').doc(weddingId).remove() } catch (e) {}
  for (const col of RELATED_COLLECTIONS) {
    try { await db.collection(col).doc(weddingId).remove() } catch (e) {}
  }
}

async function generateUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let attempt = 0; attempt < 5; attempt++) {
    let id = Date.now().toString(36).slice(-4)
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    try {
      const existing = await db.collection('weddings').doc(id).get()
      if (!existing.data) return id
    } catch (e) {
      return id
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
}
