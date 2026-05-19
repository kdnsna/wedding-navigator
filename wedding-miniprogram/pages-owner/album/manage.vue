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
      <image class="empty-visual empty-icon" src="/static/visuals/empty-album.svg" mode="aspectFit" />
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
import { fetchWedding, updateWedding, uploadFile, deleteFiles } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const photos = computed(() => store.album?.photos || [])
const uploading = ref(false)
const refreshing = ref(false)

const uploadProgress = ref({ current: 0, total: 0 })
const MAX_UPLOAD_COUNT = 9

async function chooseImage() {
  if (uploading.value) return
  if (!userStore.weddingId) {
    showError('请先创建婚礼')
    return
  }

  try {
    const filePaths = await chooseAlbumImages()
    if (!filePaths.length) return

    const previousAlbum = cloneAlbum()
    const previousPhotos = previousAlbum.photos || []
    const uploadedPhotos = []

    uploading.value = true
    uploadProgress.value = { current: 0, total: filePaths.length }
    showLoading(`上传中 0/${filePaths.length}`)

    try {
      for (const localPath of filePaths) {
        uploadProgress.value.current += 1
        showLoading(`上传中 ${uploadProgress.value.current}/${filePaths.length}`)
        const id = generateId()
        const cloudPath = buildAlbumCloudPath(localPath, id)
        const cloudRes = await uploadFile(localPath, cloudPath)
        if (!cloudRes?.fileID) {
          throw new Error('云存储未返回文件ID')
        }
        uploadedPhotos.push({
          id,
          url: cloudRes.fileID,
          type: previousPhotos.length === 0 && uploadedPhotos.length === 0 ? 'cover' : 'normal',
          upload_time: new Date().toISOString()
        })
      }

      const nextAlbum = {
        ...previousAlbum,
        photos: [...previousPhotos, ...uploadedPhotos],
        updated_at: new Date().toISOString()
      }
      store.album = nextAlbum
      showLoading('保存相册中')
      await saveAlbumData(nextAlbum)
      showSuccess('上传成功')
    } catch (err) {
      store.album = previousAlbum
      await deleteUploadedPhotos(uploadedPhotos)
      throw err
    }
  } catch (err) {
    console.error('照片上传失败:', err)
    showUploadError(err)
  } finally {
    hideLoading()
    uploading.value = false
    uploadProgress.value = { current: 0, total: 0 }
  }
}

function chooseAlbumImages() {
  return new Promise((resolve, reject) => {
    const chooseImageApi = getChooseImageApi()
    if (!chooseImageApi.length) {
      reject(new Error('当前环境不支持选择照片，请在微信小程序中重试'))
      return
    }

    ensureAlbumPrivacyAuthorized()
      .then(() => chooseWithFallback(chooseImageApi))
      .then(resolve)
      .catch(reject)
  })
}

function getChooseImageApi() {
  const apis = []
  if (typeof wx !== 'undefined' && typeof wx.chooseImage === 'function') {
    apis.push({
      name: 'wx.chooseImage',
      choose: wx.chooseImage.bind(wx),
      options: {
        count: MAX_UPLOAD_COUNT,
        sizeType: ['compressed', 'original'],
        sourceType: ['album']
      }
    })
  }
  if (typeof uni !== 'undefined' && typeof uni.chooseImage === 'function') {
    apis.push({
      name: 'uni.chooseImage',
      choose: uni.chooseImage.bind(uni),
      options: {
        count: MAX_UPLOAD_COUNT,
        sizeType: ['compressed', 'original'],
        sourceType: ['album']
      }
    })
  }
  if (typeof wx !== 'undefined' && typeof wx.chooseMedia === 'function') {
    apis.push({
      name: 'wx.chooseMedia',
      choose: wx.chooseMedia.bind(wx),
      options: {
        count: MAX_UPLOAD_COUNT,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: ['compressed']
      }
    })
  }
  return apis
}

function ensureAlbumPrivacyAuthorized() {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || typeof wx.requirePrivacyAuthorize !== 'function') {
      resolve()
      return
    }

    wx.requirePrivacyAuthorize({
      success: resolve,
      fail: (err) => {
        const message = err?.errMsg || err?.message || ''
        reject(new Error(normalizeChooseImageError(message)))
      }
    })
  })
}

async function chooseWithFallback(apis) {
  let lastError = null

  for (const api of apis) {
    try {
      return await runChooseApi(api)
    } catch (err) {
      lastError = err
      const raw = err?.rawMessage || err?.message || ''
      if (shouldStopChooseFallback(raw)) {
        throw err
      }
      console.warn(`[album] ${api.name} failed, trying next picker:`, raw)
    }
  }

  throw lastError || new Error('选择照片失败，请重试')
}

