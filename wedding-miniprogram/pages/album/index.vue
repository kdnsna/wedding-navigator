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
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 20rpx;
}

.album-container {
  column-count: 2;
  column-gap: 16rpx;
}

.photo-item {
  break-inside: avoid;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: $bg-surface;
  box-shadow: $shadow-sm;
  animation: slideUp 0.5s ease-out forwards;
  opacity: 0;
}

.photo-image {
  width: 100%;
  display: block;
}

.photo-caption {
  padding: 16rpx;
  font-size: 24rpx;
  color: $text-secondary;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 60rpx;
}
.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}
.empty-text {
  font-size: 30rpx;
  color: $text-muted;
}

.loading-state {
  text-align: center;
  padding: 100rpx;
  color: $text-muted;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
