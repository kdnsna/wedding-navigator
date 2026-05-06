<template>
  <view class="poster-wrapper">
    <canvas
      canvas-id="posterCanvas"
      id="posterCanvas"
      class="poster-canvas"
      :style="{ width: canvasStyle.width, height: canvasStyle.height }"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, watch, getCurrentInstance } from 'vue'
import { useWeddingStore } from '@/stores/wedding.js'

const props = defineProps({
  qrCodePath: { type: String, default: '' }
})

const emit = defineEmits(['ready', 'fail'])

const store = useWeddingStore()
const instance = getCurrentInstance()

// 画布尺寸（设计稿 750x1334，以 rpx 逻辑像素为基准）
// 在 2 倍屏上实际 canvas 尺寸为 375x667（px），绘制时 scale=2 还原高清
const canvasWidth = 375  // 逻辑 px
const canvasHeight = 667
const DPR = 2

const canvasStyle = ref({
  width: `${canvasWidth}px`,
  height: `${canvasHeight}px`
})

// 颜色常量
const WHITE = '#FFFFFF'
const GOLD = '#C4A882'
const ROSE = '#B03A5B'
const DARK = '#1A1A1A'

// 下载远程图片为本地临时路径
function downloadImage(url) {
  if (!url) return Promise.resolve('')
  return new Promise((resolve) => {
    if (!url.startsWith('http')) return resolve(url)
    uni.downloadFile({
      url,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve('')
    })
  })
}

// 格式化日期
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

