/**
 * 数据层：多婚礼云存储（客户端直连，零云函数）
 * ---------------------------------------------------------------
 * weddings   所有用户可读，仅创建者可写 → _openid 即主人身份
 * blessings  所有用户可读，仅创建者可写
 * rsvps      所有用户可读，仅创建者可写
 * 照片       云存储，权限「所有用户可读」
 */

function useCloud() {
  return !!(wx.cloud && wx.cloud.database)
}

function db() {
  return wx.cloud.database()
}

/* ---------- 婚礼 ---------- */

/** 创建婚礼，返回新 weddingId */
function createWedding(data) {
  return db().collection('weddings').add({
    data: { ...data, createdAt: Date.now(), updatedAt: Date.now() }
  }).then(res => res._id)
}

/** 我的婚礼列表（依赖 _openid 占位符自动匹配当前用户） */
function listMyWeddings() {
  return db().collection('weddings')
    .where({ _openid: '{openid}' })
    .orderBy('updatedAt', 'desc')
    .limit(20)
    .get()
    .then(res => res.data)
}

/** 按 id 读取婚礼（宾客与主人都走这里） */
function getWedding(id) {
  return db().collection('weddings').doc(id).get()
    .then(res => res.data)
}

/** 更新婚礼（仅主人，数据库规则强制） */
function updateWedding(id, data) {
  return db().collection('weddings').doc(id).update({
    data: { ...data, updatedAt: Date.now() }
  })
}

/** 上传照片到云存储，返回 fileID */
function uploadPhoto(weddingId, filePath) {
  const ext = (filePath.match(/\.(\w+)$/) || ['', 'jpg'])[1]
  return wx.cloud.uploadFile({
    cloudPath: `weddings/${weddingId}/${Date.now()}-${Math.floor(Math.random() * 1e4)}.${ext}`,
    filePath
  }).then(res => res.fileID)
}

/* ---------- 祝福 ---------- */

function listBlessings(weddingId) {
  return db().collection('blessings')
    .where({ weddingId })
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get()
    .then(res => res.data)
}

function addBlessing(weddingId, item) {
  return db().collection('blessings').add({
    data: { ...item, weddingId, createdAt: Date.now() }
  })
}

/* ---------- 回执 ---------- */

function submitRSVP(weddingId, item) {
  return db().collection('rsvps').add({
    data: { ...item, weddingId, createdAt: Date.now() }
  })
}

function listRSVPs(weddingId) {
  return db().collection('rsvps')
    .where({ weddingId })
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()
    .then(res => res.data)
}

module.exports = {
  useCloud,
  createWedding,
  listMyWeddings,
  getWedding,
  updateWedding,
  uploadPhoto,
  listBlessings,
  addBlessing,
  submitRSVP,
  listRSVPs
}
