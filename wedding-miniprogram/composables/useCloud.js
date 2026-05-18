import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { CLOUD_ENV } from '@/config/cloud.js'

// 初始化云开发
function initCloud() {
  const options = CLOUD_ENV ? { env: CLOUD_ENV, traceUser: true } : { traceUser: true }

  if (typeof uni !== 'undefined' && uni.cloud?.init) {
    uni.cloud.init(options)
  } else if (typeof wx !== 'undefined' && wx.cloud?.init) {
    wx.cloud.init(options)
  }
}

function getCloudApi() {
  if (typeof uni !== 'undefined' && uni.cloud?.callFunction) return uni.cloud
  if (typeof wx !== 'undefined' && wx.cloud?.callFunction) return wx.cloud
  return null
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

    const cloudApi = getCloudApi()
    if (!cloudApi) {
      finish(reject, new Error('云开发环境未初始化，请检查 appid 和云开发配置'))
      return
    }

    cloudApi.callFunction({
      name,
      data,
      success: (res) => {
        console.log(`[cloud] ${name} success:`, res)
        if (res.result?.success === false) {
          finish(reject, new Error(res.result.message || `${name} 调用失败`))
          return
        }
        finish(resolve, res.result)
      },
      fail: (err) => {
        console.error(`[cloud] ${name} fail:`, err)
        const message = err?.message || err?.errMsg || `${name} 调用失败`
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
  return callFunction('updateWedding', { weddingId, collection, data: cleanData })
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

// 生成小程序码海报
async function generatePoster(page, scene, width = 430) {
  return callFunction('generatePoster', { page, scene, width }, { timeoutMs: 15000 })
}

// 获取婚礼当天天气
async function getWeather(weddingId) {
  return callFunction('getWeather', { weddingId }, { timeoutMs: 7000 })
}

// 上传文件到云存储
async function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    const cloudApi = (typeof uni !== 'undefined' && uni.cloud?.uploadFile)
      ? uni.cloud
      : (typeof wx !== 'undefined' && wx.cloud?.uploadFile ? wx.cloud : null)

    if (!cloudApi) {
      reject(new Error('云存储能力不可用，请在微信小程序环境中打开'))
      return
    }

    const extMatch = String(filePath || '').match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    const ext = (extMatch?.[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    cloudApi.uploadFile({
      cloudPath: cloudPath || `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`,
      filePath,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
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
  submitRSVP,
  submitBlessing,
  pinBlessing,
  recordView,
  recordShare,
  getStats,
  getRSVPStats,
  checkOwnership,
  generatePoster,
  getWeather,
  uploadFile,
  uploadBase64
}
