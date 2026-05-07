/**
 * 工具函数库
 */

/**
 * 生成唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

/**
 * 生成短ID（6位）
 */
export function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 格式化日期
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 获取星期几
 */
export function getWeekDay(dateStr) {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const date = new Date(dateStr)
  return days[date.getDay()]
}

/**
 * 格式化倒计时
 */
export function formatCountdown(days, hours, minutes, seconds) {
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0')
  }
}

/**
 * 防抖
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流
 */
export function throttle(fn, interval = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(this, args)
    }
  }
}

/**
 * 格式化手机号（隐藏中间4位）
 */
export function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 计算图片压缩尺寸
 */
export function calcCompressSize(width, height, maxWidth = 1920) {
  if (width <= maxWidth) return { width, height }
  const ratio = maxWidth / width
  return {
    width: Math.round(maxWidth),
    height: Math.round(height * ratio)
  }
}

/**
 * 图片压缩（使用canvas）
 */
export function compressImage(src, quality = 0.8, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (info) => {
        const { width, height } = calcCompressSize(info.width, info.height, maxWidth)
        const ctx = uni.createCanvasContext('compressCanvas')
        ctx.drawImage(src, 0, 0, width, height)
        ctx.draw(false, () => {
          uni.canvasToTempFilePath({
            canvasId: 'compressCanvas',
            width,
            height,
            destWidth: width,
            destHeight: height,
            fileType: 'jpg',
            quality,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          })
        })
      },
      fail: reject
    })
  })
}

/**
 * 分享到微信
 */
export function shareToWechat(title, path, imageUrl) {
  return {
    title: title || '诚邀您参加我们的婚礼',
    path: path || '/pages/index/index',
    imageUrl: imageUrl || ''
  }
}

/**
 * 显示成功提示
 */
export function showSuccess(message) {
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 */
export function showError(message) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 3000
  })
}

/**
 * 显示加载中
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({ title, mask: true })
}

/**
 * 隐藏加载中
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 确认对话框
 */
export function showConfirm(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm)
    })
  })
}

export function formatRelativeTime(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
