<template>
  <PageShell
    class="diagnostics-page"
    kicker="RELEASE CHECK"
    title="发布诊断"
    desc="把上线前最容易遗漏的云环境、路书、分享、隐私和模板权益集中检查。"
  >

    <view class="summary-card" :class="{ ready: diagnostics.ready }">
      <view>
        <text class="summary-kicker">READINESS</text>
        <text class="summary-title">{{ diagnostics.ready ? '可发布' : '需补齐' }}</text>
        <text class="summary-desc">{{ summaryText }}</text>
      </view>
      <text class="summary-score">{{ diagnostics.percent }}%</text>
    </view>

    <MetricStrip :items="diagnosticMetrics" />

    <AiSuggestionPanel
      title="AI 下一步"
      desc="把阻断项、建议项和人工确认项浓缩成三件可执行任务。"
      generate-text="生成建议"
      empty-text="点击生成，获得发布前最应该先做的三件事。"
      :suggestions="aiSuggestions"
      :warnings="aiWarnings"
      :error="aiError"
      :loading="aiLoading"
      :disabled="loading"
      @generate="generateDiagnosticsAdvice"
      @apply="copyDiagnosticsAdvice"
    />

    <EmptyState
      v-if="loadError"
      icon="/static/visuals/icon-warning.svg"
      title="诊断刷新失败"
      :desc="loadError"
    />

    <view class="diagnostic-section" v-if="!loadError">
      <SectionHeader
        title="发布项"
        kicker="CHECKLIST"
        desc="点击每一项可直接进入对应处理页面。"
        compact
      />
    </view>

    <view class="diagnostic-list" v-if="!loadError">
      <view
        class="diagnostic-item"
        v-for="item in diagnostics.items"
        :key="item.key"
        @click="goItem(item)"
      >
        <view class="status-dot" :class="item.status" />
        <view class="diagnostic-meta">
          <view class="diagnostic-head">
            <text class="diagnostic-title">{{ item.title }}</text>
            <text class="diagnostic-status" :class="item.status">{{ statusText(item.status) }}</text>
          </view>
          <text class="diagnostic-desc">{{ item.desc }}</text>
        </view>
        <text class="diagnostic-action" v-if="item.route">{{ item.actionText || '去处理' }}</text>
      </view>
    </view>

    <view class="note-card">
      <text class="note-title">上线前人工验收</text>
      <text class="note-copy">建议最后用真机完整走一遍：创建婚礼、上传封面、补场地坐标、提交 RSVP、写祝福、分享好友、生成海报、删除婚礼后旧链接失效。</text>
    </view>

    <BottomActionBar
      primary-text="重新检查"
      secondary-text="返回后台"
      :loading="loading"
      @primary="refreshDiagnostics"
      @secondary="goManage"
    />
  </PageShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import MetricStrip from '@/components/ui/MetricStrip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import AiSuggestionPanel from '@/components/ui/AiSuggestionPanel.vue'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, generateAiSuggestions } from '@/composables/useCloud.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { buildReleaseDiagnostics } from '@/utils/releaseDiagnostics.js'
import { showError, showSuccess } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const aiWarnings = ref([])
const aiSuggestions = ref([])

const diagnostics = computed(() => buildReleaseDiagnostics(store))
const diagnosticMetrics = computed(() => [
  { label: '阻断', value: diagnostics.value.blockers },
  { label: '建议', value: diagnostics.value.warnings },
  { label: '人工', value: diagnostics.value.manual },
  { label: '已完成', value: diagnostics.value.done }
])
const summaryText = computed(() => {
  if (diagnostics.value.blockers > 0) return `还有 ${diagnostics.value.blockers} 个阻断项，补齐后再分享更稳`
  if (diagnostics.value.warnings > 0) return `主链路可用，还有 ${diagnostics.value.warnings} 个建议项可优化`
  return '基础发布项完整，建议真机再走一遍分享和海报'
})

function statusText(status) {
  const map = {
    done: '已完成',
    warning: '建议补齐',
    blocker: '需处理',
    manual: '人工确认'
  }
  return map[status] || '待确认'
}

function goItem(item) {
  if (!item.route) return
  if (item.route.startsWith('/pages/guide') || item.route.startsWith('/pages/index')) {
    uni.switchTab({
      url: item.route,
      fail: (err) => {
        console.warn('打开诊断处理页面失败:', err)
        showError('处理页面打开失败，请稍后重试')
      }
    })
    return
  }
  uni.navigateTo({
    url: item.route,
    fail: (err) => {
      console.warn('打开诊断处理页面失败:', err)
      showError('处理页面打开失败，请稍后重试')
    }
  })
}

