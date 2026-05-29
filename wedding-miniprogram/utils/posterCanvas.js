import { resolveImagePath } from '@/utils/imagePaths.js'
import { getTemplateHeroImage, getTemplatePosterTheme } from '@/utils/templates.js'

// 画布尺寸：设计稿 750x1334，页面上按 375x667 逻辑像素渲染。
export const POSTER_CANVAS_WIDTH = 375
export const POSTER_CANVAS_HEIGHT = 667
export const POSTER_CANVAS_DPR = 2

export const POSTER_CANVAS_STYLE = {
  width: `${POSTER_CANVAS_WIDTH}px`,
  height: `${POSTER_CANVAS_HEIGHT}px`
}

function getCanvasNode(instance) {
  const queryWithContext = (context) => new Promise((resolve) => {
    const query = uni.createSelectorQuery()
    const scopedQuery = context && typeof query.in === 'function' ? query.in(context) : query
    scopedQuery
      .select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => resolve(res?.[0]?.node || null))
  })

  return queryWithContext(instance).then((node) => node || queryWithContext())
}

function loadCanvasNodeImage(canvas, source) {
  if (!canvas || !source) return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = source
  })
}

function setNodeFont(ctx, size, weight = '400') {
  ctx.font = `${weight} ${size}px sans-serif`
}

function drawCanvasNodeToTempFile(canvas) {
  return new Promise((resolve, reject) => {
    const width = POSTER_CANVAS_WIDTH * POSTER_CANVAS_DPR
    const height = POSTER_CANVAS_HEIGHT * POSTER_CANVAS_DPR
    wx.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width,
      height,
      destWidth: width,
      destHeight: height,
      fileType: 'png',
      quality: 1,
      success: (res) => {
        if (res.tempFilePath) resolve(res.tempFilePath)
        else reject(new Error('empty poster tempFilePath'))
      },
      fail: (err) => reject(new Error(err?.errMsg || err?.message || 'poster canvas export failed'))
    })
  })
}

