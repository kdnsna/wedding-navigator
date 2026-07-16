import { resolveImagePath } from '@/utils/imagePaths.js'
import { getThemeTokens } from '@/utils/legacy-theme-map.js'
import { getVisualPreset } from '@/utils/visual-presets.js'

export const DEFAULT_SHARE_IMAGE = '/static/visuals/default-cover.png'

const resolvedImageCache = new Map()
export const SHARE_CARD_WIDTH = 500
export const SHARE_CARD_HEIGHT = 400

export function getShareImageSource(store) {
  const configured = String(store?.wedding?.share_config?.cover_image || '').trim()
  if (configured) return configured

  const photos = store?.album?.photos || []
  const cover = photos.find(photo => photo?.type === 'cover' && photo?.url)
  return cover?.url || photos.find(photo => photo?.url)?.url || DEFAULT_SHARE_IMAGE
}

export async function prepareShareImage(store) {
  const source = getShareImageSource(store)
  if (!source || source === DEFAULT_SHARE_IMAGE || source.startsWith('/static/')) {
    return source || DEFAULT_SHARE_IMAGE
  }

  if (!resolvedImageCache.has(source)) {
    const pending = resolveImagePath(source, 'share-card')
      .then(path => path || DEFAULT_SHARE_IMAGE)
      .catch(() => DEFAULT_SHARE_IMAGE)
    resolvedImageCache.set(source, pending)
  }

  return resolvedImageCache.get(source)
}

function imageInfo(src) {
  return new Promise((resolve) => {
    uni.getImageInfo({ src, success: resolve, fail: () => resolve(null) })
  })
}

function drawCoverImage(ctx, path, info, x, y, width, height) {
  if (!path || !info?.width || !info?.height) return false
  const sourceRatio = info.width / info.height
  const targetRatio = width / height
  let sx = 0
  let sy = 0
  let sw = info.width
  let sh = info.height
  if (sourceRatio > targetRatio) {
    sw = info.height * targetRatio
    sx = (info.width - sw) / 2
  } else {
    sh = info.width / targetRatio
    sy = (info.height - sh) / 2
  }
  ctx.drawImage(path, sx, sy, sw, sh, x, y, width, height)
  return true
}

function fittedName(ctx, text, x, y, maxWidth, align = 'left', color = '#2A231D') {
  const value = String(text || '').trim()
  let fontSize = 32
  while (fontSize > 20 && value.length * fontSize > maxWidth * 1.7) fontSize -= 2
  ctx.setFillStyle(color)
  ctx.setFontSize(fontSize)
  ctx.setTextAlign(align)
  ctx.fillText(value, x, y, maxWidth)
}

export async function generateWeddingShareCard({ instance, store }) {
  const source = getShareImageSource(store)
  const path = await resolveImagePath(source, 'share-card-canvas').catch(() => '')
  const info = path ? await imageInfo(path) : null
  const visual = getVisualPreset(
    store?.invitation?.visual_preset,
    store?.invitation?.scenario_preset || store?.invitation?.template
  )
  const theme = getThemeTokens(store?.invitation?.theme || 'wine')
  const ctx = uni.createCanvasContext('shareCardCanvas', instance)
  const W = SHARE_CARD_WIDTH
  const H = SHARE_CARD_HEIGHT
  const groom = store?.invitation?.couple?.groom?.name || ''
  const bride = store?.invitation?.couple?.bride?.name || ''
  const date = String(store?.weddingDate || '').replace(/-/g, '.')
  const paper = '#F7F2E9'
  const ink = '#2A231D'
  const muted = '#74695E'

  ctx.setFillStyle(paper)
  ctx.fillRect(0, 0, W, H)

  const splitLayout = ['heritage', 'garden', 'editorial'].includes(visual.posterLayout)
  if (splitLayout && path && info) {
    const photoWidth = visual.posterLayout === 'editorial' ? 300 : 286
    const inset = visual.posterLayout === 'garden' ? 16 : 0
    ctx.setFillStyle('#FFFDF8')
    ctx.fillRect(inset, inset, photoWidth - inset * 2, H - inset * 2)
    drawCoverImage(ctx, path, info, inset + (visual.posterLayout === 'garden' ? 10 : 0), inset + (visual.posterLayout === 'garden' ? 10 : 0), photoWidth - inset * 2 - (visual.posterLayout === 'garden' ? 20 : 0), H - inset * 2 - (visual.posterLayout === 'garden' ? 20 : 0))
    ctx.setFillStyle(theme.accent)
    ctx.fillRect(photoWidth, 0, 3, H)
    ctx.setFillStyle('#B08D57')
    ctx.setFontSize(11)
    ctx.setTextAlign('left')
    ctx.fillText(visual.kicker, photoWidth + 28, 74)
    fittedName(ctx, groom, photoWidth + 28, 140, W - photoWidth - 48, 'left', ink)
    ctx.setFillStyle('#B08D57')
    ctx.setFontSize(24)
    ctx.fillText('&', photoWidth + 28, 181)
    fittedName(ctx, bride, photoWidth + 28, 226, W - photoWidth - 48, 'left', ink)
    ctx.setFillStyle(muted)
    ctx.setFontSize(13)
    ctx.fillText(date, photoWidth + 28, 284)
    ctx.setFillStyle(theme.accent)
    ctx.beginPath()
    ctx.arc(W - 42, H - 42, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.setFillStyle('#FFFDF8')
    ctx.setTextAlign('center')
    ctx.setFontSize(15)
    ctx.fillText('囍', W - 42, H - 36)
  } else {
    const hasPhoto = drawCoverImage(ctx, path, info, 0, 0, W, H)
    if (hasPhoto) {
      const overlay = ctx.createLinearGradient(0, 110, 0, H)
      overlay.addColorStop(0, 'rgba(20,18,16,0.02)')
      overlay.addColorStop(1, visual.posterLayout === 'night' ? 'rgba(15,18,22,0.88)' : 'rgba(20,18,16,0.72)')
      ctx.setFillStyle(overlay)
      ctx.fillRect(0, 0, W, H)
    }
    ctx.setFillStyle('#D8BE8B')
    ctx.setFontSize(12)
    ctx.setTextAlign('left')
    ctx.fillText(visual.kicker, 34, 246)
    fittedName(ctx, groom, 34, 300, 190, 'left', '#FFFDF8')
    ctx.setFillStyle('#D8BE8B')
    ctx.setFontSize(24)
    ctx.fillText('&', 226, 300)
    fittedName(ctx, bride, 260, 300, 206, 'left', '#FFFDF8')
    ctx.setFillStyle('#FFFDF8')
    ctx.setFontSize(13)
    ctx.fillText(date, 34, 350)
  }

  await new Promise(resolve => ctx.draw(false, () => setTimeout(resolve, 120)))
  const result = await new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId: 'shareCardCanvas',
      width: W,
      height: H,
      destWidth: W * 2,
      destHeight: H * 2,
      fileType: 'jpg',
      quality: 0.9,
      success: resolve,
      fail: reject
    }, instance)
  })
  return result.tempFilePath || DEFAULT_SHARE_IMAGE
}
