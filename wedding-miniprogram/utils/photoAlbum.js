import { POSTER_CANVAS_DPR, POSTER_CANVAS_HEIGHT, POSTER_CANVAS_WIDTH } from '@/utils/posterCanvas.js'

const PHOTO_SCOPE = 'scope.writePhotosAlbum'

function toMessage(err) {
  return String(err?.errMsg || err?.message || err || '')
}

function makeSaveError(message, rawMessage = '') {
  const err = new Error(message)
  err.rawMessage = rawMessage || message
  return err
}

function ensurePrivacyAuthorized() {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || typeof wx.requirePrivacyAuthorize !== 'function') {
      resolve()
      return
    }

    wx.requirePrivacyAuthorize({
      success: resolve,
      fail: (err) => reject(makeSaveError(normalizeSaveImageError(err), toMessage(err)))
    })
  })
}

function ensureWritePhotosAlbumAuthorized() {
  return new Promise((resolve, reject) => {
    if (typeof uni.getSetting !== 'function') {
      resolve()
      return
    }

    uni.getSetting({
      success: (res) => {
        const setting = res.authSetting?.[PHOTO_SCOPE]
        if (setting === true) {
          resolve()
          return
        }
        if (setting === false) {
          reject(makeSaveError('请在微信设置中允许保存图片到相册', `${PHOTO_SCOPE}: denied`))
          return
        }
        if (typeof uni.authorize !== 'function') {
          resolve()
          return
        }
        uni.authorize({
          scope: PHOTO_SCOPE,
          success: resolve,
          fail: (err) => reject(makeSaveError(normalizeSaveImageError(err), toMessage(err)))
        })
      },
      fail: resolve
    })
  })
}

function canvasToPosterFile({ canvasId, instance }) {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId,
      x: 0,
      y: 0,
      width: POSTER_CANVAS_WIDTH,
      height: POSTER_CANVAS_HEIGHT,
      destWidth: POSTER_CANVAS_WIDTH * POSTER_CANVAS_DPR,
      destHeight: POSTER_CANVAS_HEIGHT * POSTER_CANVAS_DPR,
      fileType: 'png',
      quality: 1,
      success: (res) => {
        if (!res.tempFilePath) {
          reject(makeSaveError('海报图片生成失败，请重新进入页面后再试', 'empty tempFilePath'))
          return
        }
        resolve(res.tempFilePath)
      },
      fail: (err) => reject(makeSaveError(normalizeSaveImageError(err), toMessage(err)))
    }, instance)
  })
}

function saveImageFile(filePath) {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: (err) => reject(makeSaveError(normalizeSaveImageError(err), toMessage(err)))
    })
  })
}

export async function savePosterCanvasToAlbum({ canvasId = 'posterCanvas', instance } = {}) {
  await ensurePrivacyAuthorized()
  await ensureWritePhotosAlbumAuthorized()
  const filePath = await canvasToPosterFile({ canvasId, instance })
  await saveImageFile(filePath)
  return filePath
}

export function normalizeSaveImageError(err) {
  const raw = toMessage(err)
  if (raw.includes('api scope is not declared') || raw.includes('privacy agreement')) {
    return '保存海报前，请先在微信公众平台隐私保护指引中声明“保存图片或视频到相册”用途'
  }
  if (/privacy|隐私/i.test(raw)) {
    return '请先同意小程序隐私保护指引后再保存海报'
  }
  if (/auth|authorize|permission|denied|deny|scope\.writePhotosAlbum/i.test(raw)) {
    return '请在微信设置中允许保存图片到相册'
  }
  if (/cancel/i.test(raw)) {
    return '已取消保存'
  }
  if (/canvas|tempFilePath|filePath/i.test(raw)) {
    return '海报图片生成失败，请重新生成后再保存'
  }
  return raw || '保存失败，请稍后重试'
}

export function showSaveImageError(err) {
  const message = err?.message || normalizeSaveImageError(err)
  if (message.includes('微信设置')) {
    uni.showModal({
      title: '无法保存海报',
      content: message,
      confirmText: '去设置',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm && typeof uni.openSetting === 'function') {
          uni.openSetting({})
        }
      }
    })
    return
  }
  if (message.includes('微信公众平台') || message.includes('隐私保护指引')) {
    uni.showModal({
      title: '无法保存海报',
      content: message,
      showCancel: false
    })
    return
  }
  uni.showToast({ title: message, icon: 'none' })
}