async function drawPoster() {
  let ctx
  try {
    ctx = uni.createCanvasContext('posterCanvas', instance)
  } catch (e) {
    emit('fail', e)
    return
  }

  ctx.scale(DPR, DPR)

  const W = canvasWidth
  const H = canvasHeight

  // ========== 1. 背景 ==========
  const bgPath = await downloadImage(store.album?.photos?.[0]?.url || '')

  if (bgPath) {
    ctx.drawImage(bgPath, 0, 0, W, H)
    ctx.setFillStyle('rgba(15, 8, 5, 0.58)')
    ctx.fillRect(0, 0, W, H)
  } else {
    // 默认渐变背景
    const gradient = ctx.createLinearGradient(0, 0, W, H)
    gradient.addColorStop(0, '#2A1508')
    gradient.addColorStop(0.5, '#1A0E06')
    gradient.addColorStop(1, '#0D0805')
    ctx.setFillStyle(gradient)
    ctx.fillRect(0, 0, W, H)
  }

  // ========== 2. 顶部装饰 ==========
  ctx.setStrokeStyle('rgba(255,255,255,0.12)')
  ctx.setLineWidth(0.5)
  ctx.beginPath()
  ctx.moveTo(40, 72)
  ctx.lineTo(W - 40, 72)
  ctx.stroke()

  ctx.setFillStyle('rgba(255,255,255,0.45)')
  ctx.setFontSize(9)
  ctx.setTextAlign('center')
  ctx.fillText('WEDDING INVITATION', W / 2, 52)

  // ========== 3. 新人名字 ==========
  const groom = store.invitation?.couple?.groom?.name || '新郎'
  const bride = store.invitation?.couple?.bride?.name || '新娘'

  // 左名字
  ctx.setFontSize(28)
  ctx.setTextAlign('right')
  ctx.setFillStyle(WHITE)
  ctx.fillText(groom, W / 2 - 16, 168)

  // & 符号
  ctx.setFontSize(16)
  ctx.setTextAlign('center')
  ctx.setFillStyle(GOLD)
  ctx.fillText('&', W / 2, 162)

  // 右名字
  ctx.setFontSize(28)
  ctx.setTextAlign('left')
  ctx.setFillStyle(WHITE)
  ctx.fillText(bride, W / 2 + 16, 168)

  // 英文副标题
  ctx.setFontSize(11)
  ctx.setTextAlign('center')
  ctx.setFillStyle('rgba(255,255,255,0.5)')
  ctx.fillText('Together with their families', W / 2, 200)

  // ========== 4. 分割线 ==========
  ctx.setStrokeStyle(GOLD)
  ctx.setLineWidth(0.6)
  ctx.beginPath()
  ctx.moveTo(W / 2 - 50, 232)
  ctx.lineTo(W / 2 + 50, 232)
  ctx.stroke()
  ctx.setFillStyle(GOLD)
  ctx.beginPath()
  ctx.arc(W / 2, 232, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // ========== 5. 日期 ==========
  const dateStr = formatDateCN(store.weddingDate)
  ctx.setFillStyle(WHITE)
  ctx.setFontSize(15)
  ctx.setTextAlign('center')
  ctx.fillText(dateStr, W / 2, 268)

  const weekDay = getWeekDay(store.weddingDate)
  if (weekDay) {
    ctx.setFillStyle('rgba(255,255,255,0.38)')
    ctx.setFontSize(10)
    ctx.fillText(weekDay, W / 2, 288)
  }

  // 时间
  const time = store.weddingTime || '12:00'
  ctx.setFillStyle('rgba(255,255,255,0.6)')
  ctx.setFontSize(12)
  ctx.fillText(time, W / 2, 310)

  // ========== 6. 分割线 ==========
  ctx.setStrokeStyle('rgba(255,255,255,0.1)')
  ctx.setLineWidth(0.5)
  ctx.beginPath()
  ctx.moveTo(60, 348)
  ctx.lineTo(W - 60, 348)
  ctx.stroke()

  // ========== 7. 场地 ==========
  const venueName = store.venueName || ''
  const venueAddress = store.invitation?.wedding?.venue_address || ''

  ctx.setFillStyle('rgba(255,255,255,0.82)')
  ctx.setFontSize(13)
  ctx.setTextAlign('center')
  ctx.fillText(venueName, W / 2, 380)

  if (venueAddress) {
    ctx.setFillStyle('rgba(255,255,255,0.35)')
    ctx.setFontSize(9)
    ctx.fillText(venueAddress, W / 2, 400)
  }

  // ========== 8. 小程序码 ==========
  const qrPath = await downloadImage(props.qrCodePath)
  if (qrPath) {
    const qrSize = 60
    const qrX = (W - qrSize) / 2
    const qrY = H - qrSize - 50

    // 白色圆角背景
    ctx.setFillStyle('rgba(255,255,255,0.92)')
    roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 6)
    ctx.fill()

    // 白色内边距背景
    ctx.setFillStyle(WHITE)
    roundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4)
    ctx.fill()

    // QR 码本体
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 2)
    ctx.clip()
    ctx.drawImage(qrPath, qrX, qrY, qrSize, qrSize)
    ctx.restore()

    // 提示文字
    ctx.setFillStyle('rgba(0,0,0,0.3)')
    ctx.setFontSize(8)
    ctx.setTextAlign('center')
    ctx.fillText('长按识别小程序码', W / 2, qrY + qrSize + 22)
  }

  // ========== 9. 底部 ==========
  ctx.setFillStyle('rgba(255,255,255,0.15)')
  ctx.setFontSize(7)
  ctx.setTextAlign('center')
  ctx.fillText('—— 甜囍手册 ——', W / 2, H - 16)

  ctx.draw(false, () => {
    setTimeout(() => emit('ready'), 200)
  })
}

// 圆角矩形辅助函数
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

onMounted(async () => {
  // 延迟等待节点渲染
  await new Promise(r => setTimeout(r, 300))
  await drawPoster()
})

watch(() => props.qrCodePath, async (val) => {
  if (val) {
    await drawPoster()
  }
})

defineExpose({ redraw: drawPoster })
</script>

<style lang="scss" scoped>
.poster-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
.poster-canvas {
  border-radius: 16rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.25);
}
</style>
