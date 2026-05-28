<template>
  <view class="page">
    <view class="page-header">
      <text class="page-tag">PUBLISH</text>
      <text class="page-title">发布中心</text>
      <text class="page-desc">把朋友圈、微信群、长辈邀请和海报一次准备好</text>
    </view>

    <view class="publish-card">
      <view class="publish-head">
        <view>
          <text class="publish-kicker">MINI PROGRAM CODE</text>
          <text class="publish-title">小程序码</text>
        </view>
        <button class="mini-btn" :loading="qrLoading" :disabled="qrLoading" @click="refreshQrCode">刷新</button>
      </view>
      <view class="qrcode-row">
        <view class="qrcode-box">
          <image class="qrcode-image" v-if="qrCodePath" :src="qrCodePath" mode="aspectFit" />
          <view class="qrcode-state" v-else>
            <text class="qrcode-placeholder">{{ qrLoading ? '生成中' : '小程序码' }}</text>
            <text class="qrcode-hint">{{ qrError || '发布后自动生成' }}</text>
          </view>
        </view>
        <view class="qrcode-meta">
          <text class="qrcode-title">{{ store.coupleName || '新人婚礼' }}</text>
          <text class="qrcode-sub">{{ formatDate(store.weddingDate) || '婚期待定' }} · {{ store.venueName || '婚礼场地' }}</text>
          <button class="outline-btn" @click="copyPath">复制小程序路径</button>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-label">发布前检查</text>
      <view class="check-list">
        <view class="check-item" v-for="item in publishChecks" :key="item.key">
          <text class="check-mark" :class="{ done: item.done }">{{ item.done ? '✓' : '!' }}</text>
          <view>
            <text class="check-title">{{ item.title }}</text>
            <text class="check-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-label">微信分享卡片</text>
      <view class="template-tags" v-if="activeTemplate.audienceTags?.length">
        <text class="template-tag" v-for="tag in activeTemplate.audienceTags" :key="tag">{{ tag }}</text>
      </view>
      <view class="form-group">
        <text class="form-sub-label">标题</text>
        <input class="form-input" v-model="shareForm.title" placeholder="例如：张三&李四的婚礼邀请" />
      </view>
      <view class="form-group">
        <text class="form-sub-label">描述</text>
        <input class="form-input" v-model="shareForm.description" placeholder="例如：2026年11月14日，我们结婚啦！" />
      </view>
      <view class="segmented">
        <view
          class="segment"
          v-for="mode in coverModes"
          :key="mode.value"
          :class="{ active: shareForm.share_cover_mode === mode.value }"
          @click="shareForm.share_cover_mode = mode.value"
        >
          <text>{{ mode.label }}</text>
        </view>
      </view>
      <text class="field-hint">{{ activeTemplate.coverGuidance }}</text>
    </view>

    <view class="section">
      <text class="section-label">朋友圈/群聊文案</text>
      <view class="copy-block">
        <view class="copy-head">
          <text class="copy-title">朋友圈文案</text>
          <button class="copy-btn" @click="copyShareText('moments_text')">复制</button>
        </view>
        <textarea class="copy-textarea" v-model="shareForm.moments_text" maxlength="180" />
      </view>
      <view class="copy-block">
        <view class="copy-head">
          <text class="copy-title">微信群文案</text>
          <button class="copy-btn" @click="copyShareText('group_text')">复制</button>
        </view>
        <textarea class="copy-textarea" v-model="shareForm.group_text" maxlength="220" />
      </view>
      <view class="copy-block">
        <view class="copy-head">
          <text class="copy-title">长辈正式文案</text>
          <button class="copy-btn" @click="copyShareText('formal_text')">复制</button>
        </view>
        <textarea class="copy-textarea" v-model="shareForm.formal_text" maxlength="220" />
      </view>
    </view>

    <view class="section">
      <text class="section-label">海报样式</text>
      <view class="poster-options">
        <view
          class="poster-option"
          v-for="variant in posterVariants"
          :key="variant.id"
          :class="{ active: shareForm.poster_variant === variant.id }"
          @click="shareForm.poster_variant = variant.id"
        >
          <text class="poster-name">{{ variant.name }}</text>
          <text class="poster-desc">{{ variant.desc }}</text>
        </view>
      </view>
      <input class="form-input poster-image-input" v-model="shareForm.poster_image" placeholder="可选：自定义海报封面 cloud:// 或 https:// 图片" />
      <button class="share-btn" @click="goToPoster">预览并保存海报</button>
    </view>

    <view class="privacy-note">
      <image class="privacy-icon" src="/static/visuals/icon-warning.svg" mode="aspectFit" />
      <view>
        <text class="privacy-title">隐私友好统计</text>
        <text class="privacy-desc">甜囍手册只记录浏览、分享、海报保存等聚合数据，不展示谁看过、看几次或转发给谁。</text>
      </view>
    </view>

    <view class="share-actions">
      <button class="share-btn primary" :loading="saving" :disabled="saving" @click="saveShareSettings">保存发布设置</button>
      <button class="share-btn primary alt" open-type="share">分享给微信好友</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showError, showSuccess, formatDate } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { generatePoster, recordShare, updateWedding } from '@/composables/useCloud.js'
