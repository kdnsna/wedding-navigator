import { useUserStore } from '@/stores/user.js'

/**
 * 主人端页面权限守卫
 * 在 pages-owner 各页面的 onShow 中调用
 * 未验证时弹窗提示并跳转回管理首页
 */
export function useOwnerGuard() {
  const userStore = useUserStore()

  if (!userStore.canEdit) {
    uni.showModal({
      title: '需要验证',
      content: '请先验证管理权限',
      showCancel: false,
      confirmText: '去验证',
      success: () => {
        uni.redirectTo({ url: '/pages-owner/manage/index' })
      }
    })
    return false
  }
  return true
}
