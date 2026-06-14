<template>
  <view class="page" :class="templateClass">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">ALBUM</text>
      <text class="page-title">婚纱相册</text>
      <text class="page-desc">{{ activeTemplate.albumMood }} · {{ activeTemplate.photoMood }}</text>
    </view>

    <!-- 瀑布流相册 -->
    <view class="album-container" v-if="photos.length > 0">
      <view
        class="photo-item"
        v-for="(photo, index) in photos"
        :key="photo.id"
        @click="previewImage(index)"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <image
          class="photo-image"
          :src="photo.url"
          mode="widthFix"
          lazy-load
        />
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="photos.length === 0 && !loading">
      <image class="empty-visual" src="/static/visuals/empty-album.svg" mode="aspectFit" />
      <text class="empty-text">{{ emptyText }}</text>
      <text class="empty-sub" v-if="emptySub">{{ emptySub }}</text>
      <button class="empty-action" @click="goToGuide" v-if="userStore.weddingId">先看婚礼路书</button>
    </view>

    <!-- 加载中 -->
    <view class="loading-state" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')

const photos = computed(() => store.album?.photos || [])
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const emptyText = computed(() => {
  if (!userStore.weddingId) return '请从有效婚礼邀请进入'
  if (loadError.value) return '相册加载失败'
  return '暂无照片'
})
const emptySub = computed(() => {
  if (!userStore.weddingId) return '当前没有关联的婚礼信息'
  if (loadError.value) return '请稍后重试或联系新人'
  return '新人还在准备婚纱照'
})

function previewImage(index) {
  const urls = photos.value.map(p => p.url)
  uni.previewImage({ urls, current: urls[index] })
}

function goToGuide() {
  uni.switchTab({ url: '/pages/guide/index' })
}

onShow(async () => {
  if (!userStore.weddingId || photos.value.length > 0) return
  loading.value = true
  loadError.value = ''
  try { await fetchWedding(userStore.weddingId) } catch (err) { loadError.value = err?.message || 'load failed' }
  finally { loading.value = false }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
  padding: 0 $page-gutter calc(60rpx + env(safe-area-inset-bottom));
}

.page-header {
  padding: $page-header-top 0 $page-header-bottom;
}
.page-tag {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  margin-bottom: 18rpx;
  font-weight: 500;
}
.page-tag::before {
  content: '';
  width: 24rpx;
  height: 1rpx;
  background: currentColor;
  opacity: 0.5;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: $tracking-cn;
  line-height: 1.25;
}
.page-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.65;
  letter-spacing: $tracking-cn-soft;
  position: relative;
  padding-left: 20rpx;
}
.page-desc::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12rpx;
  bottom: 12rpx;
  width: 2rpx;
  background: $text-primary;
  opacity: 0.5;
  border-radius: 2rpx;
}

.album-container {
  column-count: 2;
  column-gap: 16rpx;
}

.photo-item {
  break-inside: avoid;
  margin-bottom: 16rpx;
  border-radius: $radius-md;
  overflow: hidden;
  animation: fadeInScale 0.6s $ease-editorial both;
  opacity: 0;
  transition: transform 0.3s $ease-editorial, box-shadow 0.3s $ease-editorial;
  cursor: pointer;
  position: relative;
}
.photo-item:active {
  transform: scale(0.98);
}

@for $i from 1 through 20 {
  .photo-item:nth-child(#{$i}) {
    animation-delay: #{$i * 0.06}s;
  }
}

.photo-image {
  width: 100%;
  display: block;
}

.empty-state {
  text-align: center;
  padding: 160rpx 60rpx 200rpx;
}
.empty-visual {
  width: 220rpx;
  height: 220rpx;
  margin: 0 auto 40rpx;
  display: block;
  filter: grayscale(0.05);
}
.empty-text {
  display: block;
  font-size: 30rpx;
  color: $text-muted;
  letter-spacing: $tracking-cn-soft;
}
.empty-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-placeholder;
  letter-spacing: $tracking-cn-soft;
}
.empty-action {
  margin-top: 36rpx;
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  letter-spacing: $tracking-kicker;
  font-weight: 500;
  transition: opacity 0.25s $ease-editorial, transform 0.25s $ease-editorial;
}
.empty-action:active {
  opacity: 0.85;
  transform: scale(0.98);
}
.empty-action::after { border: none; }

.loading-state {
  text-align: center;
  padding: 120rpx;
  color: $text-muted;
  font-size: 28rpx;
}

.tpl-rose .photo-item {
  box-shadow: $shadow-sm;
}
.tpl-champagne {
  background: #fbf7f1;
  .photo-item {
    border-radius: $card-radius;
    box-shadow: $shadow-sm;
  }
}
.tpl-noir {
  background: #111;
  .page-title {
    color: #fff;
  }
  .page-desc {
    color: rgba(255,255,255,0.62);
  }
  .photo-item {
    border: 1rpx solid rgba(201,169,110,0.18);
    box-shadow: $shadow-sm;
  }
}
.tpl-garden {
  background: #f5f6ef;
  .photo-item {
    border-radius: 8rpx;
    box-shadow: $shadow-sm;
  }
}

.theme-rose,
.theme-champagne,
.theme-noir,
.theme-garden,
.theme-heritage,
.theme-shandong,
.theme-travel {
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);

  .page-title {
    color: var(--theme-ink, $text-primary);
  }

  .page-tag,
  .page-desc,
  .empty-text,
  .empty-sub,
  .loading-state {
    color: var(--theme-muted, $text-muted);
  }

  .photo-item {
    background: var(--theme-surface, $bg-surface);
    border: 1rpx solid var(--theme-border, transparent);
    box-shadow: $shadow-sm;
  }

  .empty-action {
    background: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, #fff);
  }
}
</style>
