<template>
  <PageShell
    class="page album-manage-page"
    kicker="ALBUM"
    title="相册管理"
    desc="上传照片、指定首页封面，并保持邀请页和相册内容同步。"
  >

    <MetricStrip :items="albumMetricItems" />

    <!-- 上传区域 -->
    <view class="upload-area" :class="{ disabled: uploading || refreshing || saving || !remainingPhotoSlots }" @click="chooseImage">
      <text class="upload-icon">+</text>
      <text class="upload-text">{{ uploadAreaTitle }}</text>
      <text class="upload-hint">{{ uploadAreaHint }}</text>
    </view>

    <!-- 照片网格 -->
    <view class="photo-grid" v-if="photos.length > 0">
      <view class="photo-item" v-for="photo in photos" :key="photo.id">
        <image class="photo-img" :src="photo.url" mode="aspectFill" />
        <view class="photo-overlay">
          <view class="photo-actions">
            <text class="photo-tag" v-if="photo.type === 'cover'">封面</text>
            <text class="photo-cover" :class="{ disabled: albumBusy }" v-else @click.stop="setCover(photo.id)">设封面</text>
            <image class="photo-delete" :class="{ disabled: albumBusy }" src="/static/visuals/icon-close-light.svg" mode="aspectFit" @click.stop="deletePhoto(photo.id)" />
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <EmptyState
      v-if="photos.length === 0 && !uploading && !refreshing"
      icon="/static/visuals/empty-album.svg"
      title="还没有照片"
      desc="建议先上传一张竖版封面，再补充仪式、外景和合影照片。"
    />

    <BottomActionBar
      primary-text="上传照片"
      secondary-text="刷新"
      :loading="uploading"
      :secondary-loading="refreshing"
      :disabled="saving"
      :primary-disabled="refreshing || !remainingPhotoSlots"
      :secondary-disabled="uploading"
      @primary="chooseImage"
      @secondary="refreshAlbum"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import MetricStrip from '@/components/ui/MetricStrip.vue'
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
const saving = ref(false)
const albumBusy = computed(() => uploading.value || refreshing.value || saving.value)

const uploadProgress = ref({ current: 0, total: 0 })
const MAX_ALBUM_PHOTOS = 9
const remainingPhotoSlots = computed(() => Math.max(0, MAX_ALBUM_PHOTOS - photos.value.length))
const albumMetricItems = computed(() => [
  { label: '精选', value: `${Math.min(photos.value.length, MAX_ALBUM_PHOTOS)}/${MAX_ALBUM_PHOTOS}` },
  { label: '封面', value: photos.value.some(item => item.type === 'cover') ? 1 : 0 },
  { label: '普通', value: photos.value.filter(item => item.type !== 'cover').length },
  { label: '剩余', value: remainingPhotoSlots.value }
])
const uploadAreaTitle = computed(() => {
  if (uploading.value) return `上传中 ${uploadProgress.value.current}/${uploadProgress.value.total}`
  if (refreshing.value) return '刷新相册中'
  if (saving.value) return '保存相册中'
  if (!remainingPhotoSlots.value) return '已满 9 张'
  return '上传照片'
})
const uploadAreaHint = computed(() => {
  if (uploading.value) return '请保持页面打开'
  if (refreshing.value) return '正在同步云端照片'
  if (saving.value) return '正在写入云端，请稍候'
  if (!remainingPhotoSlots.value) return '精选相册最多 9 张，删除后可重新上传'
  return `还可上传 ${remainingPhotoSlots.value} 张，建议先上传竖版封面`
})

