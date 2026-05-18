<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">ALBUM</text>
      <text class="page-title">相册管理</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-area" :class="{ disabled: uploading }" @click="chooseImage">
      <text class="upload-icon">+</text>
      <text class="upload-text">{{ uploading ? `上传中 ${uploadProgress.current}/${uploadProgress.total}` : '上传照片' }}</text>
      <text class="upload-hint">{{ uploading ? '请保持页面打开' : '支持 JPG、PNG 格式，建议先上传竖版封面' }}</text>
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
import { generateId, showSuccess, showError, showLoading, hideLoading } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { updateWedding, uploadFile } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const photos = computed(() => store.album?.photos || [])
const uploading = ref(false)

const uploadProgress = ref({ current: 0, total: 0 })

async function chooseImage() {
  if (uploading.value) return
  if (!userStore.weddingId) {
    showError('请先创建婚礼')
    return
  }

  try {
    const filePaths = await chooseAlbumImages()
    if (!filePaths.length) return

    uploading.value = true
    uploadProgress.value = { current: 0, total: filePaths.length }
    showLoading(`上传中 0/${filePaths.length}`)

    for (const localPath of filePaths) {
      uploadProgress.value.current += 1
      showLoading(`上传中 ${uploadProgress.value.current}/${filePaths.length}`)
      const id = generateId()
      const cloudPath = buildAlbumCloudPath(localPath, id)
      const cloudRes = await uploadFile(localPath, cloudPath)
      if (!cloudRes?.fileID) {
        throw new Error('云存储未返回文件ID')
      }
      const photo = {
        id,
        url: cloudRes.fileID,
        type: photos.value.length === 0 ? 'cover' : 'normal',
        upload_time: new Date().toISOString()
      }
      store.addPhoto(photo)
    }

    await saveToStorage()
    showSuccess('上传成功')
  } catch (err) {
    console.error('照片上传失败:', err)
    showError(err?.message || '上传失败，请重试')
  } finally {
    hideLoading()
    uploading.value = false
    uploadProgress.value = { current: 0, total: 0 }
  }
}

function chooseAlbumImages() {
  return new Promise((resolve, reject) => {
    const fail = (err) => {
      const message = err?.errMsg || ''
      if (message.includes('cancel')) {
        resolve([])
        return
      }
      reject(new Error(message || '选择照片失败'))
    }

    if (typeof wx !== 'undefined' && wx.chooseMedia) {
      wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => {
          resolve((res.tempFiles || []).map(item => item.tempFilePath).filter(Boolean))
        },
        fail
      })
      return
    }

    uni.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths || []),
      fail
    })
  })
}

function buildAlbumCloudPath(localPath, id) {
  const extMatch = String(localPath || '').match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  const ext = (extMatch?.[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `weddings/${userStore.weddingId}/albums/${id}.${ext}`
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
    throw new Error(err?.message || '相册保存失败')
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
.upload-area.disabled {
  opacity: 0.62;
  pointer-events: none;
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
  display: block;
  background: $bg-muted;
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
  width: 220rpx;
  height: 220rpx;
  font-size: 0;
  display: block;
  margin: 0 auto 24rpx;
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
