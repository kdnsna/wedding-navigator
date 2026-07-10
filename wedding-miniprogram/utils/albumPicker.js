function pickerError(message = '') {
  const rawMessage = String(message || '')
  const error = new Error(formatAlbumPickerError(rawMessage))
  error.rawMessage = rawMessage
  return error
}

function buildPickerApis(count, sizeType) {
  const apis = []

  if (typeof wx !== 'undefined' && typeof wx.chooseImage === 'function') {
    apis.push({
      name: 'wx.chooseImage',
      choose: wx.chooseImage.bind(wx),
      options: { count, sizeType, sourceType: ['album'] }
    })
  }
  if (typeof uni !== 'undefined' && typeof uni.chooseImage === 'function') {
    apis.push({
      name: 'uni.chooseImage',
      choose: uni.chooseImage.bind(uni),
      options: { count, sizeType, sourceType: ['album'] }
    })
  }
  if (typeof wx !== 'undefined' && typeof wx.chooseMedia === 'function') {
    apis.push({
      name: 'wx.chooseMedia',
      choose: wx.chooseMedia.bind(wx),
      options: {
        count,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: sizeType.includes('compressed') ? ['compressed'] : sizeType
      }
    })
  }

  return apis
}

function authorizeAlbumPrivacy() {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || typeof wx.requirePrivacyAuthorize !== 'function') {
      resolve()
      return
    }

    wx.requirePrivacyAuthorize({
      success: resolve,
      fail: (err) => reject(pickerError(err?.errMsg || err?.message || ''))
    })
  })
}

function runPicker(api) {
  return new Promise((resolve, reject) => {
    api.choose({
      ...api.options,
      success: (res) => {
        const paths = extractAlbumImagePaths(res)
        if (!paths.length) {
          reject(new Error('未获取到照片路径，请重新选择'))
          return
        }
        resolve([...new Set(paths)].slice(0, api.options.count))
      },
      fail: (err) => {
        const message = err?.errMsg || err?.message || ''
        if (isAlbumPickerCancel(message)) {
          resolve([])
          return
        }
        const error = pickerError(message)
        error.apiName = api.name
        reject(error)
      }
    })
  })
}

function shouldStopFallback(error) {
  const message = error?.rawMessage || error?.message || ''
  return /privacy|隐私|permission|denied|auth|authorize|scope|cancel/i.test(message)
}

export async function chooseAlbumImages(count = 1, options = {}) {
  const maxCount = Math.max(1, Number(options.maxCount) || 9)
  const chooseCount = Math.max(1, Math.min(maxCount, Number(count) || 1))
  const sizeType = Array.isArray(options.sizeType) && options.sizeType.length
    ? options.sizeType
    : ['compressed']
  const apis = buildPickerApis(chooseCount, sizeType)

  if (!apis.length) {
    throw new Error('当前环境不支持选择照片，请在微信小程序中重试')
  }

  await authorizeAlbumPrivacy()

  let lastError = null
  for (const api of apis) {
    try {
      return await runPicker(api)
    } catch (err) {
      lastError = err
      if (shouldStopFallback(err)) throw err
      console.warn(`[album-picker] ${api.name} failed, trying next picker:`, err?.rawMessage || err?.message || '')
    }
  }

  throw lastError || new Error('选择照片失败，请重试')
}

export function extractAlbumImagePaths(res = {}) {
  const fromPaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : []
  const fromFiles = Array.isArray(res.tempFiles)
    ? res.tempFiles.map(item => {
      if (typeof item === 'string') return item
      return item?.tempFilePath || item?.path || item?.thumbTempFilePath || ''
    })
    : []

  return [...fromPaths, ...fromFiles]
    .map(item => String(item || '').trim())
    .filter(Boolean)
}

export function isAlbumPickerCancel(error) {
  const message = error?.rawMessage || error?.errMsg || error?.message || String(error || '')
  return /cancel|取消/i.test(message)
}

export function formatAlbumPickerError(message = '') {
  const raw = String(message || '')
  const normalized = raw.toLowerCase()
  if (normalized.includes('api scope is not declared') || normalized.includes('privacy agreement')) {
    return '请在微信公众平台声明“收集你选中的照片或视频信息”，约 5 分钟后再上传'
  }
  if (/privacy|隐私/i.test(raw)) {
    return '请先同意小程序隐私保护指引后再上传照片'
  }
  if (/auth|permission|denied|authorize|scope/i.test(raw)) {
    return '选择照片失败，请在微信设置中允许访问相册'
  }
  if (normalized.includes('chooseimage:fail') || normalized.includes('choosemedia:fail')) {
    return '选择照片失败，请稍后重试；也可以尝试重新进入小程序后上传'
  }
  return raw || '选择照片失败，请重试'
}
