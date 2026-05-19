const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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
    if (e.errCode !== -501005) {
      console.warn(`[ensureCollection] ${collectionName}:`, e.message)
    }
  }
}

function sanitizeText(value, maxLength = 40) {
  return String(value || '').trim().slice(0, maxLength)
}

function sanitizeProfile(profile = {}) {
  return {
    nickname: sanitizeText(profile.nickname, 40),
    phone: sanitizeText(profile.phone, 20).replace(/[^\d+\-\s]/g, ''),
    role: sanitizeText(profile.role || '主人', 20)
  }
}

function toWorkspace(wedding = {}) {
  const basic = wedding.basic_info || {}
  const share = wedding.share_config || {}
  return {
    weddingId: wedding._id || wedding.wedding_id || '',
    title: share.title || '甜囍手册',
    date: basic.date || '',
    time: basic.time || '',
    status: wedding.status || 'draft',
    template: wedding.commercial?.template_id || wedding.workspace?.template_id || '',
    plan: wedding.commercial?.plan || wedding.workspace?.plan || 'free',
    updated_at: wedding.updated_at || wedding.created_at || 0
  }
}

exports.main = async (event = {}) => {
  const { OPENID, UNIONID, APPID } = cloud.getWXContext()

  if (!OPENID) {
    return { success: false, message: '无法获取微信身份，请在微信小程序环境中打开' }
  }

  try {
    await ensureCollection('owners')
    await ensureCollection('weddings')

    const now = Date.now()
    const ownerRef = db.collection('owners').doc(OPENID)
    const existingRes = await ownerRef.get().catch(() => ({ data: null }))
    const existing = existingRes.data || {}
    const incomingProfile = sanitizeProfile(event.profile || {})
    const hasIncomingProfile = Boolean(
      incomingProfile.nickname || incomingProfile.phone || incomingProfile.role !== '主人'
    )
    const profile = hasIncomingProfile
      ? { ...(existing.profile || {}), ...incomingProfile }
      : { nickname: '', phone: '', role: '主人', ...(existing.profile || {}) }
    const plan = existing.plan || 'free'
    const entitlements = {
      ...DEFAULT_ENTITLEMENTS,
      ...(existing.entitlements || {})
    }

    const ownerData = {
      openid: OPENID,
      unionid: UNIONID || existing.unionid || '',
      appid: APPID || existing.appid || '',
      profile,
      plan,
      entitlements,
      updated_at: now
    }

    if (existingRes.data) {
      await ownerRef.update({ data: ownerData })
    } else {
      await ownerRef.set({
        data: {
          ...ownerData,
          created_at: now
        }
      })
    }

    const weddingRes = await db.collection('weddings')
      .where({ owner_openid: OPENID })
      .orderBy('updated_at', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ data: [] }))

    return {
      success: true,
      openid: OPENID,
      unionid: ownerData.unionid,
      appid: ownerData.appid,
      profile,
      plan,
      entitlements,
      workspaces: (weddingRes.data || []).map(toWorkspace)
    }
  } catch (err) {
    console.error('syncOwnerProfile failed:', err)
    return { success: false, message: err.message || '同步主人账号失败' }
  }
}