import { resolveImagePath } from '@/utils/imagePaths.js'
import { buildDefaultShareConfig, getWeddingTemplate } from '@/utils/templates.js'

const store = useWeddingStore()
const userStore = useUserStore()

const shareForm = ref({
  title: '',
  description: '',
  cover_image: '',
  moments_text: '',
  group_text: '',
  formal_text: '',
  poster_variant: 'classic',
  poster_image: '',
  share_cover_mode: 'auto'
})
const saving = ref(false)
const qrCodePath = ref('')
const qrLoading = ref(false)
const qrError = ref('')

const weddingId = computed(() => userStore.weddingId)
const activeTemplate = computed(() => getWeddingTemplate(store.invitation?.template))
const posterVariants = computed(() => activeTemplate.value?.posterVariants || [])
const hasAlbumCover = computed(() => Boolean((store.album?.photos || []).some(p => p.type === 'cover') || store.album?.photos?.[0]?.url))
const publishChecks = computed(() => [
  {
    key: 'basic',
    title: '新人姓名和婚期',
    desc: store.coupleName?.replace('&', '').trim() && store.weddingDate ? '首屏信息完整' : '请先补齐新人姓名和婚期',
    done: Boolean(store.coupleName?.replace('&', '').trim() && store.weddingDate)
  },
  {
    key: 'cover',
    title: '朋友圈封面',
    desc: hasAlbumCover.value ? '已有相册封面，可直接发布' : '暂无相册封面，将使用模板封面',
    done: hasAlbumCover.value || Boolean(activeTemplate.value?.defaultHero)
  },
  {
    key: 'venue',
    title: '场地与路线',
    desc: store.venueName ? '宾客可查看路线信息' : '建议补充主场地名称和地址',
    done: Boolean(store.venueName)
  },
  {
    key: 'copy',
    title: '三类分享文案',
    desc: shareForm.value.moments_text && shareForm.value.group_text && shareForm.value.formal_text ? '朋友圈、群聊、正式邀请均已准备' : '保存前请检查分享文案',
    done: Boolean(shareForm.value.moments_text && shareForm.value.group_text && shareForm.value.formal_text)
  }
])
const coverModes = [
  { label: '自动封面', value: 'auto' },
  { label: '相册封面', value: 'album' },
  { label: '模板封面', value: 'template' }
]

function buildFallbackShareConfig() {
  return buildDefaultShareConfig(store.invitation?.template, {
    groomName: store.invitation?.couple?.groom?.name,
    brideName: store.invitation?.couple?.bride?.name,
    date: store.weddingDate,
    venueName: store.venueName
  })
}

function loadFromStore() {
  const defaults = buildFallbackShareConfig()
  const cfg = store.wedding?.share_config || {}
  shareForm.value = {
    ...defaults,
    ...cfg,
    title: cfg.title || defaults.title,
    description: cfg.description || defaults.description,
    moments_text: cfg.moments_text || defaults.moments_text,
    group_text: cfg.group_text || defaults.group_text,
    formal_text: cfg.formal_text || defaults.formal_text,
    poster_variant: cfg.poster_variant || defaults.poster_variant,
    poster_image: cfg.poster_image || defaults.poster_image,
    share_cover_mode: cfg.share_cover_mode || defaults.share_cover_mode
  }
}

