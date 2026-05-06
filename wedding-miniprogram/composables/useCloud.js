import { useWeddingStore } from '@/stores/wedding.js'
import { CLOUD_ENV } from '@/config/cloud.js'

/**
 * 初始化云开发
 */
export function initCloud() {
  if (CLOUD_ENV) {
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true
    })
  } else {
    wx.cloud.init({
      traceUser: true
    })
  }
}

/**
 * 调用云函数
 */
export function callCloudFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`云函数 ${name} 请求超时`))
    }, 8000)

    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        clearTimeout(timer)
        if (res.result && res.result.success === false) {
          reject(new Error(res.result.message || '调用失败'))
        } else {
          resolve(res.result)
        }
      },
      fail: (err) => {
        clearTimeout(timer)
        console.warn(`云函数 ${name} 调用失败:`, err)
        reject(err)
      }
    })
  })
}

/**
 * 获取婚礼完整数据
 */
export async function fetchWedding(weddingId) {
  const store = useWeddingStore()
  store.setLoading(true)
  try {
    const result = await callCloudFunction('getWedding', { weddingId })
    store.setWeddingData(result.data)
    return result.data
  } catch (err) {
    store.setError(err.message)
    throw err
  } finally {
    store.setLoading(false)
  }
}

/**
 * 提交RSVP
 */
export async function submitRSVP(weddingId, rsvpData) {
  return callCloudFunction('submitRSVP', { weddingId, rsvpData })
}

/**
 * 提交祝福
 */
export async function submitBlessing(weddingId, blessing) {
  return callCloudFunction('submitBlessing', { weddingId, blessing })
}

/**
 * 创建婚礼
 */
export async function createWedding(weddingData) {
  return callCloudFunction('createWedding', { weddingData })
}

/**
 * 更新婚礼数据
 */
export async function updateWedding(weddingId, collection, data) {
  return callCloudFunction('updateWedding', { weddingId, collection, data })
}

/**
 * 获取RSVP统计
 */
export async function getRSVPStats(weddingId) {
  return callCloudFunction('getRSVPStats', { weddingId })
}

/**
 * 置顶/取消置顶祝福
 */
export async function pinBlessing(weddingId, blessingId, isPinned) {
  return callCloudFunction('pinBlessing', { weddingId, blessingId, isPinned })
}

/**
 * 记录浏览/分享
 */
export async function recordView(weddingId, type = 'view') {
  return callCloudFunction('recordView', { weddingId, type })
}

/**
 * 获取统计数据
 */
export async function getStats(weddingId) {
  return callCloudFunction('getStats', { weddingId })
}

/**
 * 上传图片到云存储
 */
export function uploadImage(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => resolve(res.fileID),
      fail: reject
    })
  })
}

/**
 * 获取临时图片链接
 */
export function getTempImageURL(fileID) {
  return new Promise((resolve, reject) => {
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: (res) => resolve(res.fileList[0]?.tempFileURL || ''),
      fail: reject
    })
  })
}
