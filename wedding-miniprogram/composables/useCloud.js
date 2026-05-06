import { useWeddingStore } from '@/stores/wedding.js'
import { CLOUD_ENV } from '@/config/cloud.js'

// 云函数基础配置
const BASE_URL = `cloud://${CLOUD_ENV}`

// 初始化云开发
function initCloud() {
  const options = CLOUD_ENV ? { env: CLOUD_ENV, traceUser: true } : { traceUser: true }

  if (uni.cloud?.init) {
    uni.cloud.init(options)
  } else if (typeof wx !== 'undefined' && wx.cloud?.init) {
    wx.cloud.init(options)
  }
}

// 云函数调用封装
async function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    uni.cloud.callFunction({
      name,
      data,
      success: (res) => {
        if (res.result?.success === false) {
          reject(new Error(res.result.message))
        } else {
          resolve(res.result)
        }
      },
      fail: (err) => reject(err)
    })
  })
}

// 获取婚礼数据
async function fetchWedding(weddingId) {
  const store = useWeddingStore()
  try {
    const res = await callFunction('getWedding', { weddingId })
    if (res?.data) {
      store.setWeddingData(res.data)
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

// 更新婚礼
async function updateWedding(weddingId, data) {
  return callFunction('updateWedding', { weddingId, ...data })
}

// 提交 RSVP
async function submitRSVP(weddingId, data) {
  return callFunction('submitRSVP', { weddingId, ...data })
}

// 提交祝福
async function submitBlessing(weddingId, data) {
  return callFunction('submitBlessing', { weddingId, ...data })
}

// 置顶祝福
async function pinBlessing(weddingId, blessingId, isPinned) {
  return callFunction('pinBlessing', { weddingId, blessingId, isPinned })
}

// 记录浏览
async function recordView(weddingId, openid) {
  return callFunction('recordView', { weddingId, openid })
}

// 获取统计数据
async function getStats(weddingId) {
  return callFunction('getStats', { weddingId })
}

// 获取 RSVP 统计
async function getRSVPStats(weddingId) {
  return callFunction('getRSVPStats', { weddingId })
}

// 生成小程序码海报
async function generatePoster(page, scene, width = 430) {
  return callFunction('generatePoster', { page, scene, width })
}

// 获取婚礼当天天气
async function getWeather(weddingId) {
  return callFunction('getWeather', { weddingId })
}

// 上传文件到云存储
async function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    uni.cloud.uploadFile({
      cloudPath: cloudPath || `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
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
  getStats,
  getRSVPStats,
  generatePoster,
  getWeather,
  uploadFile,
  uploadBase64
}
