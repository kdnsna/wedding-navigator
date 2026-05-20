<template>
  <view class="page">
    <view class="page-header">
      <text class="page-tag">ACCOUNT</text>
      <text class="page-title">账号与权益</text>
      <text class="page-sub">用微信身份绑定主人账号，后续可接手机号授权、模板付费和多婚礼工作区</text>
    </view>

    <view class="plan-card">
      <view>
        <text class="plan-kicker">CURRENT PLAN</text>
        <text class="plan-title">{{ userStore.planTier.label }}</text>
        <text class="plan-desc">{{ userStore.planTier.desc }}</text>
      </view>
      <text class="plan-status">体验期</text>
    </view>

    <view class="section">
      <text class="section-label">主人资料</text>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">称呼</text>
          <input class="form-input" v-model="form.nickname" placeholder="例如：新郎 / 新娘 / 策划师" />
        </view>
        <view class="form-group">
          <text class="form-label">手机号</text>
          <input class="form-input" v-model="form.phone" placeholder="用于主人端联系，不展示给宾客" type="number" />
        </view>
        <view class="form-group last">
          <text class="form-label">身份</text>
          <input class="form-input" v-model="form.role" placeholder="例如：主人 / 策划师 / 家人" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-label">权益边界</text>
      <view class="entitlement-list">
        <view
          class="entitlement-item"
          v-for="item in entitlementItems"
          :key="item.key"
        >
          <view>
            <text class="entitlement-title">{{ item.label }}</text>
            <text class="entitlement-desc">{{ item.desc }}</text>
          </view>
          <text class="entitlement-status" :class="{ active: item.enabled }">{{ item.enabled ? '已拥有' : '未开通' }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-label">婚礼工作区</text>
        <text class="section-count">{{ userStore.workspaces.length }} 个</text>
      </view>
      <view class="workspace-list" v-if="userStore.workspaces.length">
        <view class="workspace-item" v-for="workspace in userStore.workspaces" :key="workspace.weddingId">
          <view>
            <text class="workspace-title">{{ workspace.title }}</text>
            <text class="workspace-meta">{{ workspace.date || '未设置日期' }} · {{ workspace.status || 'draft' }}</text>
          </view>
          <text class="workspace-plan">{{ workspace.plan || 'free' }}</text>
        </view>
      </view>
      <view class="empty-card" v-else>
        <image class="empty-icon" src="/static/visuals/empty-guests.svg" mode="aspectFit" />
        <text class="empty-title">暂无工作区</text>
        <text class="empty-desc">创建婚礼后，这里会显示可运营的婚礼空间。</text>
      </view>
    </view>

    <view class="bottom-actions">
      <button class="action-btn primary" :loading="saving" :disabled="saving" @click="saveProfile">同步账号</button>
      <button class="action-btn" @click="goDiagnostics">发布诊断</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user.js'
import { syncOwnerProfile } from '@/composables/useCloud.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { ENTITLEMENT_LABELS } from '@/utils/commercial.js'
import { showError, showSuccess } from '@/utils/index.js'

const userStore = useUserStore()
const saving = ref(false)
const form = ref({ nickname: '', phone: '', role: '主人' })

const entitlementItems = computed(() => {
  const descMap = {
    premium_templates: '新中式、山东家宴、异地友好等方案模板',
    poster_pack: '多尺寸海报、朋友圈分享图和小程序码套装',
    remove_branding: '去除默认品牌露出，适合商业客户',
    workspace_multi: '同一账号管理多场婚礼'
  }
  return Object.keys(ENTITLEMENT_LABELS).map(key => ({
    key,
    label: ENTITLEMENT_LABELS[key],
    desc: descMap[key] || '',
    enabled: userStore.entitlements?.[key] === true
  }))
})

function loadFromUser() {
  form.value = {
    nickname: userStore.profile?.nickname || '',
    phone: userStore.profile?.phone || userStore.phone || '',
    role: userStore.profile?.role || '主人'
  }
}

async function refreshProfile(silent = true) {
  try {
    const res = await syncOwnerProfile()
    if (res?.success) {
      userStore.setOwnerProfile(res)
      loadFromUser()
    }
  } catch (err) {
    console.warn('同步主人账号失败:', err)
    if (!silent) showError(err.message || '同步失败，请检查云函数部署')
  }
}

async function saveProfile() {
  if (saving.value) return
  try {
    saving.value = true
    uni.showLoading({ title: '同步中...', mask: true })
    const res = await syncOwnerProfile({ ...form.value })
    if (!res?.success) throw new Error(res?.message || '同步失败')
    userStore.setOwnerProfile(res)
    loadFromUser()
    showSuccess('已同步云端')
  } catch (err) {
    console.error('保存主人资料失败:', err)
    showError(err.message || '同步失败，请检查云函数部署')
  } finally {
    saving.value = false
    uni.hideLoading()
  }
}

function goDiagnostics() {
  uni.navigateTo({ url: '/pages-owner/diagnostics/index' })
}

onShow(async () => {
  if (!useOwnerGuard()) return
  loadFromUser()
  await refreshProfile(true)
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $bg-color;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}
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
.page-sub {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
  line-height: 1.55;
  color: $text-secondary;
}
.plan-card {
  margin: 0 $page-gutter 42rpx;
  padding: 32rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}
.plan-card > view {
  min-width: 0;
}
.plan-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.52);
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.plan-title {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}
.plan-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.5;
  color: rgba(255,255,255,0.72);
}
.plan-status {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
  background: rgba(201,169,110,0.18);
  color: #F0D49A;
  font-size: 22rpx;
}
.section {
  padding: 0 $page-gutter;
  margin-bottom: 44rpx;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-label {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 20rpx;
}
.section-count {
  font-size: 24rpx;
  color: $text-muted;
}
.form-card,
.entitlement-list,
.workspace-list,
.empty-card {
  border-radius: $card-radius;
  background: $bg-surface;
  border: 1rpx solid $border-color;
  overflow: hidden;
}
.form-group {
  padding: 28rpx;
  border-bottom: 1rpx solid $border-color;
}
.form-group.last {
  border-bottom: none;
}
.form-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%;
  height: $control-height-sm;
  font-size: 30rpx;
  color: $text-primary;
}
.entitlement-item,
.workspace-item {
  min-height: $tap-min-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid $border-color;
}
.entitlement-item:last-child,
.workspace-item:last-child {
  border-bottom: none;
}
.entitlement-item > view,
.workspace-item > view {
  min-width: 0;
}
.entitlement-title,
.workspace-title {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.entitlement-desc,
.workspace-meta {
  display: block;
  font-size: 24rpx;
  line-height: 1.45;
  color: $text-secondary;
}
.entitlement-status,
.workspace-plan {
  flex-shrink: 0;
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-muted;
  font-size: 22rpx;
}
.entitlement-status.active {
  background: rgba(52,168,83,0.12);
  color: $color-success;
}
.empty-card {
  padding: 44rpx 30rpx;
  text-align: center;
}
.empty-icon {
  width: 132rpx;
  height: 132rpx;
  opacity: 0.72;
  margin-bottom: 12rpx;
}
.empty-title {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 8rpx;
}
.empty-desc {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.45;
}
.bottom-actions {
  position: fixed;
  left: $page-gutter;
  right: $page-gutter;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
}
.action-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 28rpx;
  font-weight: 500;
}
.action-btn.primary {
  background: $text-primary;
  color: #fff;
}
.action-btn::after {
  border: none;
}
.action-btn[disabled] {
  opacity: 0.62;
}
</style>
