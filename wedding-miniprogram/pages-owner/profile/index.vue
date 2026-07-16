<template>
  <PageShell
    class="profile-page"
    kicker="ACCOUNT"
    title="账号与权益"
    desc="用微信身份绑定主人账号，后续可接手机号授权、模板付费和多婚礼工作区。"
  >

    <view class="plan-card">
      <view>
        <text class="plan-kicker">CURRENT PLAN</text>
        <text class="plan-title">{{ userStore.planTier.label }}</text>
        <text class="plan-desc">{{ userStore.planTier.desc }}</text>
      </view>
      <text class="plan-status">体验期</text>
    </view>

    <view class="section">
      <SectionHeader title="主人资料" kicker="PROFILE" desc="这些信息仅用于主人端管理，不展示给宾客。" compact />
      <view class="form-card">
        <view class="form-group">
          <view class="form-label-row">
            <text class="form-label">称呼</text>
            <text class="char-hint">{{ (form.nickname || '').length }}/20</text>
          </view>
          <input class="form-input" v-model="form.nickname" maxlength="20" placeholder="例如：新郎 / 新娘 / 策划师" />
        </view>
        <view class="form-group">
          <text class="form-label">手机号</text>
          <input class="form-input" v-model="form.phone" placeholder="用于主人端联系，不展示给宾客" type="number" maxlength="20" />
        </view>
        <view class="form-group last">
          <view class="form-label-row">
            <text class="form-label">身份</text>
            <text class="char-hint">{{ (form.role || '').length }}/12</text>
          </view>
          <input class="form-input" v-model="form.role" maxlength="12" placeholder="例如：主人 / 策划师 / 家人" />
        </view>
      </view>
    </view>

    <view class="section">
      <SectionHeader title="权益边界" kicker="PLAN" desc="当前保留商业化字段，不在本轮新增付费拦截。" compact />
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
      <SectionHeader title="婚礼工作区" kicker="WORKSPACES" :desc="`${userStore.workspaces.length} 个可管理婚礼空间`" compact />
      <view class="workspace-list" v-if="userStore.workspaces.length">
        <view
          class="workspace-item"
          :class="{ active: isActiveWorkspace(workspace) }"
          hover-class="workspace-item-pressed"
          v-for="workspace in userStore.workspaces"
          :key="workspace.weddingId"
          @click="selectWorkspace(workspace)"
        >
          <view class="workspace-copy">
            <text class="workspace-title">{{ workspace.title || '未具名婚书' }}</text>
            <text class="workspace-meta">{{ workspace.date || '婚期未定' }} · {{ workspaceStatus(workspace.status) }}</text>
          </view>
          <view class="workspace-side">
            <text class="workspace-plan" :class="{ active: isActiveWorkspace(workspace) }">{{ isActiveWorkspace(workspace) ? '当前' : planLabel(workspace.plan) }}</text>
            <image class="workspace-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
          </view>
        </view>
      </view>
      <EmptyState
        v-else
        icon="/static/visuals/empty-guests.svg"
        title="暂无工作区"
        desc="创建婚礼后，这里会显示可运营的婚礼空间。"
      />
    </view>

    <BottomActionBar
      primary-text="同步账号"
      secondary-text="发布诊断"
      :loading="saving"
      :secondary-disabled="saving"
      @primary="saveProfile"
      @secondary="goDiagnostics"
    />
  </PageShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { syncOwnerProfile } from '@/composables/useCloud.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { ENTITLEMENT_LABELS } from '@/utils/commercial.js'
import { showError, showSuccess } from '@/utils/index.js'

const userStore = useUserStore()
const weddingStore = useWeddingStore()
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

function isValidPhone(phone) {
  if (!phone) return true
  return /^\d{6,20}$/.test(String(phone).trim())
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
  if ((form.value.nickname || '').trim().length > 20) {
    showError('称呼请控制在 20 字内')
    return
  }
  if ((form.value.role || '').trim().length > 12) {
    showError('身份请控制在 12 字内')
    return
  }
  if (form.value.phone && !isValidPhone(form.value.phone)) {
    showError('请输入有效手机号')
    return
  }
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
  uni.navigateTo({
    url: '/pages-owner/diagnostics/index',
    fail: (err) => {
      console.warn('打开发布诊断失败:', err)
      showError('发布诊断打开失败，请稍后重试')
    }
  })
}

function isActiveWorkspace(workspace) {
  return String(workspace?.weddingId || '') === String(userStore.ownerActiveWeddingId || '')
}

function workspaceStatus(status) {
  const labels = { published: '已寄出', active: '筹备中', draft: '草稿' }
  return labels[String(status || '').toLowerCase()] || '筹备中'
}

function planLabel(plan) {
  return String(plan || '').toLowerCase() === 'free' ? '免费版' : '高级版'
}

function selectWorkspace(workspace) {
  const weddingId = String(workspace?.weddingId || '')
  if (!weddingId || isActiveWorkspace(workspace)) return
  userStore.setOwnerActiveWeddingId(weddingId)
  weddingStore.setWeddingData({})
  showSuccess('已切换婚书')
  setTimeout(() => {
    uni.navigateBack({
      fail: () => uni.redirectTo({ url: '/pages-owner/manage/index' })
    })
  }, 240)
}

onShow(async () => {
  if (!(await useOwnerGuard({ allowNoWedding: true }))) return
  loadFromUser()
  await refreshProfile(true)
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: $bg-color;
}
.plan-card {
  margin: 0 $page-gutter 42rpx;
  padding: 32rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: $ink-inverse;
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
  font-size: 20rpx;
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
  color: $gold;
  font-size: 24rpx;
}
.section {
  padding: 0 $page-gutter;
  margin-bottom: 44rpx;
}
.form-card,
.entitlement-list,
.workspace-list {
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
  font-size: 24rpx;
  color: $text-muted;
}
.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.form-group > .form-label {
  display: block;
  margin-bottom: 12rpx;
}
.char-hint {
  font-size: 24rpx;
  color: $text-muted;
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
.workspace-item.active { background: var(--accent-soft); }
.workspace-item-pressed { background: $paper-deep; }
.entitlement-item > view,
.workspace-item > view {
  min-width: 0;
}
.workspace-copy { flex: 1; }
.workspace-side { display: flex; align-items: center; gap: $sp-2; flex-shrink: 0; }
.workspace-arrow { width: 28rpx; height: 28rpx; opacity: 0.42; }
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
  font-size: 24rpx;
}
.entitlement-status.active {
  background: rgba(52,168,83,0.12);
  color: $color-success;
}
.workspace-plan.active {
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
