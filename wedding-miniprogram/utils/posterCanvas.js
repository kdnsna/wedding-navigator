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

function posterChars(text) {
  return Array.from(String(text || '').trim())
}

function estimateTextWidth(text, fontSize) {
  return posterChars(text).reduce((total, char) => {
    return total + (/[\u4e00-\u9fa5]/.test(char) ? fontSize : fontSize * 0.58)
  }, 0)
}

function measureTextWidth(ctx, text, fontSize) {
  try {
    const width = ctx.measureText?.(text)?.width
    return Number.isFinite(width) ? width : estimateTextWidth(text, fontSize)
  } catch (err) {
    return estimateTextWidth(text, fontSize)
  }
}

function trimToWidth(ctx, text, maxWidth, fontSize) {
  const chars = posterChars(text)
  if (measureTextWidth(ctx, chars.join(''), fontSize) <= maxWidth) return chars.join('')
  while (chars.length > 0 && measureTextWidth(ctx, `${chars.join('')}...`, fontSize) > maxWidth) {
    chars.pop()
  }
  return chars.length ? `${chars.join('')}...` : ''
}

function drawFittedText(ctx, text, x, y, maxWidth, options = {}) {
  const source = String(text || '').trim()
  if (!source) return
  const minFontSize = options.minFontSize || options.fontSize || 12
  let fontSize = options.fontSize || 12
  while (fontSize > minFontSize && measureTextWidth(ctx, source, fontSize) > maxWidth) {
    fontSize -= 1
  }
  ctx.setFontSize(fontSize)
  ctx.setTextAlign(options.align || 'center')
  ctx.fillText(trimToWidth(ctx, source, maxWidth, fontSize), x, y)
}

function makeWrappedLines(ctx, text, maxWidth, fontSize, maxLines) {
  const chars = posterChars(text)
  const lines = []
  let line = ''
  for (const char of chars) {
    const next = `${line}${char}`
    if (line && measureTextWidth(ctx, next, fontSize) > maxWidth) {
      lines.push(line)
      line = char
      if (lines.length === maxLines) break
    } else {
      line = next
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === maxLines) {
    const usedLength = lines.join('').length
    if (chars.length > usedLength) {
      lines[maxLines - 1] = trimToWidth(ctx, lines[maxLines - 1], maxWidth, fontSize)
    }
  }
  return lines
}

function drawWrappedText(ctx, text, x, y, maxWidth, options = {}) {
  const source = String(text || '').trim()
  if (!source) return
  const fontSize = options.fontSize || 12
  const lineHeight = options.lineHeight || fontSize * 1.35
  const maxLines = options.maxLines || 2
  ctx.setFontSize(fontSize)
  ctx.setTextAlign(options.align || 'center')
  makeWrappedLines(ctx, source, maxWidth, fontSize, maxLines).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
}

export async function drawWeddingPoster({ instance, store, qrCodePath = '' }) {
  const ctx = uni.createCanvasContext('posterCanvas', instance)
  ctx.scale(POSTER_CANVAS_DPR, POSTER_CANVAS_DPR)

  const W = POSTER_CANVAS_WIDTH
  const H = POSTER_CANVAS_HEIGHT
  const theme = getTemplatePosterTheme(store.invitation?.template)

  const bgPath = await resolveImagePath(
    store.album?.photos?.[0]?.url || getTemplateHeroImage(store.invitation?.template),
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
  ctx.fillText('WEDDING INVITATION', W / 2, 52)

  const groom = store.invitation?.couple?.groom?.name || '新郎'
  const bride = store.invitation?.couple?.bride?.name || '新娘'

  ctx.setFillStyle(theme.text)
  drawFittedText(ctx, groom, W / 2 - 16, 168, 132, {
    fontSize: 28,
    minFontSize: 18,
    align: 'right'
  })

  ctx.setFontSize(16)
  ctx.setTextAlign('center')
  ctx.setFillStyle(theme.accent)
  ctx.fillText('&', W / 2, 162)

  ctx.setFillStyle(theme.text)
  drawFittedText(ctx, bride, W / 2 + 16, 168, 132, {
    fontSize: 28,
    minFontSize: 18,
    align: 'left'
  })

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
  drawWrappedText(ctx, venueName, W / 2, 380, 270, {
    fontSize: 13,
    lineHeight: 17,
    maxLines: 2
  })

  if (venueAddress) {
    ctx.setFillStyle(theme.muted)
    drawWrappedText(ctx, venueAddress, W / 2, 414, 292, {
      fontSize: 9,
      lineHeight: 13,
      maxLines: 2
    })
  }

  const posterLine = store.wedding?.share_config?.poster_line || ''
  if (posterLine) {
    ctx.setFillStyle(theme.accent)
    drawWrappedText(ctx, posterLine, W / 2, 466, 250, {
      fontSize: 12,
      lineHeight: 15,
      maxLines: 1
    })
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
    ctx.draw(false, () => setTimeout(resolve, 200))
  })
}
