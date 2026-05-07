const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId, collection, data } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId || !collection || !data) {
    return { success: false, message: '参数不完整' }
  }

  const validCollections = ['weddings', 'invitations', 'albums', 'venues', 'timelines', 'guests', 'blessings']
  if (!validCollections.includes(collection)) {
    return { success: false, message: '无效的集合名称' }
  }

  try {
    // 验证所有权（ weddings 集合）
    if (collection === 'weddings') {
      const ownerRes = await db.collection('weddings').doc(weddingId).get()
      if (ownerRes.data.owner_openid !== OPENID) {
        return { success: false, message: '无权限修改' }
      }
    } else {
      // 非 weddings 集合也校验主人身份
      const ownerRes = await db.collection('weddings').doc(weddingId).get().catch(() => null)
      if (!ownerRes || ownerRes.data.owner_openid !== OPENID) {
        return { success: false, message: '无权限修改' }
      }
    }

    const protectedFields = ['_id', 'owner_openid', 'created_at']
    const cleanData = { ...data }
    for (const field of protectedFields) {
      delete cleanData[field]
    }

    await db.collection(collection).doc(weddingId).update({
      data: {
        ...cleanData,
        updated_at: Date.now()
      }
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
