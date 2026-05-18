const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const OWNER_DOC_COLLECTIONS = ['invitations', 'albums', 'venues', 'timelines', 'guests', 'blessings', 'share_stats']
const QUERY_COLLECTIONS = ['viewers']
const CONFIRM_TEXT = 'DELETE'

exports.main = async (event, context) => {
  const { weddingId, confirmText } = event || {}
  const { OPENID } = cloud.getWXContext()

  if (!weddingId) {
    return { success: false, message: '缺少婚礼ID' }
  }
  if (confirmText !== CONFIRM_TEXT) {
    return { success: false, message: '请确认删除操作' }
  }

  try {
    const weddingRes = await db.collection('weddings').doc(weddingId).get()
    if (!weddingRes.data || weddingRes.data.owner_openid !== OPENID) {
      return { success: false, message: '无权限删除' }
    }

    const fileIds = await collectAlbumFileIds(weddingId)
    await deleteStorageFiles(fileIds)

    const detail = {}
    for (const collection of OWNER_DOC_COLLECTIONS) {
      detail[collection] = await removeDocument(collection, weddingId)
    }
    for (const collection of QUERY_COLLECTIONS) {
      detail[collection] = await removeByWeddingId(collection, weddingId)
    }
    detail.weddings = await removeDocument('weddings', weddingId)

    return { success: true, deleted: detail }
  } catch (err) {
    console.error('[deleteWedding] failed:', err)
    return { success: false, message: err.message || '删除失败' }
  }
}

async function collectAlbumFileIds(weddingId) {
  try {
    const res = await db.collection('albums').doc(weddingId).get()
    const photos = Array.isArray(res.data?.photos) ? res.data.photos : []
    return photos
      .map(photo => photo.fileID || photo.fileId || photo.url)
      .filter(fileId => typeof fileId === 'string' && fileId.startsWith('cloud://'))
  } catch (err) {
    if (!isNotFoundError(err)) console.warn('[deleteWedding] collect album files:', err)
    return []
  }
}

async function deleteStorageFiles(fileIds) {
  const uniqueFileIds = [...new Set(fileIds)]
  for (let i = 0; i < uniqueFileIds.length; i += 50) {
    const fileList = uniqueFileIds.slice(i, i + 50)
    try {
      await cloud.deleteFile({ fileList })
    } catch (err) {
      console.warn('[deleteWedding] delete storage files:', err)
    }
  }
}

async function removeDocument(collection, docId) {
  try {
    await db.collection(collection).doc(docId).remove()
    return 1
  } catch (err) {
    if (isNotFoundError(err)) return 0
    console.warn(`[deleteWedding] remove ${collection}/${docId}:`, err)
    return 0
  }
}

async function removeByWeddingId(collection, weddingId) {
  let count = 0
  while (true) {
    let res
    try {
      res = await db.collection(collection).where({ wedding_id: weddingId }).limit(100).get()
    } catch (err) {
      if (isNotFoundError(err)) return count
      console.warn(`[deleteWedding] query ${collection}:`, err)
      return count
    }
    const docs = res.data || []
    if (!docs.length) return count
    await Promise.all(docs.map(doc => removeDocument(collection, doc._id)))
    count += docs.length
    if (docs.length < 100) return count
  }
}

function isNotFoundError(err) {
  if (!err) return false
  if (err.errCode === -1 || err.errCode === -502005 || err.errCode === 'DATABASE_COLLECTION_NOT_EXIST') return true
  const msg = String(err.errMsg || err.message || '').toLowerCase()
  return msg.includes('not exist') || msg.includes('does not exist') || msg.includes('not found')
}
