<template>
  <view class="page">
    <!-- 上传按钮 -->
    <view class="upload-area" @click="chooseImage">
      <text class="upload-icon">📷</text>
      <text class="upload-text">点击上传照片</text>
      <text class="upload-hint">支持 JPG/PNG，单张不超过10MB</text>
    </view>

    <!-- 照片列表 -->
    <view class="photo-grid">
      <view
        class="photo-item"
        v-for="(photo, index) in photos"
        :key="photo.id"
        @longpress="showAction(photo)"
      >
        <image class="photo-img" :src="photo.url" mode="aspectFill" />
        <view class="photo-actions">
          <text class="action-tag" v-if="photo.type === 'cover'">封面</text>
          <text class="delete-btn" @click.stop="deletePhoto(photo.id)">✕</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="photos.length === 0">
      <text class="empty-icon">📷</text>
      <text class="empty-text">暂无照片，点击上方上传</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, showError } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const photos = computed(() => store.album?.photos || [])

function chooseImage() {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      res.tempFilePaths.forEach((path, i) => {
        const photo = {
          id: Date.now().toString() + i,
          url: path,
          type: photos.value.length === 0 ? 'cover' : 'gallery',
          sort_order: photos.value.length + i
        }
        store.addPhoto(photo)
      })
      saveToStorage()
      showSuccess('上传成功')
    }
  })
}

function deletePhoto(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张照片吗？',
    success: (res) => {
      if (res.confirm) {
        store.removePhoto(id)
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

function showAction(photo) {
  const itemList = ['设为封面', '删除']
  if (photo.type === 'cover') itemList[0] = '取消封面'
  uni.showActionSheet({
    itemList,
    success: (res) => {
      if (res.tapIndex === 0) {
        // 设为封面
        store.album.photos.forEach(p => { p.type = p.id === photo.id ? 'cover' : 'gallery' })
        saveToStorage()
      } else {
        deletePhoto(photo.id)
      }
    }
  })
}

function saveToStorage() {
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].album = store.album
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(() => {
  // 加载数据
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  background: linear-gradient(135deg, rgba(212,168,83,0.06) 0%, rgba(196,30,58,0.04) 100%);
  border-radius: 28rpx;
  border: 2rpx dashed rgba(212,168,83,0.4);
  margin-bottom: 30rpx;
}
.upload-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
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

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 20rpx;
  overflow: hidden;
  border: 2rpx solid rgba(212,168,83,0.08);
  box-shadow: $shadow-sm;
}
.photo-img {
  width: 100%;
  height: 100%;
}
.photo-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 8rpx;
}
.action-tag {
  padding: 4rpx 10rpx;
  background: $color-primary;
  color: #fff;
  font-size: 20rpx;
  border-radius: 6rpx;
}
.delete-btn {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 24rpx;
  border-radius: 50%;
}

.empty-state {
  text-align: center;
  padding: 150rpx 60rpx;
}
.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 30rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(212,168,83,0.2));
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