async function generateDiagnosticsAdvice() {
  if (aiLoading.value || loading.value) return
  aiLoading.value = true
  aiError.value = ''
  aiWarnings.value = []
  try {
    const res = await generateAiSuggestions('diagnostics_advice', {
      tone: 'luxury_refined',
      context: {
        coupleName: store.coupleName,
        weddingDate: store.weddingDate,
        readiness: {
          ready: diagnostics.value.ready,
          percent: diagnostics.value.percent,
          blockers: diagnostics.value.blockers,
          warnings: diagnostics.value.warnings,
          manual: diagnostics.value.manual
        },
        items: diagnostics.value.items.map(item => ({
          title: item.title,
          desc: item.desc,
          status: item.status,
          actionText: item.actionText
        }))
      }
    })
    aiSuggestions.value = res.suggestions || []
    aiWarnings.value = res.warnings || []
  } catch (err) {
    aiError.value = err?.message || 'AI 诊断建议生成失败，请稍后重试'
  } finally {
    aiLoading.value = false
  }
}

function copyDiagnosticsAdvice(item) {
  const list = Array.isArray(item?.content) ? item.content : []
  if (!list.length) {
    showError('候选建议为空')
    return
  }
  uni.setClipboardData({
    data: list.map((text, index) => `${index + 1}. ${text}`).join('\n'),
    success: () => showSuccess('已复制三步建议'),
    fail: () => showError('复制失败，请手动查看')
  })
}

async function refreshDiagnostics() {
  if (!(await useOwnerGuard())) return
  if (!userStore.weddingId) return
  if (loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.warn('发布诊断刷新数据失败:', err)
    loadError.value = err?.message || '发布诊断刷新失败，请稍后重试'
    showError(loadError.value)
  } finally {
    loading.value = false
  }
}

function goManage() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({
      fail: (err) => {
        console.warn('发布诊断返回失败:', err)
        uni.redirectTo({
          url: '/pages-owner/manage/index',
          fail: (redirectErr) => {
            console.warn('发布诊断返回后台失败:', redirectErr)
            showError('返回后台失败，请稍后重试')
          }
        })
      }
    })
    return
  }
  uni.redirectTo({
    url: '/pages-owner/manage/index',
    fail: (err) => {
      console.warn('发布诊断返回后台失败:', err)
      showError('返回后台失败，请稍后重试')
    }
  })
}

onShow(refreshDiagnostics)
</script>

<style lang="scss" scoped>
.diagnostics-page {
  min-height: 100vh;
  background: $bg-color;
}
.summary-card {
  margin: 0 $page-gutter 32rpx;
  padding: 34rpx;
  border-radius: $card-radius;
  background: var(--accent-ink);
  color: $ink-inverse;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}
.summary-card.ready {
  background: $text-primary;
}
.summary-card > view {
  min-width: 0;
}
.summary-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.summary-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}
.summary-desc {
  display: block;
  color: rgba(255,255,255,0.74);
  font-size: 24rpx;
  line-height: 1.5;
}
.summary-score {
  flex-shrink: 0;
  font-size: 48rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.diagnostic-section {
  margin-top: 34rpx;
}
.diagnostic-list {
  margin: 0 $page-gutter 42rpx;
  border-radius: $card-radius;
  border: 1rpx solid $border-color;
  overflow: hidden;
  background: $bg-surface;
}
.diagnostic-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: $tap-min-height;
  padding: 28rpx;
  border-bottom: 1rpx solid $border-color;
}
.diagnostic-item:last-child {
  border-bottom: none;
}
.diagnostic-item:active {
  background: $bg-muted;
}
.status-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: $text-muted;
}
.status-dot.done { background: $color-success; }
.status-dot.warning { background: $color-warning; }
.status-dot.blocker { background: $color-error; }
.status-dot.manual { background: $color-info; }
.diagnostic-meta {
  flex: 1;
  min-width: 0;
}
.diagnostic-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 8rpx;
}
.diagnostic-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.diagnostic-status {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-muted;
  font-size: 21rpx;
}
.diagnostic-status.done {
  color: $color-success;
  background: rgba(52,168,83,0.1);
}
.diagnostic-status.warning {
  color: $gold;
  background: rgba(249,171,0,0.12);
}
.diagnostic-status.blocker {
  color: $color-error;
  background: rgba(234,67,53,0.1);
}
.diagnostic-status.manual {
  color: $color-info;
  background: rgba(95,99,104,0.1);
}
.diagnostic-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.45;
  color: $text-secondary;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.diagnostic-action {
  flex-shrink: 0;
  font-size: 24rpx;
  color: $color-primary;
}
.note-card {
  margin: 0 $page-gutter;
  padding: 30rpx;
  border-radius: $card-radius;
  background: $bg-muted;
}
.note-title {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.note-copy {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-secondary;
}
</style>