function formatDateCN(dateStr) {
  if (!dateStr) return '待定'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getWeekDay(dateStr) {
  if (!dateStr) return ''
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[new Date(dateStr).getDay()]
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function drawWeddingPoster({ instance, store, qrCodePath = '' }) {
  const ctx = uni.createCanvasContext('posterCanvas', instance)
  ctx.scale(POSTER_CANVAS_DPR, POSTER_CANVAS_DPR)

  const W = POSTER_CANVAS_WIDTH
  const H = POSTER_CANVAS_HEIGHT
  const theme = getTemplatePosterTheme(store.invitation?.template)
  const shareConfig = store.wedding?.share_config || {}
  const posterVariant = shareConfig.poster_variant || 'classic'

  const bgPath = await resolveImagePath(
    shareConfig.poster_image || store.album?.photos?.[0]?.url || getTemplateHeroImage(store.invitation?.template),
    'poster_bg'
  )

  if (bgPath) {
    ctx.drawImage(bgPath, 0, 0, W, H)
    ctx.setFillStyle(theme.photoOverlay)
    ctx.fillRect(0, 0, W, H)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, W, H)
    gradient.addColorStop(0, theme.background[0])
    gradient.addColorStop(0.5, theme.background[1])
    gradient.addColorStop(1, theme.background[2])
    ctx.setFillStyle(gradient)
    ctx.fillRect(0, 0, W, H)
  }

  ctx.setStrokeStyle(theme.line)
  ctx.setLineWidth(0.5)
  ctx.beginPath()
  ctx.moveTo(40, 72)
  ctx.lineTo(W - 40, 72)
  ctx.stroke()

  ctx.setFillStyle(theme.muted)
  ctx.setFontSize(9)
  ctx.setTextAlign('center')
  const posterTitle = posterVariant === 'route' ? 'WEDDING GUIDE' : posterVariant === 'cover' ? 'SAVE THE DATE' : 'WEDDING INVITATION'
  ctx.fillText(posterTitle, W / 2, 52)

  const groom = store.invitation?.couple?.groom?.name || '新郎'
  const bride = store.invitation?.couple?.bride?.name || '新娘'

  ctx.setFontSize(28)
  ctx.setTextAlign('right')
  ctx.setFillStyle(theme.text)
  ctx.fillText(groom, W / 2 - 16, 168)

  ctx.setFontSize(16)
  ctx.setTextAlign('center')
  ctx.setFillStyle(theme.accent)
  ctx.fillText('&', W / 2, 162)

  ctx.setFontSize(28)
  ctx.setTextAlign('left')
  ctx.setFillStyle(theme.text)
  ctx.fillText(bride, W / 2 + 16, 168)

  ctx.setFontSize(11)
  ctx.setTextAlign('center')
  ctx.setFillStyle(theme.muted)
  ctx.fillText('Together with their families', W / 2, 200)

  ctx.setStrokeStyle(theme.accent)
  ctx.setLineWidth(0.6)
  ctx.beginPath()
  ctx.moveTo(W / 2 - 50, 232)
  ctx.lineTo(W / 2 + 50, 232)
  ctx.stroke()
  ctx.setFillStyle(theme.accent)
  ctx.beginPath()
  ctx.arc(W / 2, 232, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.setFillStyle(theme.text)
  ctx.setFontSize(15)
  ctx.setTextAlign('center')
  ctx.fillText(formatDateCN(store.weddingDate), W / 2, 268)

  const weekDay = getWeekDay(store.weddingDate)
  if (weekDay) {
    ctx.setFillStyle(theme.faint)
    ctx.setFontSize(10)
    ctx.fillText(weekDay, W / 2, 288)
  }

  const time = store.weddingTime || '12:00'
  ctx.setFillStyle(theme.muted)
  ctx.setFontSize(12)
  ctx.fillText(time, W / 2, 310)

  ctx.setStrokeStyle(theme.line)
  ctx.setLineWidth(0.5)
  ctx.beginPath()
  ctx.moveTo(60, 348)
  ctx.lineTo(W - 60, 348)
  ctx.stroke()

  const venueName = store.venueName || ''
  const venueAddress = store.invitation?.wedding?.venue_address || ''

  ctx.setFillStyle(theme.text)
  ctx.setFontSize(13)
  ctx.setTextAlign('center')
  ctx.fillText(venueName, W / 2, 380)

  if (venueAddress) {
    ctx.setFillStyle(theme.muted)
    ctx.setFontSize(9)
    ctx.fillText(venueAddress, W / 2, 400)
  }

  if (posterVariant === 'route') {
    ctx.setFillStyle(theme.accent)
    ctx.setFontSize(10)
    ctx.fillText('路线、时间、回执都在甜囍手册中', W / 2, 424)
  }

  const qrPath = await resolveImagePath(qrCodePath, 'poster_qr')
  if (qrPath) {
    const qrSize = 60
    const qrX = (W - qrSize) / 2
    const qrY = H - qrSize - 50

    ctx.setFillStyle('rgba(255,255,255,0.92)')
    roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 6)
    ctx.fill()

    ctx.setFillStyle('#FFFFFF')
    roundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4)
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 2)
    ctx.clip()
    ctx.drawImage(qrPath, qrX, qrY, qrSize, qrSize)
    ctx.restore()

    ctx.setFillStyle(theme.qrText)
    ctx.setFontSize(8)
    ctx.setTextAlign('center')
    ctx.fillText('长按识别小程序码', W / 2, qrY + qrSize + 22)
  }

  ctx.setFillStyle(theme.faint)
  ctx.setFontSize(7)
  ctx.setTextAlign('center')
  ctx.fillText('-- 甜囍手册 --', W / 2, H - 16)

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      setTimeout(resolve, 200)
    }
    const fallbackTimer = setTimeout(finish, 900)
    ctx.draw(false, () => {
      clearTimeout(fallbackTimer)
      finish()
    })
  })
}