function copyShareText(key) {
  const text = (shareForm.value[key] || '').trim()
  if (!text) {
    showError('暂无可复制文案')
    return
  }
  uni.setClipboardData({ data: text, success: () => showSuccess('文案已复制') })
}

function copyPath() {
  if (!weddingId.value) {
    uni.showToast({ title: '请先创建婚礼', icon: 'none' })
    return
  }
  const path = `pages/index/index?id=${weddingId.value}`
  uni.setClipboardData({ data: path, success: () => showSuccess('路径已复制') })
}

function goToPoster() {
  if (!weddingId.value) {
    showError('请先创建婚礼')
    return
  }
  uni.navigateTo({ url: '/pages/poster/index' })
}

async function refreshQrCode() {
  if (qrLoading.value) return
  if (!weddingId.value) {
    showError('请先创建婚礼')
    return
  }
  qrLoading.value = true
  qrError.value = ''
  try {
    const res = await generatePoster('pages/index/index', weddingId.value, 430)
    if (res?.success && res.data) {
      qrCodePath.value = await resolveImagePath(res.data, 'share_qr')
      if (!qrCodePath.value) {
        qrError.value = '小程序码已生成，但本地预览失败'
      }
    } else {
      qrCodePath.value = ''
      qrError.value = res?.message || '小程序码生成失败'
    }
  } catch (err) {
    console.error('小程序码生成失败:', err)
    qrCodePath.value = ''
    qrError.value = err?.result?.message || err?.message || '小程序码生成失败，请检查 generatePoster 云函数'
  } finally {
    qrLoading.value = false
  }
}

