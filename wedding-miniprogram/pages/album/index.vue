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
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
  margin-bottom: 12rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
}
.page-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.55;
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
  animation: fadeInScale 0.5s $ease-out both;
  opacity: 0;
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
  padding: 200rpx 60rpx;
}
.empty-text {
  display: block;
  font-size: 30rpx;
  color: $text-muted;
}
.empty-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-placeholder;
}
.empty-action {
  margin-top: 32rpx;
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
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