function runChooseApi(api) {
  return new Promise((resolve, reject) => {
    api.choose({
      ...api.options,
      success: (res) => {
        const paths = extractChosenImagePaths(res)
        if (!paths.length) {
          reject(new Error('未获取到照片路径，请重新选择'))
          return
        }
        resolve([...new Set(paths)])
      },
      fail: (err) => {
        const msg = err?.errMsg || err?.message || ''
        if (msg.includes('cancel')) { resolve([]); return }
        const error = new Error(normalizeChooseImageError(msg))
        error.rawMessage = msg
        error.apiName = api.name
        reject(error)
      }
    })
  })
}

function shouldStopChooseFallback(message = '') {
  return /privacy|隐私|permission|denied|auth|authorize|scope|cancel/i.test(message)
}

function extractChosenImagePaths(res = {}) {
  const fromPaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : []
  const fromFiles = Array.isArray(res.tempFiles)
    ? res.tempFiles.map(item => {
      if (typeof item === 'string') return item
      return item?.tempFilePath || item?.path || item?.thumbTempFilePath || ''
    })
    : []
  return [...fromPaths, ...fromFiles]
    .map(item => String(item || '').trim())
    .filter(Boolean)
}

function normalizeChooseImageError(message = '') {
  const raw = String(message || '')
  if (raw.includes('api scope is not declared') || raw.includes('privacy agreement')) {
    return '上传照片前，请先在微信公众平台隐私保护指引中声明“照片或视频信息”用途'
  }
  if (/privacy|隐私/i.test(raw)) {
    return '请先同意小程序隐私保护指引后再上传照片'
  }
  if (/auth|permission|denied|authorize|scope/i.test(raw)) {
    return '选择照片失败，请在微信设置中允许访问相册'
  }
  if (raw.includes('chooseImage:fail') || raw.includes('chooseMedia:fail')) {
    return '选择照片失败，请稍后重试；也可以尝试重新进入小程序后上传'
  }
  return raw || '选择照片失败，请重试'
}

function showUploadError(err) {
  const message = err?.message || '上传失败，请重试'
  if (message.includes('微信设置')) {
    uni.showModal({
      title: '无法选择照片',
      content: message,
      confirmText: '去设置',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) openAppSettings()
      }
    })
    return
  }
  if (message.length > 14 || message.includes('云') || message.includes('权限')) {
    uni.showModal({
      title: '上传失败',
      content: message,
      showCancel: false
    })
    return
  }
  showError(message)
}

function openAppSettings() {
  const api = typeof wx !== 'undefined' && wx.openSetting ? wx : (typeof uni !== 'undefined' && uni.openSetting ? uni : null)
  if (!api) return
  api.openSetting({})
}

function buildAlbumCloudPath(localPath, id) {
  const extMatch = String(localPath || '').match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  const ext = (extMatch?.[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `weddings/${userStore.weddingId}/albums/${id}.${ext}`
}

function cloneAlbum() {
  const album = store.album || { photos: [] }
  return JSON.parse(JSON.stringify({ ...album, photos: album.photos || [] }))
}

async function deleteUploadedPhotos(photoList) {
  const fileList = photoList.map(photo => photo.url).filter(Boolean)
  if (fileList.length) {
    await deleteFiles(fileList)
  }
}

async function refreshAlbum() {
  if (!useOwnerGuard()) return
  if (!userStore.weddingId || refreshing.value) return

  refreshing.value = true
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.error('相册刷新失败:', err)
    showError(err?.message || '相册刷新失败')
  } finally {
    refreshing.value = false
  }
}

function deletePhoto(id) {
  const photo = photos.value.find(item => item.id === id)
  uni.showModal({
    title: '确认删除',
    content: '确定删除这张照片？',
    success: async (res) => {
      if (!res.confirm) return

      const previousAlbum = cloneAlbum()
      const nextPhotos = previousAlbum.photos.filter(item => item.id !== id)
      if (previousAlbum.photos.some(item => item.id === id && item.type === 'cover') && nextPhotos[0]) {
        nextPhotos[0].type = 'cover'
      }

      const nextAlbum = {
        ...previousAlbum,
        photos: nextPhotos,
        updated_at: new Date().toISOString()
      }

      try {
        store.album = nextAlbum
        await saveAlbumData(nextAlbum)
        if (photo?.url) await deleteFiles([photo.url])
        showSuccess('已删除')
      } catch (err) {
        store.album = previousAlbum
        console.error('照片删除失败:', err)
        showError(err?.message || '删除失败，请重试')
      }
    }
  })
}

async function saveAlbumData(albumData) {
  if (!userStore.weddingId) {
    throw new Error('请先创建婚礼')
  }
  const cleanAlbum = {
    ...(albumData || {}),
    photos: albumData?.photos || []
  }
  try {
    await updateWedding(userStore.weddingId, 'albums', cleanAlbum)
  } catch (err) {
    console.error('album 云端保存失败:', err)
    throw new Error(err?.message || '相册保存失败')
  }

  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].album = cleanAlbum
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(refreshAlbum)
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter $page-header-bottom;
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

/* 上传区域 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  margin: 0 $page-gutter 36rpx;
  background: $bg-muted;
  border-radius: $card-radius;
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
  padding: 0 $page-gutter;
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
