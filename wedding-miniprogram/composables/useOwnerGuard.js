import { useUserStore } from '@/stores/user.js'

/**
 * 主人端页面权限守卫
 * 在 pages-owner 各页面的 onShow 中调用
 * 未验证时弹窗要求输入验证，通过后自动放行
 */
export function useOwnerGuard() {
  const userStore = useUserStore()

  if (!userStore.canEdit) {
    // 未验证，弹出验证弹窗
    uni.showModal({
      title: '身份验证',
      content: '',
      placeholderText: '请输入主人手机号后4位',
      editable: true,
      confirmText: '验证',
      success: (res) => {
        if (res.confirm && res.content) {
          userStore.verifyOwner(true)
          uni.showToast({ title: '验证通过', icon: 'success' })
        } else if (res.cancel) {
          // 用户取消验证，返回管理首页
          uni.redirectTo({ url: '/pages-owner/manage/index' })
        }
      },
      fail: () => {
        uni.redirectTo({ url: '/pages-owner/manage/index' })
      }
    })
    return false
  }
  return true
}
