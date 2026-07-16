const MIN_SHORT_EDGE = 1080
const MIN_PIXEL_COUNT = 1600 * 2000

function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({ src, success: resolve, fail: reject })
  })
}

function ratioLabel(width, height) {
  const ratio = width / height
  if (ratio < 0.86) return '竖幅'
  if (ratio > 1.16) return '横幅'
  return '方幅'
}

function coverFit(width, height) {
  const ratio = width / height
  if (ratio >= 0.68 && ratio <= 0.9) return 'hero'
  if (ratio > 1.16) return 'spread'
  return 'album'
}

export async function analyzeWeddingPhoto(src) {
  try {
    const info = await getImageInfo(src)
    const width = Number(info.width || 0)
    const height = Number(info.height || 0)
    const shortEdge = Math.min(width, height)
    const pixels = width * height
    const quality = shortEdge >= MIN_SHORT_EDGE && pixels >= MIN_PIXEL_COUNT ? 'good' : 'low'
    const fit = coverFit(width, height)
    return {
      width,
      height,
      orientation: ratioLabel(width, height),
      quality,
      fit,
      recommendation: fit === 'hero'
        ? '适合扉页'
        : fit === 'spread' ? '适合横幅章节' : '适合相册装裱'
    }
  } catch (err) {
    console.warn('读取照片信息失败:', err)
    return {
      width: 0,
      height: 0,
      orientation: '待识别',
      quality: 'unknown',
      fit: 'album',
      recommendation: '可在预览中检查裁切'
    }
  }
}

export function photoQualityLabel(photo) {
  if (photo?.quality === 'low') return '清晰度偏低'
  if (photo?.quality === 'good') return '清晰可用'
  return '待预览确认'
}

export function focusPositionValue(focus = 'center') {
  if (focus === 'top') return 'center 28%'
  if (focus === 'bottom') return 'center 72%'
  return 'center center'
}
