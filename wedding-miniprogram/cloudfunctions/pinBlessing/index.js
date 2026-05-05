const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId, blessingId, isPinned } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId || !blessingId) {
    return { success: false, message: '参数不完整' }
  }

  try {
    // 校验主人权限
    const ownerRes = await db.collection('weddings').doc(weddingId).get()
    if (ownerRes.data.owner_openid !== OPENID) {
      return { success: false, message: '无权限操作' }
    }

    const res = await db.collection('blessings').doc(weddingId).get()
    const blessings = res.data.blessings || []

    const idx = blessings.findIndex(b => b.id === blessingId)
    if (idx < 0) {
      return { success: false, message: '祝福不存在' }
    }

    // 更新置顶状态
    blessings[idx].is_pinned = isPinned
    // 取消其他置顶
    if (isPinned) {
      blessings.forEach((b, i) => {
        if (i !== idx) b.is_pinned = false
      })
    }

    await db.collection('blessings').doc(weddingId).update({
      data: { blessings, updated_at: Date.now() }
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
