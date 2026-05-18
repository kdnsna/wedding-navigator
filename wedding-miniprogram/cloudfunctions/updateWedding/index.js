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
      let ownerRes
      try {
        ownerRes = await db.collection('weddings').doc(weddingId).get()
      } catch (err) {
        return { success: false, message: '查询婚礼失败，请稍后重试' }
      }
      if (!ownerRes.data || ownerRes.data.owner_openid !== OPENID) {
        return { success: false, message: '无权限修改' }
      }
    }

    const protectedFields = ['_id', 'owner_openid', 'created_at']
    const cleanData = { ...data }
    for (const field of protectedFields) {
      delete cleanData[field]
    }

    // 所有白名单集合的文档本身就是业务对象。
    // 直接写对象，避免把 invitations 写成 { invitations: {...} } 或把 guests 写成 { guests: { guests: [...] } }。
    const updateData = { ...cleanData, updated_at: Date.now() }

    try {
      await db.collection(collection).doc(weddingId).update({
        data: updateData
      })
    } catch (err) {
      if (!isDocNotExistError(err) || collection === 'weddings') {
        throw err
      }
      await db.collection(collection).doc(weddingId).set({
        data: { ...updateData, created_at: Date.now() }
      })
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = (err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}
