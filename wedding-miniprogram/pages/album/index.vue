<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">ALBUM</text>
      <text class="page-title">婚纱相册</text>
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
      <text class="empty-text">暂无照片</text>
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

const photos = computed(() => store.album?.photos || [])

function previewImage(index) {
  const urls = photos.value.map(p => p.url)
  uni.previewImage({ urls, current: urls[index] })
}

onShow(async () => {
  if (userStore.weddingId && photos.value.length === 0) {
    loading.value = true
    try { await fetchWedding(userStore.weddingId) } catch (err) {}
    finally { loading.value = false }
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 0 24rpx 60rpx;
}

.page-header {
  padding: 60rpx 24rpx 36rpx;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
  margin-bottom: 12rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
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
  font-size: 30rpx;
  color: $text-muted;
}

.loading-state {
  text-align: center;
  padding: 120rpx;
  color: $text-muted;
  font-size: 28rpx;
}
</style>
