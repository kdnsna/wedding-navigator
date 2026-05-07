const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { weddingId } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, isOwner: false, message: '缺少婚礼ID' }
  }

  try {
    const res = await db.collection('weddings').doc(weddingId).get()
    const isOwner = res.data?.owner_openid === OPENID
    return { success: true, isOwner }
  } catch (err) {
    return { success: false, isOwner: false, message: '婚礼不存在' }
  }
}
