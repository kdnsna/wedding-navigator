<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">ALBUM</text>
      <text class="page-title">相册管理</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-area" @click="chooseImage">
      <text class="upload-icon">+</text>
      <text class="upload-text">上传照片</text>
      <text class="upload-hint">支持 JPG、PNG 格式</text>
    </view>

    <!-- 照片网格 -->
    <view class="photo-grid" v-if="photos.length > 0">
      <view class="photo-item" v-for="photo in photos" :key="photo.id">
        <image class="photo-img" :src="photo.url" mode="aspectFill" />
        <view class="photo-overlay">
          <view class="photo-actions">
            <text class="photo-tag" v-if="photo.type === 'cover'">封面</text>
            <text class="photo-delete" @click.stop="deletePhoto(photo.id)">✕</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="photos.length === 0">
      <image class="empty-visual empty-icon" src="/static/visuals/empty-album.png" mode="aspectFit" />
      <text class="empty-text">还没有照片</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { generateId, showSuccess, showError } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const photos = computed(() => store.album?.photos || [])

function chooseImage() {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      res.tempFilePaths.forEach(path => {
        const photo = {
          id: generateId(),
          url: path,
          type: photos.value.length === 0 ? 'cover' : 'normal',
          upload_time: new Date().toISOString()
        }
        store.addPhoto(photo)
      })
      saveToStorage()
      showSuccess('上传成功')
    },
    fail: () => { showError('上传失败') }
  })
}

function deletePhoto(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除这张照片？',
    success: (res) => {
      if (res.confirm) {
        store.removePhoto(id)
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

async function saveToStorage() {
  try {
    await updateWedding(userStore.weddingId, 'albums', store.album)
  } catch (err) {
    console.error('album 云端保存失败:', err)
  }
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].album = store.album
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(() => { useOwnerGuard() })
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 36rpx;
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

/* 上传区域 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  margin: 0 48rpx 36rpx;
  background: $bg-muted;
  border-radius: $radius-lg;
  border: 2rpx dashed $border-color;
}
.upload-icon {
  font-size: 48rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
}
.upload-text {
  font-size: 30rpx;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.upload-hint {
  font-size: 24rpx;
  color: $text-muted;
}

/* 照片网格 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  padding: 0 48rpx;
}
.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: $radius-md;
  overflow: hidden;
}
.photo-img {
  width: 100%;
  height: 100%;
}
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.photo-actions {
  display: flex;
  justify-content: space-between;
  padding: 8rpx;
}
.photo-tag {
  padding: 4rpx 10rpx;
  background: $text-primary;
  color: #fff;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}
.photo-delete {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 22rpx;
  border-radius: 50%;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 150rpx 60rpx;
}
.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
