const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { weddingId, blessing } = event
  const { OPENID } = cloud.getWXContext()

  if (!weddingId || !blessing) {
    return { success: false, message: '参数不完整' }
  }

  try {
    const newBlessing = {
      id: Date.now().toString(),
      ...blessing,
      openid: OPENID,
      is_pinned: false,
      created_at: Date.now()
    }

    await db.collection('blessings').doc(weddingId).update({
      data: {
        blessings: _.push(newBlessing),
        updated_at: Date.now()
      }
    })

    return { success: true, blessingId: newBlessing.id }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}
