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
    const ownerRes = await db.collection('weddings').doc(weddingId).get().catch(() => ({ data: null }))
    if (!ownerRes.data || ownerRes.data.owner_openid !== OPENID) {
      return { success: false, message: '无权限操作' }
    }

    const res = await db.collection('blessings').doc(weddingId).get().catch(() => ({ data: null }))
    if (!res.data) {
      return { success: false, message: '祝福不存在' }
    }
    const blessings = res.data.blessings || []

    const idx = blessings.findIndex(b => b.id === blessingId)
    if (idx < 0) {
      return { success: false, message: '祝福不存在' }
    }

    // 原子更新：只动一个数组元素
    const updateFields = {
      [`blessings.${idx}.is_pinned`]: isPinned,
      updated_at: Date.now()
    }
    // 如果是置顶，需要取消其他置顶
    if (isPinned) {
      // 用 .set 操作符批量取消其他置顶
      for (let i = 0; i < blessings.length; i++) {
        if (i !== idx && blessings[i].is_pinned) {
          updateFields[`blessings.${i}.is_pinned`] = false
        }
      }
    }

    await db.collection('blessings').doc(weddingId).update({
      data: updateFields
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