async function saveShareSettings() {
  if (saving.value) return
  if (!weddingId.value) {
    showError('请先创建婚礼')
    return
  }
  const shareConfig = {
    ...(store.wedding?.share_config || {}),
    title: shareForm.value.title.trim() || buildFallbackShareConfig().title,
    description: shareForm.value.description.trim() || buildFallbackShareConfig().description,
    cover_image: shareForm.value.cover_image || '',
    moments_text: shareForm.value.moments_text.trim(),
    group_text: shareForm.value.group_text.trim(),
    formal_text: shareForm.value.formal_text.trim(),
    poster_variant: shareForm.value.poster_variant || 'classic',
    poster_image: shareForm.value.poster_image.trim(),
    share_cover_mode: shareForm.value.share_cover_mode || 'auto'
  }
  saving.value = true
  try {
    await updateWedding(weddingId.value, 'weddings', { share_config: shareConfig })
    store.updateWeddingField('share_config', shareConfig)
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[weddingId.value]) {
      weddings[weddingId.value].share_config = shareConfig
      uni.setStorageSync('weddings', weddings)
    }
    showSuccess('发布设置已保存')
  } catch (err) {
    console.error('分享设置保存失败:', err)
    showError(err?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onShareAppMessage(() => {
  if (!weddingId.value) {
    return { title: '甜囍手册', path: '/pages-owner/wizard/index' }
  }
  recordShare(weddingId.value, 'friend').catch(() => {})
  return {
    title: shareForm.value.title,
    path: `/pages/index/index?id=${weddingId.value}`,
    desc: shareForm.value.description
  }
})

onShow(() => {
  useOwnerGuard()
  loadFromStore()
  if (!qrCodePath.value && weddingId.value) refreshQrCode()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(112rpx + env(safe-area-inset-bottom));
}
.page-header {
  padding: $page-header-top $page-gutter 28rpx;
}
.page-tag,
.publish-kicker {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
}
.page-desc {
  display: block;
  margin-top: 12rpx;
  font-size: $font-body;
  color: $text-secondary;
  line-height: 1.5;
}
.publish-card,
.privacy-note {
  margin: 0 $page-gutter 28rpx;
  padding: 28rpx;
  border-radius: $card-radius;
  background: $bg-surface;
  box-shadow: $shadow-sm;
}
.publish-head,
.copy-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}
.publish-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}
.mini-btn,
.copy-btn,
.outline-btn {
  height: $control-height-sm;
  line-height: $control-height-sm;
  padding: 0 24rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
}
.mini-btn::after,
.copy-btn::after,
.outline-btn::after { border: none; }
.qrcode-row {
  display: flex;
  gap: 24rpx;
  margin-top: 24rpx;
  align-items: center;
}
.qrcode-box {
  width: 220rpx;
  height: 220rpx;
  background: $bg-muted;
  border-radius: $card-radius;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.qrcode-image {
  width: 188rpx;
  height: 188rpx;
}
.qrcode-state {
  padding: 20rpx;
  text-align: center;
}
.qrcode-placeholder,
.qrcode-title {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 600;
}
.qrcode-hint,
.qrcode-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $text-muted;
  line-height: 1.4;
}
.qrcode-meta {
  flex: 1;
  min-width: 0;
}
.outline-btn {
  margin-top: 18rpx;
  width: 220rpx;
}
.section {
  padding: 0 $page-gutter;
  margin-bottom: 36rpx;
}
.section-label {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 22rpx;
}
.check-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.check-item {
  display: flex;
  gap: 18rpx;
  padding: 22rpx 24rpx;
  border-radius: $card-radius;
  background: $bg-surface;
}
.check-mark {
  width: 38rpx;
  height: 38rpx;
  line-height: 38rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(201,169,110,0.16);
  color: #8F6100;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}
.check-mark.done {
  background: $text-primary;
  color: #fff;
}
.check-title,
.check-desc {
  display: block;
}
.check-title {
  font-size: 27rpx;
  color: $text-primary;
  font-weight: 600;
}
.check-desc {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: $text-muted;
  line-height: 1.45;
}
.form-group {
  margin-bottom: 24rpx;
}
.form-sub-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%;
  height: $control-height;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  background: transparent;
  box-sizing: border-box;
}
.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 22rpx;
}
.template-tag {
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 22rpx;
}
.field-hint {
  display: block;
  margin-top: 14rpx;
  font-size: 23rpx;
  color: $text-muted;
  line-height: 1.5;
}
.segmented,
.poster-options {
  display: flex;
  gap: 12rpx;
}
.segment {
  flex: 1;
  min-width: 0;
  height: $control-height-sm;
  line-height: $control-height-sm;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 24rpx;
}
.segment.active {
  background: $text-primary;
  color: #fff;
}
.copy-block {
  padding: 24rpx;
  border-radius: $card-radius;
  background: $bg-surface;
  margin-bottom: 18rpx;
}
.copy-title {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 600;
}
.copy-textarea {
  width: 100%;
  min-height: 132rpx;
  margin-top: 18rpx;
  padding: 18rpx;
  border-radius: $card-radius;
  background: $bg-muted;
  color: $text-primary;
  font-size: 27rpx;
  line-height: 1.5;
}
.poster-options {
  flex-direction: column;
}
.poster-option {
  padding: 22rpx 24rpx;
  border-radius: $card-radius;
  background: $bg-surface;
  border: 2rpx solid transparent;
}
.poster-option.active {
  border-color: $text-primary;
  box-shadow: $shadow-sm;
}
.poster-name,
.poster-desc {
  display: block;
}
.poster-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}
.poster-desc {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: $text-muted;
  line-height: 1.45;
}
.poster-image-input {
  margin: 24rpx 0;
}
.privacy-note {
  display: flex;
  gap: 18rpx;
  background: #fff8f1;
  border: 1rpx solid rgba(201,169,110,0.32);
}
.privacy-icon {
  width: 42rpx;
  height: 42rpx;
  flex-shrink: 0;
}
.privacy-title {
  display: block;
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 600;
}
.privacy-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: $text-secondary;
  line-height: 1.5;
}
.share-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx $page-gutter calc(18rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
  background: rgba(255,255,255,0.96);
  box-shadow: 0 -8rpx 28rpx rgba(0,0,0,0.06);
}
.share-btn {
  width: 100%;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 29rpx;
  color: $text-primary;
  font-weight: 500;
}
.share-btn::after { border: none; }
.share-btn.primary {
  background: $text-primary;
  color: #fff;
}
.share-btn.alt {
  background: $color-primary;
}
</style>
