<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { initCloud } from '@/composables/useCloud.js'

onLaunch(() => {
  initCloud()
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import '@/uni.scss';

/* ========== 全局重置 ========== */
page {
  font-family: -apple-system, "PingFang SC", "Noto Serif SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  color: $text-primary;
  background-color: $bg-color;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ========== 通用容器 ========== */
.container {
  padding: 30rpx;
}

/* ========== 安全区域 ========== */
.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* ========== 点击反馈 ========== */
.tap-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.tap-active:active {
  opacity: 0.75;
  transform: scale(0.97);
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

/* ========== Flex 布局 ========== */
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

/* 淡入上浮 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 淡入缩放 */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 轻微浮动 */
@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8rpx); }
}

/* 呼吸光晕 */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(196, 30, 58, 0.2); }
  50% { box-shadow: 0 0 0 12rpx rgba(196, 30, 58, 0); }
}

/* 闪烁金光 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 旋转 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 下滑提示 */
@keyframes bounceDown {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(12rpx); opacity: 0.5; }
}

/* 从底部滑入 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 渐显 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 装饰线展开 */
@keyframes lineExpand {
  from { width: 0; }
  to { width: 60rpx; }
}

/* ========== 全局动画类 ========== */
.animate-fade-in {
  animation: fadeIn 0.6s $ease-out forwards;
}

.animate-fade-up {
  animation: fadeInUp 0.6s $ease-out forwards;
  opacity: 0;
}

.animate-scale-in {
  animation: fadeInScale 0.5s $ease-out-back forwards;
  opacity: 0;
}

.animate-float {
  animation: gentleFloat 3s ease-in-out infinite;
}

.animate-glow {
  animation: glowPulse 2s ease-in-out infinite;
}

.animate-bounce {
  animation: bounceDown 1.5s ease-in-out infinite;
}

/* 依次延迟入场 */
@for $i from 1 through 10 {
  .delay-#{$i} {
    animation-delay: #{$i * 0.08}s;
  }
}

/* ========== 全局装饰组件 ========== */

/* 金色分割线 */
.gold-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: $color-gold;
  font-size: $font-caption;
}
.gold-divider::before,
.gold-divider::after {
  content: '';
  width: 60rpx;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $color-gold, transparent);
}

/* 中式角落装饰 */
.corner-deco {
  position: relative;
}
.corner-deco::before,
.corner-deco::after {
  content: '';
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  border-color: $color-gold;
  border-style: solid;
  opacity: 0.5;
}
.corner-deco::before {
  top: 0;
  left: 0;
  border-width: 2rpx 0 0 2rpx;
}
.corner-deco::after {
  bottom: 0;
  right: 0;
  border-width: 0 2rpx 2rpx 0;
}

/* 卡片悬浮效果 */
.card-hover {
  transition: transform 0.3s $ease-out, box-shadow 0.3s $ease-out;
}
.card-hover:active {
  transform: translateY(-2rpx);
  box-shadow: $shadow-md;
}

/* 主按钮样式 */
.btn-primary {
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: $radius-lg;
  background: $gradient-primary;
  color: $text-inverse;
  font-size: $font-h4;
  font-weight: 500;
  box-shadow: $shadow-md;
  transition: all 0.2s ease;
}
.btn-primary::after { border: none; }
.btn-primary:active {
  transform: scale(0.98);
  box-shadow: $shadow-sm;
}

/* 次要按钮 */
.btn-secondary {
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: $radius-lg;
  background: $bg-surface;
  color: $text-primary;
  font-size: $font-h4;
  font-weight: 500;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-color;
}
.btn-secondary::after { border: none; }

/* 幽灵按钮（金色边框） */
.btn-ghost {
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: $radius-full;
  background: transparent;
  color: $color-gold;
  font-size: $font-body;
  border: 2rpx solid $color-gold;
}
.btn-ghost::after { border: none; }
</style>
