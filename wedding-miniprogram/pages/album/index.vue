<template>
  <PageShell
    title="婚纱相册"
    kicker="ALBUM"
    :desc="`${activeTemplate.albumMood} · ${activeTemplate.photoMood}`"
    :theme-class="templateClass"
  >
    <scroll-view class="album-container" scroll-x enhanced :show-scrollbar="false" v-if="photos.length > 0">
      <view class="album-track">
        <view
          class="photo-item"
          v-for="(photo, index) in photos"
          :key="photo.id || photo.url"
          @click="previewImage(index)"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <view class="photo-corner top-left" />
          <view class="photo-corner top-right" />
          <view class="photo-frame">
            <image
              class="photo-image"
              :class="photoTreatmentClass(photo)"
              :src="photo.url"
              mode="aspectFill"
              lazy-load
            />
          </view>
          <text class="photo-caption">{{ photoCaption(photo, index) }}</text>
        </view>
      </view>
    </scroll-view>

    <EmptyState
      v-if="photos.length === 0 && !loading"
      icon="/static/visuals/empty-album.svg"
      :title="emptyText"
      :desc="emptySub"
      :action-text="albumActionText"
      @action="handleEmptyAction"
    />

    <view class="loading-state" v-if="loading">
      <text>相册加载中...</text>
    </view>
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')
const MAX_ALBUM_PHOTOS = 9

const photos = computed(() => (store.album?.photos || []).slice(0, MAX_ALBUM_PHOTOS))
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const photoTreatment = computed(() => store.invitation?.photo_treatment || 'original')
const emptyText = computed(() => {
  if (!userStore.weddingId) return '这封信还没有抵达'
  if (loadError.value) return '相册加载失败'
  return '影像这一章，留给相见时慢慢翻开'
})
const emptySub = computed(() => {
  if (!userStore.weddingId) return '请从新人寄来的请柬进入'
  if (loadError.value) return '稍后再翻，这一页会重新铺开'
  return ''
})
const albumActionText = computed(() => {
  if (!userStore.weddingId) return ''
  return loadError.value ? '重新加载' : ''
})

function previewImage(index) {
  const urls = photos.value.map(p => p.url)
  if (!urls.length) return
  uni.previewImage({
    urls,
    current: urls[index],
    fail: (err) => {
      console.warn('预览相册图片失败:', err)
      uni.showToast({ title: '图片预览失败', icon: 'none' })
    }
  })
}

function photoCaption(photo, index) {
  const custom = photo?.caption || photo?.title || photo?.desc || photo?.description
  if (custom) return custom
  const date = photo?.date || photo?.taken_at || photo?.upload_time || photo?.created_at
  if (date) return formatPhotoDate(date)
  return `PHOTO ${String(index + 1).padStart(2, '0')}`
}

function formatPhotoDate(value) {
  const normalized = String(value || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized || ''
  return normalized.replace(/-/g, '.')
}

function photoTreatmentClass(photo) {
  const treatment = String(photo?.treatment || photo?.effect || photo?.filter || photoTreatment.value || '').toLowerCase()
  if (['silver', 'silver-bw', 'black-white', 'bw'].includes(treatment)) return 'treatment-silver'
  if (['soft-color', 'light-color', 'tint'].includes(treatment)) return 'treatment-tint'
  return ''
}

function goToGuide() {
  uni.switchTab({
    url: '/pages/guide/index',
    fail: (err) => {
      console.warn('相册打开路书失败:', err)
      uni.showToast({ title: '路书打开失败，请稍后重试', icon: 'none' })
    }
  })
}

function handleEmptyAction() {
  if (loadError.value) {
    loadAlbum(true)
  }
}

async function loadAlbum(force = false) {
  if (!userStore.weddingId || loading.value) return
  if (!force && photos.value.length > 0) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, force)
  } catch (err) {
    console.warn('相册加载失败:', err)
    loadError.value = err?.message || '相册加载失败'
  } finally {
    loading.value = false
  }
}

onShow(() => loadAlbum(false))
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
  width: 100%;
  white-space: nowrap;
  box-sizing: border-box;
}

.album-track {
  display: inline-flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 0 $page-gutter 36rpx;
}

.photo-item {
  position: relative;
  flex: 0 0 560rpx;
  width: 560rpx;
  @include photo-mount;
  box-sizing: border-box;
  animation: fadeInScale 0.5s $ease-out both;
  opacity: 0;
}

@for $i from 1 through 20 {
  .photo-item:nth-child(#{$i}) {
    animation-delay: #{$i * 0.06}s;
  }
}

.photo-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  filter: none;
}

.photo-image.treatment-silver {
  filter: grayscale(1) contrast(1.04);
}

.photo-image.treatment-tint {
  filter: saturate(0.86) contrast(0.96);
}

.photo-frame {
  position: relative;
  width: 100%;
  padding-top: $photo-ratio;
  overflow: hidden;
  background: $paper-deep;
}

.photo-caption {
  display: block;
  margin-top: 14rpx;
  color: $ink-soft;
  font-family: $font-num;
  font-size: 22rpx;
  line-height: 1.35;
  text-align: center;
  word-break: break-word;
}

.photo-corner {
  position: absolute;
  z-index: 2;
  top: -10rpx;
  width: 60rpx;
  height: 28rpx;
  border-top: 1rpx solid var(--theme-border, $line);
  opacity: 0.72;
  pointer-events: none;
}

.photo-corner.top-left {
  left: 18rpx;
  border-left: 1rpx solid var(--theme-border, $line);
}

.photo-corner.top-right {
  right: 18rpx;
  border-right: 1rpx solid var(--theme-border, $line);
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
  color: $ink-inverse;
  font-size: 26rpx;
}
.empty-action::after { border: none; }

.loading-state {
  text-align: center;
  padding: 120rpx;
  color: $text-muted;
  font-size: 28rpx;
}

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
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
    background: $photo-matte;
    border: 1rpx solid $line;
    box-shadow: $shadow-sm;
  }

  .empty-action {
    background: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, $ink-inverse);
  }
}
</style>
