/**
 * getPhotos：按 weddingId 返回婚纱照的可访问临时链接
 * ---------------------------------------------------------------
 * 免费版云存储 ACL 固定为「仅创建者可读写」，宾客端无法直接读 fileID。
 * 云函数以管理员身份运行，可绕过存储 ACL 生成临时 https 链接（有效期 2 小时）。
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const weddingId = event && event.weddingId
  if (!weddingId) return { photos: [] }

  const db = cloud.database()
  const res = await db.collection('weddings').doc(weddingId).get().catch(() => null)
  const photos = (res && res.data && res.data.photos) || []
  if (!photos.length) return { photos: [] }

  const r = await cloud.getTempFileURL({ fileList: photos.map(p => p.fileID) })
  const urlMap = {}
  ;(r.fileList || []).forEach(f => { urlMap[f.fileID] = f.tempFileURL })

  return {
    photos: photos
      .map(p => ({ url: urlMap[p.fileID] || '', caption: p.caption || '' }))
      .filter(p => p.url)
  }
}