async function chooseImage() {
  if (guardAlbumBusy()) return
  if (!userStore.weddingId) {
    showError('请先创建婚礼')
    return
  }
  if (!remainingPhotoSlots.value) {
    showError('精选相册最多 9 张')
    return
  }

  try {
    const filePaths = await chooseAlbumImages(remainingPhotoSlots.value)
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
      try {
        await deleteUploadedPhotos(uploadedPhotos)
      } catch (cleanupErr) {
        console.warn('上传失败后清理云文件失败:', cleanupErr)
      }
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

async function setCover(id) {
  if (guardAlbumBusy()) return
  const target = photos.value.find(item => item.id === id)
  if (!target) return
  const previousAlbum = cloneAlbum()
  const nextAlbum = {
    ...previousAlbum,
    photos: previousAlbum.photos.map(item => ({
      ...item,
      type: item.id === id ? 'cover' : 'normal'
    })),
    updated_at: new Date().toISOString()
  }
  saving.value = true
  try {
    store.album = nextAlbum
    await saveAlbumData(nextAlbum)
    showSuccess('已设为封面')
  } catch (err) {
    store.album = previousAlbum
    console.error('设置封面失败:', err)
    showError(err?.message || '设置失败，请重试')
  } finally {
    saving.value = false
  }
}

function chooseAlbumImages(count = remainingPhotoSlots.value) {
  return new Promise((resolve, reject) => {
    const chooseImageApi = getChooseImageApi(count)
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

function getChooseImageApi(count = remainingPhotoSlots.value) {
  const chooseCount = Math.max(1, Math.min(MAX_ALBUM_PHOTOS, Number(count) || 1))
  const apis = []
  if (typeof wx !== 'undefined' && typeof wx.chooseImage === 'function') {
    apis.push({
      name: 'wx.chooseImage',
      choose: wx.chooseImage.bind(wx),
      options: {
        count: chooseCount,
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
        count: chooseCount,
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
        count: chooseCount,
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
        resolve([...new Set(paths)].slice(0, api.options.count))
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
    return '请在微信公众平台声明“收集你选中的照片或视频信息”，约 5 分钟后再上传'
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
  if (message.includes('微信公众平台')) {
    uni.showModal({
      title: '需完成平台声明',
      content: `${message}。用途建议填写：用于新人上传婚礼照片并制作婚礼相册、请柬封面与分享海报。`,
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }
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
  if (!api) {
    showError('当前环境无法打开设置，请在微信中手动开启相册权限')
    return
  }
  api.openSetting({
    fail: (err) => {
      console.warn('打开相册设置失败:', err)
      showError('打开设置失败，请在微信中手动开启相册权限')
    }
  })
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
  if (!(await useOwnerGuard())) return
  if (!userStore.weddingId || refreshing.value || uploading.value || saving.value) return

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
  if (guardAlbumBusy()) return
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

      saving.value = true
      try {
        store.album = nextAlbum
        await saveAlbumData(nextAlbum)
        let cleanupFailed = false
        if (photo?.url) {
          try {
            await deleteFiles([photo.url])
          } catch (cleanupErr) {
            cleanupFailed = true
            console.warn('照片云文件清理失败:', cleanupErr)
          }
        }
        showSuccess(cleanupFailed ? '已移出相册' : '已删除')
      } catch (err) {
        store.album = previousAlbum
        console.error('照片删除失败:', err)
        showError(err?.message || '删除失败，请重试')
      } finally {
        saving.value = false
      }
    }
  })
}

function guardAlbumBusy() {
  if (!albumBusy.value) return false
  const message = uploading.value
    ? '照片正在上传，请稍候'
    : refreshing.value
      ? '相册正在刷新，请稍候'
      : '相册正在保存，请稍候'
  showError(message)
  return true
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
  gap: 16rpx;
  padding: 0 $page-gutter;
}
.photo-item {
  position: relative;
  aspect-ratio: 4 / 5;
  @include photo-mount;
  box-sizing: border-box;
  overflow: hidden;
}
.photo-img {
  width: 100%;
  height: 100%;
  display: block;
  background: $paper-deep;
  filter: none;
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
  background: var(--theme-accent, $text-primary);
  color: $ink-inverse;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}
.photo-cover {
  padding: 4rpx 10rpx;
  background: rgba(255,253,248,0.88);
  color: $text-primary;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}
.photo-cover.disabled {
  opacity: 0.55;
  pointer-events: none;
}
.photo-delete {
  width: 40rpx;
  height: 40rpx;
  padding: 9rpx;
  box-sizing: border-box;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
}
.photo-delete.disabled {
  opacity: 0.42;
  pointer-events: none;
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
