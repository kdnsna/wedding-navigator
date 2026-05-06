<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { initCloud } from '@/composables/useCloud.js'

onLaunch(() => {
  initCloud()
})

onShow(() => {})
onHide(() => {})
</script>

<style lang="scss">
@import '@/uni.scss';

/* ========== 全局重置 ========== */
page {
  font-family: -apple-system, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
  color: $text-primary;
  background-color: $bg-color;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ========== 通用容器 ========== */
.container {
  padding: 32rpx;
}

/* ========== 安全区域 ========== */
.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* ========== 点击反馈 ========== */
.tap-active {
  transition: opacity 0.15s ease;
}
.tap-active:active {
  opacity: 0.65;
}

/* ========== 文字省略 ========== */
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ========== Flex 布局工具 ========== */
.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-1 { flex: 1; }

/* ========== 间距工具 ========== */
.mt-10 { margin-top: 10rpx; }
.mt-20 { margin-top: 20rpx; }
.mt-30 { margin-top: 30rpx; }
.mb-10 { margin-bottom: 10rpx; }
.mb-20 { margin-bottom: 20rpx; }
.mb-30 { margin-bottom: 30rpx; }
.ml-10 { margin-left: 10rpx; }
.ml-20 { margin-left: 20rpx; }
.mr-10 { margin-right: 10rpx; }
.mr-20 { margin-right: 20rpx; }

/* ========== 文字对齐 ========== */
.text-center { text-align: center; }
.text-right { text-align: right; }

/* ========== 全局动画 Keyframes ========== */

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(60rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* 呼吸 */
@keyframes breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* 轻柔浮动 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8rpx); }
}

/* 脉动缩放 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

/* 弹性入场 */
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

/* 遮罩揭示 */
@keyframes revealUp {
  from { clip-path: inset(100% 0 0 0); opacity: 0; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}

/* 线条生长 */
@keyframes drawLine {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* 旋转缓入 */
@keyframes spinIn {
  from { opacity: 0; transform: rotate(-180deg) scale(0.5); }
  to { opacity: 1; transform: rotate(0) scale(1); }
}

/* 错位入场 */
@keyframes staggerFade {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 全局动画类 ========== */
.animate-fade-in {
  animation: fadeIn 0.6s $ease-out forwards;
}
.animate-fade-up {
  animation: fadeInUp 0.7s $ease-out forwards;
  opacity: 0;
}
.animate-scale-in {
  animation: fadeInScale 0.5s $ease-out forwards;
  opacity: 0;
}

/* 依次延迟入场 */
@for $i from 1 through 12 {
  .delay-#{$i} {
    animation-delay: #{$i * 0.1}s;
  }
}

/* ========== 按钮系统（极简） ========== */

/* 主按钮：胶囊形状 */
.btn-primary {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $color-primary;
  color: $text-inverse;
  font-size: $font-h4;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.btn-primary::after { border: none; }
.btn-primary:active { opacity: 0.8; }

/* 次要按钮：无边框文字 */
.btn-text {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: transparent;
  color: $color-primary;
  font-size: $font-h4;
  font-weight: 500;
}
.btn-text::after { border: none; }

/* 小型胶囊按钮 */
.btn-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 40rpx;
  border-radius: $radius-full;
  background: $text-primary;
  color: $text-inverse;
  font-size: $font-body;
  font-weight: 500;
}
.btn-pill::after { border: none; }
.btn-pill-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 40rpx;
  border-radius: $radius-full;
  background: transparent;
  color: $text-primary;
  font-size: $font-body;
  font-weight: 500;
  border: 2rpx solid $border-color;
}
.btn-pill-outline::after { border: none; }

/* ========== 分割线（极简） ========== */
.divider {
  height: 1rpx;
  background: $border-color;
}

/* ========== 页面标题（大字排版） ========== */
.page-title {
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 2rpx;
}

.page-subtitle {
  font-size: $font-caption;
  color: $text-muted;
  letter-spacing: 4rpx;
  text-transform: uppercase;
}

/* ========== 装饰元素 ========== */

/* 细横线装饰 */
.deco-line {
  width: 48rpx;
  height: 2rpx;
  background: $text-muted;
  display: inline-block;
}

/* 小圆点装饰 */
.deco-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: $text-muted;
  display: inline-block;
}

/* 引号装饰 */
.quote-mark {
  font-size: 72rpx;
  line-height: 1;
  color: $border-color;
  font-family: Georgia, serif;
}

/* 囍字水印 */
.xi-watermark {
  font-size: 400rpx;
  color: rgba(255,255,255,0.03);
  position: absolute;
  font-weight: 900;
  pointer-events: none;
  user-select: none;
}

/* ========== 动效类扩展 ========== */
.animate-float {
  animation: float 3s ease-in-out infinite;
}
.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
.animate-bounce-in {
  animation: bounceIn 0.8s $ease-out-back forwards;
}
.animate-reveal-up {
  animation: revealUp 0.8s $ease-out forwards;
}
.animate-draw-line {
  animation: drawLine 0.6s $ease-out forwards;
  transform-origin: left center;
}
.animate-spin-in {
  animation: spinIn 0.7s $ease-out-back forwards;
}

/* 依次错位入场（最多16个） */
@for $i from 1 through 16 {
  .stagger-#{$i} {
    animation: staggerFade 0.5s $ease-out #{$i * 0.08}s both;
  }
}
</style>