export async function renderWeddingPosterTempFile({ instance, store, qrCodePath = '' }) {
  const canvas = await getCanvasNode(instance)
  if (!canvas) throw new Error('poster canvas node is missing')

  const outputWidth = POSTER_CANVAS_WIDTH * POSTER_CANVAS_DPR
  const outputHeight = POSTER_CANVAS_HEIGHT * POSTER_CANVAS_DPR
  canvas.width = outputWidth
  canvas.height = outputHeight

  const ctx = canvas.getContext('2d')
  ctx.setTransform(POSTER_CANVAS_DPR, 0, 0, POSTER_CANVAS_DPR, 0, 0)
  ctx.clearRect(0, 0, POSTER_CANVAS_WIDTH, POSTER_CANVAS_HEIGHT)

  const W = POSTER_CANVAS_WIDTH
  const H = POSTER_CANVAS_HEIGHT
  const theme = getTemplatePosterTheme(store.invitation?.template)
  const shareConfig = store.wedding?.share_config || {}
  const posterVariant = shareConfig.poster_variant || 'classic'

  const bgPath = await resolveImagePath(
    shareConfig.poster_image || store.album?.photos?.[0]?.url || getTemplateHeroImage(store.invitation?.template),
    'poster_bg'
  )
  const bgImage = await loadCanvasNodeImage(canvas, bgPath)

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, W, H)
    ctx.fillStyle = theme.photoOverlay
    ctx.fillRect(0, 0, W, H)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, W, H)
    gradient.addColorStop(0, theme.background[0])
    gradient.addColorStop(0.5, theme.background[1])
    gradient.addColorStop(1, theme.background[2])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, W, H)
  }

  ctx.strokeStyle = theme.line
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(40, 72)
  ctx.lineTo(W - 40, 72)
  ctx.stroke()

  ctx.fillStyle = theme.muted
  setNodeFont(ctx, 9)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const posterTitle = posterVariant === 'route' ? 'WEDDING GUIDE' : posterVariant === 'cover' ? 'SAVE THE DATE' : 'WEDDING INVITATION'
  ctx.fillText(posterTitle, W / 2, 52)

  const groom = store.invitation?.couple?.groom?.name || '新郎'
  const bride = store.invitation?.couple?.bride?.name || '新娘'

  setNodeFont(ctx, 28, '600')
  ctx.textAlign = 'right'
  ctx.fillStyle = theme.text
  ctx.fillText(groom, W / 2 - 16, 168)

  setNodeFont(ctx, 16, '400')
  ctx.textAlign = 'center'
  ctx.fillStyle = theme.accent
  ctx.fillText('&', W / 2, 162)

  setNodeFont(ctx, 28, '600')
  ctx.textAlign = 'left'
  ctx.fillStyle = theme.text
  ctx.fillText(bride, W / 2 + 16, 168)

  setNodeFont(ctx, 11)
  ctx.textAlign = 'center'
  ctx.fillStyle = theme.muted
  ctx.fillText('Together with their families', W / 2, 200)

  ctx.strokeStyle = theme.accent
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(W / 2 - 50, 232)
  ctx.lineTo(W / 2 + 50, 232)
  ctx.stroke()
  ctx.fillStyle = theme.accent
  ctx.beginPath()
  ctx.arc(W / 2, 232, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = theme.text
  setNodeFont(ctx, 15, '500')
  ctx.textAlign = 'center'
  ctx.fillText(formatDateCN(store.weddingDate), W / 2, 268)

  const weekDay = getWeekDay(store.weddingDate)
  if (weekDay) {
    ctx.fillStyle = theme.faint
    setNodeFont(ctx, 10)
    ctx.fillText(weekDay, W / 2, 288)
  }

  const time = store.weddingTime || '12:00'
  ctx.fillStyle = theme.muted
  setNodeFont(ctx, 12)
  ctx.fillText(time, W / 2, 310)

  ctx.strokeStyle = theme.line
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(60, 348)
  ctx.lineTo(W - 60, 348)
  ctx.stroke()

  const venueName = store.venueName || ''
  const venueAddress = store.invitation?.wedding?.venue_address || ''

  ctx.fillStyle = theme.text
  setNodeFont(ctx, 13, '500')
  ctx.textAlign = 'center'
  ctx.fillText(venueName, W / 2, 380)

  if (venueAddress) {
    ctx.fillStyle = theme.muted
    setNodeFont(ctx, 9)
    ctx.fillText(venueAddress, W / 2, 400)
  }

  if (posterVariant === 'route') {
    ctx.fillStyle = theme.accent
    setNodeFont(ctx, 10)
    ctx.fillText('路线、时间、回执都在甜囍手册中', W / 2, 424)
  }

  const qrPath = await resolveImagePath(qrCodePath, 'poster_qr')
  const qrImage = await loadCanvasNodeImage(canvas, qrPath)
  if (qrImage) {
    const qrSize = 60
    const qrX = (W - qrSize) / 2
    const qrY = H - qrSize - 50

    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 6)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4)
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 2)
    ctx.clip()
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
    ctx.restore()

    ctx.fillStyle = theme.qrText
    setNodeFont(ctx, 8)
    ctx.textAlign = 'center'
    ctx.fillText('长按识别小程序码', W / 2, qrY + qrSize + 22)
  }

  ctx.fillStyle = theme.faint
  setNodeFont(ctx, 7)
  ctx.textAlign = 'center'
  ctx.fillText('-- 甜囍手册 --', W / 2, H - 16)

  return drawCanvasNodeToTempFile(canvas)
}
