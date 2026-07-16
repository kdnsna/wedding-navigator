<template>
  <PageShell
    title="婚纱相册"
    kicker="ALBUM"
    desc="精选影像 · 银盐相册"
    :theme-class="templateClass"
  >
    <scroll-view class="album-container" :class="`layout-${activeVisualPreset.albumLayout}`" scroll-x enhanced :show-scrollbar="false" v-if="photos.length > 0">
      <view class="album-track">
        <view
          class="photo-item"
          v-for="(photo, index) in photos"
          :key="photo.id || photo.url"
          :class="[`photo-index-${index % 3}`, { cover: photo.type === 'cover' }]"
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
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useGuestInvitationStore } from '@/stores/guest-invitation.js'
import { fetchGuestInvitation } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const store = useWeddingStore()
const guestStore = useGuestInvitationStore()
const loading = ref(false)
const loadError = ref('')
const MAX_ALBUM_PHOTOS = 9

const photos = computed(() => (store.album?.photos || []).slice(0, MAX_ALBUM_PHOTOS))
const templateClass = computed(() => store.templateClass)
const activeVisualPreset = computed(() => store.activeVisualPreset)
const photoTreatment = computed(() => store.invitation?.photo_treatment || 'original')
const emptyText = computed(() => {
  if (!guestStore.invitationId) return '这封信还没有抵达'
  if (loadError.value) return '这一页暂时没翻开'
  return '影像这一章，留给相见时慢慢翻开'
})
const emptySub = computed(() => {
  if (!guestStore.invitationId) return '从新人寄来的请柬进入后，这一章会铺开'
  if (loadError.value) return '稍后再翻，这一页会重新铺开'
  return ''
})
const albumActionText = computed(() => {
  if (!guestStore.invitationId) return ''
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
  if (!guestStore.invitationId || loading.value) return
  if (!force && photos.value.length > 0) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchGuestInvitation(guestStore.invitationId)
  } catch (err) {
    console.warn('相册读取受阻:', err)
    loadError.value = '稍后再翻，这一页会重新铺开'
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  const weddingId = String(options?.id || '')
  if (!weddingId) return
  const cached = guestStore.hydrate(weddingId)
  if (cached) store.setWeddingData(cached, weddingId)
})

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
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  font-size: 24rpx;
  color: $text-muted;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  margin-bottom: 18rpx;
  font-weight: 500;
}
.page-tag::before {
  content: '';
  width: 24rpx;
  height: 1rpx;
  background: currentColor;
  opacity: 0.5;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: $tracking-cn;
  line-height: 1.25;
}
.page-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.65;
  letter-spacing: $tracking-cn-soft;
  position: relative;
  padding-left: 20rpx;
}
.page-desc::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12rpx;
  bottom: 12rpx;
  width: 2rpx;
  background: $text-primary;
  opacity: 0.5;
  border-radius: 2rpx;
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
.layout-contact-sheet .album-track {
  display: grid;
  grid-template-columns: repeat(3, 320rpx);
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: column;
  align-items: start;
}
.layout-contact-sheet .photo-item {
  width: 320rpx;
}
.layout-contact-sheet .photo-frame {
  padding-top: 75%;
}
.layout-editorial-spread .photo-item {
  width: 520rpx;
}
.layout-editorial-spread .photo-index-1 {
  width: 360rpx;
  margin-top: $sp-6;
}
.layout-editorial-spread .photo-frame {
  padding-top: 125%;
}
.layout-editorial-spread .photo-index-1 .photo-frame {
  padding-top: 100%;
}
.layout-ceremony-scroll .photo-item {
  width: 440rpx;
  border-radius: 2rpx;
}
.layout-ceremony-scroll .photo-frame {
  padding-top: 125%;
}
.layout-night-sequence .photo-item {
  width: 520rpx;
  border-color: var(--accent-line);
}
.layout-night-sequence .photo-frame {
  padding-top: 62.5%;
}

.photo-item {
  position: relative;
  flex: 0 0 560rpx;
  width: 560rpx;
  @include photo-mount;
  box-sizing: border-box;
  animation: fadeInScale 0.5s $ease-out both;
  opacity: 0;
  transition: transform 0.3s $ease-editorial, box-shadow 0.3s $ease-editorial;
  cursor: pointer;
  position: relative;
}
.photo-item:active {
  transform: scale(0.98);
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
  font-size: 24rpx;
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
  padding: 160rpx 60rpx 200rpx;
}
.empty-visual {
  width: 220rpx;
  height: 220rpx;
  margin: 0 auto 40rpx;
  display: block;
  filter: grayscale(0.05);
}
.empty-text {
  display: block;
  font-size: 30rpx;
  color: $text-muted;
  letter-spacing: $tracking-cn-soft;
}
.empty-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-placeholder;
  letter-spacing: $tracking-cn-soft;
}
.empty-action {
  margin-top: 36rpx;
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 26rpx;
  letter-spacing: $tracking-kicker;
  font-weight: 500;
  transition: opacity 0.25s $ease-editorial, transform 0.25s $ease-editorial;
}
.empty-action:active {
  opacity: 0.85;
  transform: scale(0.98);
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
