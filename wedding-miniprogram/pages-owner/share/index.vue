<template>
  <PageShell
    class="share-page"
    kicker="SHARE"
    title="分享设置"
    desc="配置微信转发卡片、小程序码和分享海报，让邀请入口随时可发布。"
  >

    <!-- 小程序码 -->
    <view class="qrcode-section">
      <view class="qrcode-box">
        <image class="qrcode-image" v-if="qrCodePath" :src="qrCodePath" mode="aspectFit" />
        <view class="qrcode-state" v-else>
          <text class="qrcode-placeholder">{{ qrLoading ? '生成中' : '小程序码' }}</text>
          <text class="qrcode-hint">{{ qrError || '部署后自动生成' }}</text>
        </view>
      </view>
      <text class="qrcode-tip">微信扫一扫，查看婚礼邀请</text>
      <button class="qrcode-refresh" :loading="qrLoading" :disabled="qrLoading" @click="refreshQrCode">重新生成小程序码</button>
    </view>

    <!-- 分享卡片设置 -->
    <view class="section">
      <SectionHeader
        title="分享卡片"
        kicker="WECHAT CARD"
        desc="标题建议控制在 28 字内，描述建议控制在 48 字内。"
        compact
      />
      <view class="form-group">
        <view class="form-label-row">
          <text class="form-sub-label">标题</text>
          <text class="char-hint">{{ titleLength }}/28</text>
        </view>
        <input class="form-input" v-model="shareForm.title" maxlength="28" placeholder="例如：张三&李四的婚礼邀请" />
      </view>
      <view class="form-group">
        <view class="form-label-row">
          <text class="form-sub-label">描述</text>
          <text class="char-hint">{{ descLength }}/48</text>
        </view>
        <input class="form-input" v-model="shareForm.description" maxlength="48" placeholder="例如：2026年11月14日，我们结婚啦！" />
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="share-actions">
      <button class="share-btn primary" open-type="share" :disabled="!weddingId">
        分享给微信好友
      </button>
      <ActionCard title="生成分享海报" desc="制作适合转发到群聊、朋友圈或线下展示的婚礼海报" icon="/static/visuals/icon-poster.svg" @click="goToPoster" />
      <ActionCard title="复制小程序路径" :desc="miniProgramPath" icon="/static/visuals/icon-share.svg" @click="copyPath" />
    </view>

    <BottomActionBar
      primary-text="保存设置"
      secondary-text="重新生成码"
      :loading="saving"
      :secondary-loading="qrLoading"
      :primary-disabled="!weddingId"
      :secondary-disabled="!weddingId"
      @primary="saveShareSettings"
      @secondary="refreshQrCode"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import ActionCard from '@/components/ui/ActionCard.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { generatePoster, recordShare, updateWedding } from '@/composables/useCloud.js'
import { resolveImagePath } from '@/utils/imagePaths.js'

const store = useWeddingStore()
const userStore = useUserStore()

const shareForm = ref({ title: '', description: '' })
const saving = ref(false)
const qrCodePath = ref('')
const qrLoading = ref(false)
const qrError = ref('')

const weddingId = computed(() => userStore.weddingId)
const encodedWeddingId = computed(() => encodeURIComponent(weddingId.value || ''))
const titleLength = computed(() => String(shareForm.value.title || '').length)
const descLength = computed(() => String(shareForm.value.description || '').length)
const miniProgramPath = computed(() => weddingId.value ? `/pages/index/index?id=${encodedWeddingId.value}` : '创建婚礼后自动生成')

function loadFromStore() {
  const cfg = store.wedding?.share_config || {}
  shareForm.value.title = cfg.title || `${store.coupleName}的婚礼邀请`
  shareForm.value.description = cfg.description || `${store.weddingDate}，我们结婚啦！诚邀您的见证~`
}

function copyPath() {
  if (!weddingId.value) {
    uni.showToast({ title: '请先创建婚礼', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: miniProgramPath.value,
    success: () => showSuccess('已复制'),
    fail: (err) => {
      console.warn('复制小程序路径失败:', err)
      showError('复制失败，请手动复制')
    }
  })
}

function goToPoster() {
  if (!weddingId.value) {
    showError('请先创建婚礼')
    return
  }
  uni.navigateTo({
    url: `/pages/poster/index?id=${encodedWeddingId.value}`,
    fail: (err) => {
      console.warn('打开分享海报失败:', err)
      showError('海报页打开失败，请稍后重试')
    }
  })
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
  const title = shareForm.value.title.trim() || `${store.coupleName}的婚礼邀请`
  const description = shareForm.value.description.trim() || `${store.weddingDate}，我们结婚啦！诚邀您的见证~`
  if (title.length > 28) {
    showError('分享标题请控制在 28 字内')
    return
  }
  if (description.length > 48) {
    showError('分享描述请控制在 48 字内')
    return
  }
  const shareConfig = {
    ...(store.wedding?.share_config || {}),
    title,
    description
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
    showSuccess('已同步云端')
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
  recordShare(weddingId.value).catch((err) => {
    console.warn('分享记录失败:', err)
  })
  return {
    title: shareForm.value.title.trim() || `${store.coupleName}的婚礼邀请`,
    path: `/pages/index/index?id=${encodedWeddingId.value}`,
    desc: shareForm.value.description.trim() || `${store.weddingDate}，我们结婚啦！诚邀您的见证~`
  }
})

onShow(async () => {
  if (!(await useOwnerGuard())) return
  loadFromStore()
  if (!qrCodePath.value && weddingId.value) refreshQrCode()
})
</script>

<style lang="scss" scoped>
.share-page {
  background-color: $bg-color;
  min-height: 100vh;
}

/* 小程序码 */
.qrcode-section {
  text-align: center;
  padding: $page-gutter;
}
.qrcode-box {
  width: 280rpx;
  height: 280rpx;
  margin: 0 auto 32rpx;
  background: $bg-muted;
  border-radius: $card-radius;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.qrcode-image {
  width: 240rpx;
  height: 240rpx;
}
.qrcode-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}
.qrcode-placeholder {
  font-size: 28rpx;
  color: $text-secondary;
  margin-bottom: 8rpx;
}
.qrcode-hint {
  font-size: 22rpx;
  color: $text-muted;
  line-height: 1.4;
  text-align: center;
}
.qrcode-tip {
  font-size: 26rpx;
  color: $text-secondary;
}
.qrcode-refresh {
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  margin: 24rpx auto 0;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
}
.qrcode-refresh::after { border: none; }
.qrcode-refresh[disabled] { opacity: 0.62; }

/* 表单 */
.section {
  padding: 0;
  margin-bottom: 48rpx;
}
.form-group {
  margin: 0 $page-gutter 24rpx;
}
.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.form-sub-label {
  font-size: 24rpx;
  color: $text-muted;
}
.char-hint {
  font-size: 22rpx;
  color: $text-muted;
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

/* 分享按钮 */
.share-actions {
  padding: 0 $page-gutter;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 34rpx;
}
.share-btn {
  width: 100%;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.share-btn::after { border: none; }
.share-btn:active { opacity: 0.8; }
.share-btn.primary {
  background: $text-primary;
  color: #fff;
}
</style>
