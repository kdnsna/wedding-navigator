<template>
  <view class="page">
    <!-- 瀑布流相册 -->
    <view class="album-container">
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
        <view class="photo-caption" v-if="photo.caption">
          <text>{{ photo.caption }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="photos.length === 0 && !loading">
      <text class="empty-icon">📷</text>
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
  uni.previewImage({
    urls,
    current: urls[index]
  })
}

onShow(async () => {
  if (userStore.weddingId && photos.value.length === 0) {
    loading.value = true
    try {
      await fetchWedding(userStore.weddingId)
    } catch (err) {
      console.error('加载相册失败:', err)
    } finally {
      loading.value = false
    }
  }
})
</script>

<style lang="scss" scoped>
/* ========== 相册页面 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 24rpx;
}

.album-container {
  column-count: 2;
  column-gap: 20rpx;
}

.photo-item {
  break-inside: avoid;
  margin-bottom: 20rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: $bg-surface;
  box-shadow: $shadow-sm;
  animation: fadeInScale 0.5s $ease-out both;
  opacity: 0;
  position: relative;
}
.photo-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60rpx;
  background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
  pointer-events: none;
}

/* 依次延迟入场 */
@for $i from 1 through 20 {
  .photo-item:nth-child(#{$i}) {
    animation-delay: #{$i * 0.06}s;
  }
}

.photo-image {
  width: 100%;
  display: block;
}

.photo-caption {
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: $text-secondary;
  position: relative;
  z-index: 1;
  background: $bg-surface;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 60rpx;
  animation: fadeIn 0.6s $ease-out both;
}
.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(212,168,83,0.2));
}
.empty-text {
  font-size: 30rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}

.loading-state {
  text-align: center;
  padding: 120rpx;
  color: $text-muted;
  font-size: 28rpx;
}
</style>
