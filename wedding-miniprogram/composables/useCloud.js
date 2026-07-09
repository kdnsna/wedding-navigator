import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { CLOUD_ENV } from '@/config/cloud.js'

let cloudInitialized = false

// 初始化云开发
function initCloud() {
  const options = CLOUD_ENV ? { env: CLOUD_ENV, traceUser: true } : { traceUser: true }
  const targets = []
  const wxCloud = typeof wx !== 'undefined' ? wx.cloud : null
  const uniCloud = typeof uni !== 'undefined' ? uni.cloud : null

  if (wxCloud?.init) {
    targets.push({ name: 'wx.cloud', api: wxCloud })
  }
  if (uniCloud?.init && uniCloud !== wxCloud) {
    targets.push({ name: 'uni.cloud', api: uniCloud })
  }

  if (!targets.length) return false

  for (const target of targets) {
    try {
      target.api.init(options)
      cloudInitialized = true
    } catch (err) {
      const message = err?.errMsg || err?.message || ''
      if (!message.includes('already') && !message.includes('重复')) {
        console.warn(`[cloud] ${target.name} init failed:`, err)
      }
    }
  }

  return cloudInitialized
}

function ensureCloudInitialized() {
  if (!cloudInitialized) {
    initCloud()
  }
}

function getCloudApi(method = 'callFunction') {
  ensureCloudInitialized()
  if (typeof wx !== 'undefined' && wx.cloud?.[method]) return wx.cloud
  if (typeof uni !== 'undefined' && uni.cloud?.[method]) return uni.cloud
  return null
}

function normalizeCloudError(err, fallback = '云开发请求失败') {
  const raw = err?.errMsg || err?.message || String(err || '')
  if (raw.includes('未初始化') || raw.includes('not init') || raw.includes('init') || raw.includes('env')) {
    return '云开发环境未就绪，请重新进入小程序后再试'
  }
  if (raw.includes('permission') || raw.includes('denied') || raw.includes('auth')) {
    return '云存储权限不足，请确认当前微信号是婚礼主人'
  }
  if (raw.includes('timeout') || raw.includes('超时')) {
    return '云端响应超时，请检查网络后重试'
  }
  return raw || fallback
}

// 云函数调用封装
async function callFunction(name, data = {}, options = {}) {
  const { timeoutMs = 8000 } = options

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (handler, payload) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      handler(payload)
    }

    const timeoutId = setTimeout(() => {
      finish(reject, new Error(`${name} 请求超时`))
    }, timeoutMs)

    const cloudApi = getCloudApi('callFunction')
    if (!cloudApi) {
      finish(reject, new Error('云开发环境未初始化，请检查 appid 和云开发配置'))
      return
    }

    cloudApi.callFunction({
      name,
      data,
      success: (res) => {
        if (res.result?.success === false) {
          const error = new Error(res.result.message || `${name} 调用失败`)
          error.code = res.result.code || ''
          error.needConfig = Boolean(res.result.needConfig)
          error.result = res.result
          finish(reject, error)
          return
        }
        finish(resolve, res.result)
      },
      fail: (err) => {
        console.error(`[cloud] ${name} fail:`, err)
        const message = normalizeCloudError(err, `${name} 调用失败`)
        finish(reject, new Error(message.includes(name) ? message : `${name}: ${message}`))
      }
    })
  })
}

// 获取婚礼数据
async function fetchWedding(weddingId, forceRefresh = false) {
  const store = useWeddingStore()
  const userStore = useUserStore()
  if (!weddingId) {
    throw new Error('缺少婚礼ID')
  }
  if (!forceRefresh && store.isCacheValidFor(weddingId)) {
    return { data: true, fromCache: true }
  }
  try {
    const res = await callFunction('getWedding', { weddingId }, { timeoutMs: 10000 })
    if (res?.data) {
      store.setWeddingData(res.data, weddingId)
      if (res.isOwner || res.data.isOwner || res.data.is_owner) {
        userStore.verifyOwner(true)
      }
    }
    return res
  } catch (err) {
    console.error('fetchWedding error:', err)
    throw err
  }
}

// 创建婚礼
async function createWedding(data) {
  return callFunction('createWedding', data)
}

// 更新婚礼指定集合
async function updateWedding(weddingId, collection, data) {
  // 过滤云数据库系统字段，避免 update 报错
  const { _id, created_at, updated_at, owner_openid, ...cleanData } = data || {}
  return callFunction('updateWedding', { weddingId, collection, data: cleanData }, { timeoutMs: 12000 })
}

// 删除婚礼邀请及关联数据
async function deleteWedding(weddingId, confirmText = 'DELETE') {
  return callFunction('deleteWedding', { weddingId, confirmText }, { timeoutMs: 15000 })
}

