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
    const invitationRes = await db.collection('invitations').doc(weddingId).get().catch(() => ({ data: null }))
    const features = invitationRes.data?.features || {}
    if (features.show_blessing === false) {
      return { success: false, message: '新人暂未开放祝福墙' }
    }
    if (features.allow_anonymous_blessing === false && !String(blessing.sender?.name || '').trim()) {
      return { success: false, message: '请填写您的称呼' }
    }

    // 内容安全检测
    if (blessing.content) {
      const secRes = await checkContentSafety(blessing.content)
      if (!secRes.safe) {
        return { success: false, message: secRes.message || '祝福内容包含敏感信息，请修改后重试' }
      }
    }

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
    }).catch(async (err) => {
      // 文档不存在则创建
      if (isDocNotExistError(err)) {
        await db.collection('blessings').doc(weddingId).set({
          data: {
            blessings: [newBlessing],
            created_at: Date.now(),
            updated_at: Date.now()
          }
        })
      } else {
        throw err
      }
    })

    return { success: true, blessingId: newBlessing.id }
  } catch (err) {
    console.error(err)
    return { success: false, message: err.message }
  }
}

function isDocNotExistError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = String(err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}

async function checkContentSafety(content) {
  try {
    const secRes = await cloud.openapi.security.msgSecCheck({ content })
    return {
      safe: secRes.errCode === 0,
      message: secRes.errCode === 0 ? '' : '祝福内容包含敏感信息，请修改后重试'
    }
  } catch (err) {
    console.error('msgSecCheck failed:', err)
    if (process.env.CONTENT_SAFETY_MODE === 'strict') {
      return { safe: false, message: '内容安全校验暂不可用，请稍后重试' }
    }
    return { safe: true, degraded: true, message: '内容安全校验暂不可用，已按降级策略提交' }
  }
}
