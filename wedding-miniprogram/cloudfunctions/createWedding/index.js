const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const RELATED_COLLECTIONS = ['owners', 'invitations', 'albums', 'venues', 'timelines', 'guests', 'blessings', 'share_stats', 'viewers']
const DEFAULT_ENTITLEMENTS = {
  premium_templates: false,
  poster_pack: false,
  remove_branding: false,
  workspace_multi: false
}

async function ensureCollection(collectionName) {
  try {
    await db.createCollection(collectionName)
  } catch (e) {
    // 集合已存在时也会报错，忽略
    if (e.errCode !== -501005) {
      console.warn(`[ensureCollection] ${collectionName}:`, e.message)
    }
  }
}

exports.main = async (event, context) => {
  const { weddingData, wedding, invitation, venues, timeline } = event
  const { OPENID } = cloud.getWXContext()

  const weddingPayload = weddingData?.wedding || wedding
  const invitationPayload = weddingData?.invitation || invitation
  const venuesPayload = weddingData?.venues || venues || { venues: [] }
  const timelinePayload = weddingData?.timeline || timeline || { events: [] }

  if (!weddingPayload) {
    return { success: false, message: '缺少婚礼数据' }
  }

  let weddingId = null
  try {
    // 自动创建所有需要的集合（首次运行）
    await ensureCollection('weddings')
    const collectionFailures = []
    for (const col of RELATED_COLLECTIONS) {
      try { await ensureCollection(col) }
      catch (e) { collectionFailures.push(col) }
    }
    if (collectionFailures.length) {
      return { success: false, message: `无法创建集合: ${collectionFailures.join(',')}` }
    }

    const now = Date.now()
    await ensureOwnerProfile(OPENID, now)

    // DB 自动分配 _id，消除 check-then-act 竞态
    const weddingRes = await db.collection('weddings').add({
      data: {
        ...weddingPayload,
        owner_profile_id: OPENID,
        owner_openid: OPENID,
        created_at: now,
        updated_at: now
      }
    })
    weddingId = weddingRes._id

    await Promise.all([
      db.collection('invitations').add({
        data: { _id: weddingId, ...invitationPayload, created_at: now, updated_at: now }
      }),
      db.collection('albums').add({
        data: { _id: weddingId, photos: [], created_at: now, updated_at: now }
      }),
      db.collection('venues').add({
        data: { _id: weddingId, ...venuesPayload, created_at: now, updated_at: now }
      }),
      db.collection('timelines').add({
        data: { _id: weddingId, ...timelinePayload, created_at: now, updated_at: now }
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

async function ensureOwnerProfile(openid, now) {
  if (!openid) return
  const ref = db.collection('owners').doc(openid)
  const existing = await ref.get().catch(() => ({ data: null }))
  if (existing.data) {
    await ref.update({
      data: {
        updated_at: now
      }
    })
    return
  }

  await ref.set({
    data: {
      openid,
      unionid: '',
      appid: '',
      profile: {
        nickname: '',
        phone: '',
        role: '主人'
      },
      plan: 'free',
      entitlements: DEFAULT_ENTITLEMENTS,
      created_at: now,
      updated_at: now
    }
  })
}