// 提交 RSVP
async function submitRSVP(weddingId, data) {
  return callFunction('submitRSVP', { weddingId, rsvpData: data }, { timeoutMs: 10000 })
}

// 提交祝福
async function submitBlessing(weddingId, data) {
  return callFunction('submitBlessing', { weddingId, blessing: data }, { timeoutMs: 10000 })
}

// 置顶祝福
async function pinBlessing(weddingId, blessingId, isPinned) {
  return callFunction('pinBlessing', { weddingId, blessingId, isPinned })
}

// 记录浏览
async function recordView(weddingId, openid) {
  return callFunction('recordView', { weddingId, openid, type: 'view' }, { timeoutMs: 4000 })
}

// 记录分享
async function recordShare(weddingId) {
  if (!weddingId) return null
  return callFunction('recordView', { weddingId, type: 'share' }, { timeoutMs: 4000 })
}

// 获取统计数据
async function getStats(weddingId) {
  return callFunction('getStats', { weddingId }, { timeoutMs: 10000 })
}

// 获取 RSVP 统计
async function getRSVPStats(weddingId) {
  return callFunction('getRSVPStats', { weddingId }, { timeoutMs: 10000 })
}

// 验证当前用户是否为婚礼主人
async function checkOwnership(weddingId) {
  return callFunction('checkOwnership', { weddingId }, { timeoutMs: 5000 })
}

// 同步主人账号、权益和婚礼工作区
async function syncOwnerProfile(profile = {}) {
  return callFunction('syncOwnerProfile', { profile }, { timeoutMs: 10000 })
}

// 生成小程序码海报
async function generatePoster(page, scene, width = 430) {
  return callFunction('generatePoster', { page, scene, width }, { timeoutMs: 15000 })
}

// 获取婚礼当天天气
async function getWeather(weddingId) {
  return callFunction('getWeather', { weddingId }, { timeoutMs: 12000 })
}

// 根据场地名称/地址匹配地图坐标
async function geocodeVenue(data) {
  return callFunction('geocodeVenue', data, { timeoutMs: 12000 })
}

// AI 主人发布助手：只返回候选内容，不直接写入数据库
async function generateAiSuggestions(task, payload = {}) {
  const userStore = useUserStore()
  if (!userStore.weddingId) {
    throw new Error('请先创建婚礼后再使用 AI 发布助手')
  }
  return callFunction('aiPublishAssistant', {
    weddingId: userStore.weddingId,
    task,
    tone: payload.tone || 'luxury_refined',
    context: payload.context || {}
  }, { timeoutMs: 125000 })
}

// 上传文件到云存储
async function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    const cloudApi = getCloudApi('uploadFile')

    if (!cloudApi) {
      reject(new Error('云存储能力不可用，请在微信小程序环境中打开'))
      return
    }
    if (!filePath) {
      reject(new Error('缺少本地文件路径'))
      return
    }

    const extMatch = String(filePath || '').match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    const ext = (extMatch?.[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    cloudApi.uploadFile({
      cloudPath: cloudPath || `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      filePath,
      success: (res) => resolve(res),
      fail: (err) => reject(new Error(normalizeCloudError(err, '云存储上传失败')))
    })
  })
}

// 删除云存储文件。用于相册保存失败或删除照片后的清理；清理失败不阻断主流程。
async function deleteFiles(fileList = []) {
  const files = fileList.filter(Boolean)
  if (!files.length) return { fileList: [] }

  return new Promise((resolve) => {
    const cloudApi = getCloudApi('deleteFile')

    if (!cloudApi) {
      resolve({ fileList: files, skipped: true })
      return
    }

    cloudApi.deleteFile({
      fileList: files,
      success: (res) => resolve(res),
      fail: (err) => {
        console.warn('[cloud] deleteFile failed:', err)
        resolve({ fileList: files, failed: true, err })
      }
    })
  })
}

// 上传 base64 图片到云存储
async function uploadBase64(base64Data, cloudPath) {
  // 将 base64 转为临时文件路径
  const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.png`
  const fs = wx.getFileSystemManager()
  fs.writeFileSync(filePath, base64Data, 'base64')
  return uploadFile(filePath, cloudPath)
}

export {
  initCloud,
  callFunction,
  fetchWedding,
  createWedding,
  updateWedding,
  deleteWedding,
  submitRSVP,
  submitBlessing,
  pinBlessing,
  recordView,
  recordShare,
  getStats,
  getRSVPStats,
  checkOwnership,
  syncOwnerProfile,
  generatePoster,
  getWeather,
  geocodeVenue,
  generateAiSuggestions,
  uploadFile,
  deleteFiles,
  uploadBase64
}
